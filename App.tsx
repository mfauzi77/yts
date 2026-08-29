import React, { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { getChannelVideos, getRelatedVideos, searchVideos, getChannelPlaylists, getPlaylistItems } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem, Playlist, YouTubePlaylist } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useOfflinePlayer } from './hooks/useOfflinePlayer';
import { useDownloadManager } from './hooks/useDownloadManager';
import { LandingPage } from './components/LandingPage';
import { Sidebar, type MainView } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AutoplayOverlay } from './components/AutoplayOverlay';
import { SharedPlaylistModal } from './components/SharedPlaylistModal';
import { getSharedPlaylistFromCurrentUrl, clearShareParam } from './services/sharePlaylist';
import { AppHeader } from './components/AppHeader';

// Lazy load components
const Player = lazy(() => import('./components/Player').then(m => ({ default: m.Player })));
const SearchResultsList = lazy(() => import('./components/SearchResultsList').then(m => ({ default: m.SearchResultsList })));
const SearchView = lazy(() => import('./components/SearchView').then(m => ({ default: m.SearchView })));
const LibraryView = lazy(() => import('./components/LibraryView').then(m => ({ default: m.LibraryView })));
const LikedSongsView = lazy(() => import('./components/LikedSongsView').then(m => ({ default: m.LikedSongsView })));
const PlaylistListView = lazy(() => import('./components/Playlist').then(m => ({ default: m.PlaylistListView })));
const HistoryList = lazy(() => import('./components/HistoryList').then(m => ({ default: m.HistoryList })));
const OfflineList = lazy(() => import('./components/OfflineList').then(m => ({ default: m.OfflineList })));
const NowPlayingView = lazy(() => import('./components/NowPlayingView').then(m => ({ default: m.NowPlayingView })));
const ChannelView = lazy(() => import('./components/ChannelView').then(m => ({ default: m.ChannelView })));
const AddToPlaylistModal = lazy(() => import('./components/AddToPlaylistModal').then(m => ({ default: m.AddToPlaylistModal })));
const PlaylistDetailView = lazy(() => import('./components/PlaylistDetailView').then(m => ({ default: m.PlaylistDetailView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

type ApiStatus = 'idle' | 'success' | 'error';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand border-t-transparent"></div>
  </div>
);

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recommendations, setRecommendations] = useState<VideoItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(true);

  const [currentTrack, setCurrentTrack] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isNowPlayingViewOpen, setIsNowPlayingViewOpen] = useState(false);

  const [activeView, setActiveView] = useState<MainView>('home');
  const [viewHistory, setViewHistory] = useState<MainView[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [selectedChannel, setSelectedChannel] = useState<{ id: string; title: string } | null>(null);
  const [channelVideos, setChannelVideos] = useState<VideoItem[]>([]);
  const [channelPlaylists, setChannelPlaylists] = useState<YouTubePlaylist[]>([]);
  const [isChannelLoading, setIsChannelLoading] = useState<boolean>(false);
  const [isChannelMoreLoading, setIsChannelMoreLoading] = useState<boolean>(false);
  const [channelNextPageToken, setChannelNextPageToken] = useState<string | undefined>(undefined);

  const [selectedYouTubePlaylist, setSelectedYouTubePlaylist] = useState<YouTubePlaylist | null>(null);
  const [youtubePlaylistVideos, setYoutubePlaylistVideos] = useState<VideoItem[]>([]);
  const [_isYoutubePlaylistLoading, setIsYoutubePlaylistLoading] = useState<boolean>(false);

  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [isAppEntered, setIsAppEntered] = useState<boolean>(true);
  const [isLandingPageMounted, setIsLandingPageMounted] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('ytas-playlists', []);
  const [history, setHistory] = useLocalStorage<VideoItem[]>('ytas-history', []);
  const [offlineItems, setOfflineItems] = useLocalStorage<VideoItem[]>('ytas-offline', []);
  const [syncedOfflineIds, setSyncedOfflineIds] = useLocalStorage<string[]>('ytas-synced-ids', []);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useLocalStorage<boolean>('ytas-autoplay', true);
  const [isShuffle, setIsShuffle] = useLocalStorage<boolean>('ytas-shuffle', false);
  const [likedSongs, setLikedSongs] = useLocalStorage<string[]>('ytas-liked-songs', []);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('ytas-search-history', []);

  // Storage & Auto Cleanup Configuration
  const [historyLimit, setHistoryLimit] = useLocalStorage<number>('ytas-history-limit', 50);
  const [historyMaxAgeDays, setHistoryMaxAgeDays] = useLocalStorage<number>('ytas-history-max-age', 30);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useLocalStorage<boolean>('ytas-auto-cleanup', true);
  const [autoClearCacheOnStartup, setAutoClearCacheOnStartup] = useLocalStorage<boolean>('ytas-auto-clear-cache', false);

  // Sleep Timer State
  const [sleepTimerEndTime, setSleepTimerEndTime] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const activeSetVolumeRef = useRef<(vol: number) => void>(() => {});
  const baseVolumeRef = useRef<number>(100);
  const sleepTimerEndTimeRef = useRef<number | null>(null);

  const handleSetSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null || minutes <= 0) {
      if (sleepTimerEndTimeRef.current && sleepTimerEndTimeRef.current - Date.now() <= 10000) {
        activeSetVolumeRef.current(baseVolumeRef.current);
      }
      setSleepTimerEndTime(null);
      setSleepTimerRemaining(null);
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      setSleepTimerEndTime(endTime);
      setSleepTimerRemaining(minutes * 60);
    }
  }, []);

  useEffect(() => {
    if (!sleepTimerEndTime) {
      setSleepTimerRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = sleepTimerEndTime - now;
      if (diffMs <= 0) {
        setIsPlaying(false);
        if (baseVolumeRef.current !== undefined) {
          activeSetVolumeRef.current(baseVolumeRef.current);
        }
        setSleepTimerEndTime(null);
        setSleepTimerRemaining(null);
        setError('Pengatur waktu tidur telah berakhir. Pemutaran musik dihentikan.');
      } else {
        setSleepTimerRemaining(Math.ceil(diffMs / 1000));
        if (diffMs <= 10000) {
          const fraction = Math.max(0, diffMs / 10000);
          const targetVolume = Math.round(baseVolumeRef.current * fraction);
          activeSetVolumeRef.current(targetVolume);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime]);

  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [modalTrack, setModalTrack] = useState<VideoItem | null>(null);
  const [sharedPlaylist, setSharedPlaylist] = useState<Playlist | null>(null);

  const [activePlaybackList, setActivePlaybackList] = useState<VideoItem[]>([]);
  const currentTrackIndexRef = useRef(-1);

  // --- Download Manager ---
  const { downloadTrack, deleteOfflineTrack, getDownloadState, refreshSavedIds } = useDownloadManager();

  // --- Shared Playlist via URL ---
  useEffect(() => {
    const parsed = getSharedPlaylistFromCurrentUrl();
    if (parsed && parsed.tracks.length > 0) {
      setSharedPlaylist(parsed);
      clearShareParam();
    }
  }, []);

  const handleApiError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Terjadi galat.';
    setError(message);
    setApiStatus('error');
  };

  const handleAddToOffline = useCallback((track: VideoItem) => {
    setOfflineItems((prev) => {
      const alreadyExists = prev.some((item) => item.id.videoId === track.id.videoId);
      if (alreadyExists) return prev;
      return [track, ...prev];
    });
  }, [setOfflineItems]);

  const handleDownloadTrack = useCallback(
    async (track: VideoItem) => {
      handleAddToOffline(track);
      await downloadTrack(track);
    },
    [handleAddToOffline, downloadTrack]
  );

  // Check offline status on startup
  useEffect(() => {
    if (offlineItems.length > 0) {
      refreshSavedIds(offlineItems.map((i) => i.id.videoId));
    }
  }, [offlineItems, refreshSavedIds]);

  useEffect(() => {
    if (apiStatus === 'success' || apiStatus === 'error') {
      const timer = setTimeout(() => setApiStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [apiStatus]);

  // Derived Liked Tracks collection
  const likedTracks = useMemo(() => {
    const map = new Map<string, VideoItem>();
    const allKnown = [
      ...(currentTrack ? [currentTrack] : []),
      ...history,
      ...offlineItems,
      ...recommendations,
      ...(searchResults || []),
      ...playlists.flatMap((p) => p.tracks),
    ];
    for (const item of allKnown) {
      if (likedSongs.includes(item.id.videoId) && !map.has(item.id.videoId)) {
        map.set(item.id.videoId, item);
      }
    }
    return Array.from(map.values());
  }, [likedSongs, currentTrack, history, offlineItems, recommendations, searchResults, playlists]);

  const fetchPersonalizedRecommendations = useCallback(async () => {
    if (!isAppEntered) return;
    setIsRecommendationsLoading(true);
    try {
      const seeds: { type: 'history' | 'playlist' | 'search'; videoId?: string; query?: string; title?: string }[] = [];

      if (history.length > 0) {
        seeds.push({
          type: 'history',
          videoId: history[0].id.videoId,
          title: history[0].snippet.title,
        });
      }

      const playlistsWithTracks = playlists.filter((p) => p.tracks.length > 0);
      if (playlistsWithTracks.length > 0) {
        const randomPL = playlistsWithTracks[Math.floor(Math.random() * playlistsWithTracks.length)];
        const randomTrack = randomPL.tracks[Math.floor(Math.random() * randomPL.tracks.length)];
        seeds.push({
          type: 'playlist',
          videoId: randomTrack.id.videoId,
          title: randomTrack.snippet.title,
        });
      }

      if (searchHistory.length > 0) {
        seeds.push({ type: 'search', query: searchHistory[0] });
      }

      // Default seed if completely empty
      if (seeds.length === 0) {
        seeds.push({ type: 'search', query: 'lagu indonesia populer terbaru' });
      }

      const results = await Promise.all(
        seeds.map(async (seed) => {
          try {
            if (seed.type === 'search' && seed.query) {
              return await searchVideos(seed.query);
            } else if (seed.videoId) {
              return await getRelatedVideos(seed.videoId, seed.title);
            }
            return [];
          } catch {
            return [];
          }
        })
      );

      const interleaved: VideoItem[] = [];
      const seenIds = new Set<string>();
      if (currentTrack) seenIds.add(currentTrack.id.videoId);

      const maxLen = Math.max(...results.map((r) => r.length));
      for (let i = 0; i < maxLen; i++) {
        for (let j = 0; j < results.length; j++) {
          const item = results[j][i];
          if (item && !seenIds.has(item.id.videoId)) {
            interleaved.push(item);
            seenIds.add(item.id.videoId);
          }
        }
      }

      setRecommendations(interleaved.slice(0, 40));
      setApiStatus('success');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsRecommendationsLoading(false);
    }
  }, [history, playlists, searchHistory, isAppEntered, currentTrack]);

  useEffect(() => {
    if (!isAppEntered) return;
    if (recommendations.length === 0) {
      fetchPersonalizedRecommendations();
    }
  }, [isAppEntered, recommendations.length, fetchPersonalizedRecommendations]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      setIsSearchLoading(true);
      setError(null);
      if (activeView !== 'search') {
        navigateToView('search');
      }

      setSearchHistory((prev) => {
        const trimmed = query.trim();
        const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...filtered].slice(0, 10);
      });

      try {
        const results = await searchVideos(query);
        setSearchResults(results);
        setApiStatus('success');
      } catch (err) {
        handleApiError(err);
      } finally {
        setIsSearchLoading(false);
      }
    },
    [setSearchHistory, activeView]
  );

  const addToHistory = useCallback(
    (track: VideoItem) => {
      setHistory((prevHistory) => {
        const trackWithTimestamp = {
          ...track,
          _playedAt: Date.now(),
        };
        const filtered = prevHistory.filter((item) => item.id.videoId !== track.id.videoId);
        return [trackWithTimestamp, ...filtered].slice(0, historyLimit);
      });
    },
    [setHistory, historyLimit]
  );

  // Playback Hooks
  const playNextRef = useRef<() => void>(() => {});
  const playPrevRef = useRef<() => void>(() => {});

  const handleTrackEnded = useCallback(() => {
    if (isAutoplayEnabled) {
      playNextRef.current();
    } else {
      setIsPlaying(false);
    }
  }, [isAutoplayEnabled]);

  const youtubePlayerData = useYouTubePlayer({
    videoId: currentTrack?.id.videoId || null,
    isPlaying,
    onStateChange: (event) => {
      if (event?.data === 0) {
        handleTrackEnded();
      }
    },
  });
  const offlinePlayerData = useOfflinePlayer({
    videoId: currentTrack?.id.videoId || null,
    isPlaying,
    onEnded: handleTrackEnded,
  });

  const isLocalMode = offlinePlayerData.isLocalMode;
  const activeCurrentTime = isLocalMode ? offlinePlayerData.localCurrentTime : youtubePlayerData.currentTime;
  const activeDuration = isLocalMode ? offlinePlayerData.localDuration : youtubePlayerData.duration;
  const activeSeekTo = isLocalMode ? offlinePlayerData.localSeekTo : youtubePlayerData.seekTo;
  const activeVolume = isLocalMode ? offlinePlayerData.localVolume : youtubePlayerData.volume;
  const activeSetVolume = isLocalMode ? offlinePlayerData.localSetVolume : youtubePlayerData.setVolume;

  activeSetVolumeRef.current = activeSetVolume;
  baseVolumeRef.current = activeVolume;

  const handleSelectTrack = useCallback(
    (track: VideoItem, contextList: VideoItem[] = []) => {
      setCurrentTrack(track);
      setIsPlaying(true);
      addToHistory(track);

      if (contextList.length > 0) {
        setActivePlaybackList(contextList);
        currentTrackIndexRef.current = contextList.findIndex((t) => t.id.videoId === track.id.videoId);
      } else {
        setActivePlaybackList([track]);
        currentTrackIndexRef.current = 0;
      }
    },
    [addToHistory]
  );

  const playNext = useCallback(() => {
    if (activePlaybackList.length === 0) return;
    let nextIdx = currentTrackIndexRef.current + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * activePlaybackList.length);
    } else if (nextIdx >= activePlaybackList.length) {
      nextIdx = 0;
    }
    const nextTrack = activePlaybackList[nextIdx];
    if (nextTrack) {
      currentTrackIndexRef.current = nextIdx;
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      addToHistory(nextTrack);
    }
  }, [activePlaybackList, isShuffle, addToHistory]);

  const playPrev = useCallback(() => {
    if (activePlaybackList.length === 0) return;
    let prevIdx = currentTrackIndexRef.current - 1;
    if (prevIdx < 0) {
      prevIdx = activePlaybackList.length - 1;
    }
    const prevTrack = activePlaybackList[prevIdx];
    if (prevTrack) {
      currentTrackIndexRef.current = prevIdx;
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
      addToHistory(prevTrack);
    }
  }, [activePlaybackList, addToHistory]);

  playNextRef.current = playNext;
  playPrevRef.current = playPrev;

  // Navigation History
  const navigateToView = useCallback((view: MainView) => {
    setViewHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, view];
    });
    setHistoryIndex((prev) => prev + 1);
    setActiveView(view);
  }, [historyIndex]);

  const handleGoBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setActiveView(viewHistory[newIndex]);
    } else if (activeView !== 'home') {
      setActiveView('home');
    }
  }, [historyIndex, viewHistory, activeView]);

  const handleGoForward = useCallback(() => {
    if (historyIndex < viewHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setActiveView(viewHistory[newIndex]);
    }
  }, [historyIndex, viewHistory]);

  const handleOpenAddToPlaylistModal = (track: VideoItem) => setModalTrack(track);
  const handleCloseAddToPlaylistModal = () => setModalTrack(null);

  const handleAddTrackToPlaylist = (playlistId: string, track: VideoItem) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId && !p.tracks.some((t) => t.id.videoId === track.id.videoId)) {
          return { ...p, tracks: [...p.tracks, track] };
        }
        return p;
      })
    );
    setActivePlaylist((prev) => {
      if (prev && prev.id === playlistId && !prev.tracks.some((t) => t.id.videoId === track.id.videoId)) {
        return { ...prev, tracks: [...prev.tracks, track] };
      }
      return prev;
    });
  };

  const handleCreatePlaylistAndAdd = (name: string, track: VideoItem) => {
    const newPlaylist: Playlist = { id: `playlist-${Date.now()}`, name, tracks: [track] };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    handleCloseAddToPlaylistModal();
  };

  const handleToggleLike = useCallback(
    (track: VideoItem) => {
      setLikedSongs((prev) =>
        prev.includes(track.id.videoId) ? prev.filter((id) => id !== track.id.videoId) : [...prev, track.id.videoId]
      );
    },
    [setLikedSongs]
  );

  const handleSelectChannel = useCallback(async (channelId: string, channelTitle: string) => {
    setIsChannelLoading(true);
    setSelectedChannel({ id: channelId, title: channelTitle });
    navigateToView('channel');
    setChannelVideos([]);
    setChannelPlaylists([]);
    setChannelNextPageToken(undefined);
    setIsChannelMoreLoading(false);
    try {
      const [videoData, playlistData] = await Promise.all([
        getChannelVideos(channelId),
        getChannelPlaylists(channelId),
      ]);
      setChannelVideos(videoData.items);
      setChannelNextPageToken(videoData.nextPageToken);
      setChannelPlaylists(playlistData.items);
      setApiStatus('success');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsChannelLoading(false);
    }
  }, [navigateToView]);

  const handleLoadMoreChannelVideos = useCallback(async () => {
    if (!selectedChannel || !channelNextPageToken || isChannelMoreLoading) return;
    setIsChannelMoreLoading(true);
    try {
      const videoData = await getChannelVideos(selectedChannel.id, 'date', 50, channelNextPageToken);
      setChannelVideos((prev) => [...prev, ...videoData.items]);
      setChannelNextPageToken(videoData.nextPageToken);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsChannelMoreLoading(false);
    }
  }, [selectedChannel, channelNextPageToken, isChannelMoreLoading]);

  const handleSelectYouTubePlaylist = useCallback(async (playlist: YouTubePlaylist) => {
    setIsYoutubePlaylistLoading(true);
    setSelectedYouTubePlaylist(playlist);
    navigateToView('youtubePlaylistDetail');
    setYoutubePlaylistVideos([]);
    try {
      const { items } = await getPlaylistItems(playlist.id);
      setYoutubePlaylistVideos(items);
      setApiStatus('success');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsYoutubePlaylistLoading(false);
    }
  }, [navigateToView]);

  const handleEnterApp = () => {
    setIsAppEntered(true);
    setTimeout(() => setIsLandingPageMounted(false), 500);
  };

  const renderMainView = () => {
    switch (activeView) {
      case 'home':
        return (
          <SearchResultsList
            items={recommendations}
            onSelectTrack={handleSelectTrack}
            onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
            onSelectChannel={handleSelectChannel}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            onDeleteOffline={deleteOfflineTrack}
            currentTrackId={currentTrack?.id.videoId}
            isPlaying={isPlaying}
            onToggleLike={handleToggleLike}
            likedTrackIds={likedSongs}
            historyTracks={history}
            onNavigateToSearch={(query) => {
              handleSearch(query);
            }}
          />
        );

      case 'search':
        return (
          <SearchView
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchResults={searchResults || []}
            isLoading={isSearchLoading}
            onSelectTrack={handleSelectTrack}
            currentTrackId={currentTrack?.id.videoId}
            isPlaying={isPlaying}
            onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
            onSelectChannel={handleSelectChannel}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
          />
        );

      case 'library':
        return (
          <LibraryView
            playlists={playlists}
            onSelectPlaylist={(p) => {
              setActivePlaylist(p);
              navigateToView('playlistDetail');
            }}
            onCreatePlaylist={() => {
              const name = prompt('Masukkan nama playlist baru:');
              if (name && name.trim()) {
                setPlaylists((p) => [...p, { id: `pl-${Date.now()}`, name: name.trim(), tracks: [] }]);
              }
            }}
            likedTracks={likedTracks}
            onSelectLikedSongs={() => navigateToView('liked')}
            offlineTracks={offlineItems}
            onSelectOffline={() => navigateToView('offline')}
            historyTracks={history}
            onSelectHistory={() => navigateToView('history')}
            onSelectTrack={handleSelectTrack}
          />
        );

      case 'liked':
        return (
          <LikedSongsView
            likedTracks={likedTracks}
            onSelectTrack={handleSelectTrack}
            onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
            onSelectChannel={handleSelectChannel}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            currentTrackId={currentTrack?.id.videoId}
            isPlaying={isPlaying}
            onToggleLike={handleToggleLike}
            onBack={handleGoBack}
          />
        );

      case 'playlists':
        return (
          <PlaylistListView
            playlists={playlists}
            onSelectPlaylist={(p) => {
              setActivePlaylist(p);
              navigateToView('playlistDetail');
            }}
            onCreatePlaylist={(name) => setPlaylists((p) => [...p, { id: `pl-${Date.now()}`, name, tracks: [] }])}
            onSelectTrack={handleSelectTrack}
            currentTrackId={currentTrack?.id.videoId}
          />
        );

      case 'playlistDetail':
        if (!activePlaylist) return null;
        return (
          <PlaylistDetailView
            playlist={activePlaylist}
            onSelectTrack={handleSelectTrack}
            onRemoveFromPlaylist={(trackId) => {
              setPlaylists((prev) =>
                prev.map((p) =>
                  p.id === activePlaylist.id
                    ? { ...p, tracks: p.tracks.filter((t) => t.id.videoId !== trackId) }
                    : p
                )
              );
              setActivePlaylist((prev) =>
                prev ? { ...prev, tracks: prev.tracks.filter((t) => t.id.videoId !== trackId) } : null
              );
            }}
            onSelectChannel={handleSelectChannel}
            currentTrackId={currentTrack?.id.videoId}
            isPlaying={isPlaying}
            isAutoplayEnabled={isAutoplayEnabled}
            onToggleAutoplay={() => setIsAutoplayEnabled((p) => !p)}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            onBack={handleGoBack}
            onDelete={() => {
              setPlaylists((p) => p.filter((pl) => pl.id !== activePlaylist.id));
              navigateToView('library');
            }}
            onRename={(newName) => {
              setPlaylists((p) => p.map((pl) => (pl.id === activePlaylist.id ? { ...pl, name: newName } : pl)));
              setActivePlaylist((prev) => (prev ? { ...prev, name: newName } : null));
            }}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
          />
        );

      case 'history':
        return (
          <HistoryList
            history={history}
            onSelectTrack={handleSelectTrack}
            onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
            onSelectChannel={handleSelectChannel}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            currentTrackId={currentTrack?.id.videoId}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
            onClearHistory={() => setHistory([])}
          />
        );

      case 'offline':
        return (
          <OfflineList
            offlinePlaylist={offlineItems}
            syncedOfflineIds={syncedOfflineIds}
            onSelectTrack={handleSelectTrack}
            onRemoveFromOfflinePlaylist={deleteOfflineTrack}
            onSelectChannel={handleSelectChannel}
            currentTrackId={currentTrack?.id.videoId}
            isSyncing={false}
            onStartSync={() => {}}
            syncingTrackProgress={0}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
          />
        );

      case 'channel':
        if (!selectedChannel) return null;
        return (
          <ChannelView
            channelTitle={selectedChannel.title}
            videos={channelVideos}
            playlists={channelPlaylists}
            isLoading={isChannelLoading}
            isMoreLoading={isChannelMoreLoading}
            onSelectTrack={handleSelectTrack}
            onSelectPlaylist={handleSelectYouTubePlaylist}
            onBack={handleGoBack}
            onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
            onAddToOffline={handleAddToOffline}
            offlineItems={offlineItems}
            currentTrackId={currentTrack?.id.videoId}
            onLoadMore={handleLoadMoreChannelVideos}
            hasNextPage={!!channelNextPageToken}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
          />
        );

      case 'youtubePlaylistDetail':
        if (!selectedYouTubePlaylist) return null;
        return (
          <PlaylistDetailView
            playlist={{
              id: selectedYouTubePlaylist.id,
              name: selectedYouTubePlaylist.snippet.title,
              tracks: youtubePlaylistVideos,
            }}
            onSelectTrack={handleSelectTrack}
            onRemoveFromPlaylist={() => {}}
            onSelectChannel={handleSelectChannel}
            currentTrackId={currentTrack?.id.videoId}
            isPlaying={isPlaying}
            isAutoplayEnabled={isAutoplayEnabled}
            onToggleAutoplay={() => setIsAutoplayEnabled((p) => !p)}
            offlineItems={offlineItems}
            onAddToOffline={handleAddToOffline}
            onBack={handleGoBack}
            onDelete={() => {}}
            onRename={() => {}}
            isYouTubePlaylist={true}
            likedTrackIds={likedSongs}
            onToggleLike={handleToggleLike}
          />
        );

      case 'settings':
        return (
          <SettingsView
            history={history}
            setHistory={setHistory}
            searchHistory={searchHistory}
            setSearchHistory={setSearchHistory}
            offlineItems={offlineItems}
            setOfflineItems={setOfflineItems}
            playlists={playlists}
            historyLimit={historyLimit}
            setHistoryLimit={setHistoryLimit}
            historyMaxAgeDays={historyMaxAgeDays}
            setHistoryMaxAgeDays={setHistoryMaxAgeDays}
            autoCleanupEnabled={autoCleanupEnabled}
            setAutoCleanupEnabled={setAutoCleanupEnabled}
            autoClearCacheOnStartup={autoClearCacheOnStartup}
            setAutoClearCacheOnStartup={setAutoClearCacheOnStartup}
            sleepTimerRemaining={sleepTimerRemaining}
            onSetSleepTimer={handleSetSleepTimer}
            onBack={handleGoBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-brand selection:text-white font-sans">
      {isLandingPageMounted && <LandingPage onEnter={handleEnterApp} isExiting={isAppEntered} />}

      {/* Shared Playlist Modal */}
      {sharedPlaylist && (
        <SharedPlaylistModal
          playlist={sharedPlaylist}
          onListen={(pl) => {
            if (pl.tracks.length > 0) {
              handleSelectTrack(pl.tracks[0], pl.tracks);
              if (!isAppEntered) handleEnterApp();
            }
            setSharedPlaylist(null);
          }}
          onAddToMyPlaylist={(pl) => {
            const newPlaylist: Playlist = {
              ...pl,
              id: `pl-shared-${Date.now()}`,
            };
            setPlaylists((prev) => [newPlaylist, ...prev]);
            setSharedPlaylist(null);
            setIsAppEntered(true);
            setTimeout(() => {
              setIsLandingPageMounted(false);
              navigateToView('library');
            }, 300);
          }}
          onDismiss={() => {
            setSharedPlaylist(null);
            if (!isAppEntered) handleEnterApp();
          }}
        />
      )}

      <Suspense fallback={null}>
        {modalTrack && (
          <AddToPlaylistModal
            track={modalTrack}
            playlists={playlists}
            onClose={handleCloseAddToPlaylistModal}
            onAddToPlaylist={handleAddTrackToPlaylist}
            onCreateAndAdd={handleCreatePlaylistAndAdd}
          />
        )}
      </Suspense>

      {/* Full App Grid Structure */}
      <div
        className={`flex h-screen w-screen overflow-hidden transition-opacity duration-300 ${
          isAppEntered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={navigateToView}
          playlists={playlists}
          onSelectPlaylist={(p) => {
            setActivePlaylist(p);
            navigateToView('playlistDetail');
          }}
          onCreatePlaylist={() => {
            const name = prompt('Masukkan nama playlist baru:');
            if (name && name.trim()) {
              setPlaylists((p) => [...p, { id: `pl-${Date.now()}`, name: name.trim(), tracks: [] }]);
            }
          }}
          sleepTimerRemaining={sleepTimerRemaining}
          likedCount={likedTracks.length}
          offlineCount={offlineItems.length}
        />

        {/* Main Center Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0A0A0A] md:my-2 md:mr-2 md:rounded-xl border border-white/5">
          {/* Top Sticky Header */}
          <AppHeader
            searchQuery={searchQuery}
            onSearch={handleSearch}
            isLoading={isSearchLoading}
            sleepTimerRemaining={sleepTimerRemaining}
            onOpenSettings={() => navigateToView('settings')}
            apiStatus={apiStatus}
            onBack={handleGoBack}
            canGoBack={historyIndex > 0 || activeView !== 'home'}
            onForward={handleGoForward}
            canGoForward={historyIndex < viewHistory.length - 1}
            showSearchBar={activeView === 'search'}
          />

          {/* Scrollable View Area */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 pb-36 md:pb-24">
            <div className="max-w-7xl mx-auto">
              {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}
              <Suspense fallback={<LoadingSpinner />}>{renderMainView()}</Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Docked / Persistent Bottom Music Player */}
      <Suspense fallback={null}>
        {currentTrack && (
          <footer className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <Player
                track={currentTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                onNext={playNext}
                onPrev={playPrev}
                onToggleNowPlaying={() => setIsNowPlayingViewOpen(true)}
                volume={activeVolume}
                setVolume={activeSetVolume}
                currentTime={activeCurrentTime}
                duration={activeDuration}
                seekTo={activeSeekTo}
                onSelectChannel={handleSelectChannel}
                isAutoplayEnabled={isAutoplayEnabled}
                onToggleAutoplay={() => setIsAutoplayEnabled((p) => !p)}
                isShuffleEnabled={isShuffle}
                onToggleShuffle={() => setIsShuffle((p) => !p)}
                isLiked={likedSongs.includes(currentTrack.id.videoId)}
                onToggleLike={() => handleToggleLike(currentTrack)}
                onOpenAddToPlaylist={() => handleOpenAddToPlaylistModal(currentTrack)}
              />
            </div>
          </footer>
        )}
      </Suspense>

      {/* Fullscreen Immersive Now Playing Modal */}
      <Suspense fallback={null}>
        {currentTrack && (
          <NowPlayingView
            isOpen={isNowPlayingViewOpen}
            onClose={() => setIsNowPlayingViewOpen(false)}
            track={currentTrack}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onNext={playNext}
            onPrev={playPrev}
            volume={activeVolume}
            setVolume={activeSetVolume}
            currentTime={activeCurrentTime}
            duration={activeDuration}
            seekTo={activeSeekTo}
            isAutoplayEnabled={isAutoplayEnabled}
            onToggleAutoplay={() => setIsAutoplayEnabled((p) => !p)}
            isShuffleEnabled={isShuffle}
            onToggleShuffle={() => setIsShuffle((p) => !p)}
            isLiked={likedSongs.includes(currentTrack.id.videoId)}
            onToggleLike={() => handleToggleLike(currentTrack)}
            onOpenAddToPlaylist={() => handleOpenAddToPlaylistModal(currentTrack)}
            onSelectChannel={handleSelectChannel}
          >
            {isAutoplayBlocked && (
              <AutoplayOverlay track={currentTrack} onForcePlay={() => setIsPlaying(true)} />
            )}
          </NowPlayingView>
        )}
      </Suspense>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeView={activeView}
        setActiveView={navigateToView}
        onFocusSearch={() => {
          navigateToView('search');
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }}
      />
    </div>
  );
};

export default App;
