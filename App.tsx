

import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { SearchBar } from './components/SearchBar';
import { getChannelVideos, getRelatedVideos, searchVideos } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem, Playlist } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AutoplayOverlay } from './components/AutoplayOverlay';

// Lazy load components that are not critical for the initial render
const Player = lazy(() => import('./components/Player').then(m => ({ default: m.Player })));
const SearchResultList = lazy(() => import('./components/SearchResultsList').then(m => ({ default: m.SearchResultList })));
const PlaylistListView = lazy(() => import('./components/Playlist').then(m => ({ default: m.PlaylistListView })));
const HistoryList = lazy(() => import('./components/HistoryList').then(m => ({ default: m.HistoryList })));
const NowPlayingView = lazy(() => import('./components/NowPlayingView').then(m => ({ default: m.NowPlayingView })));
const ChannelView = lazy(() => import('./components/ChannelView').then(m => ({ default: m.ChannelView })));
const FloatingPlayer = lazy(() => import('./components/FloatingPlayer').then(m => ({ default: m.FloatingPlayer })));
const OfflineList = lazy(() => import('./components/OfflineList').then(m => ({ default: m.OfflineList })));
const AddToPlaylistModal = lazy(() => import('./components/AddToPlaylistModal').then(m => ({ default: m.AddToPlaylistModal })));
const PlaylistDetailView = lazy(() => import('./components/PlaylistDetailView').then(m => ({ default: m.PlaylistDetailView })));
const VideoFeed = lazy(() => import('./components/VideoFeed').then(m => ({ default: m.VideoFeed })));


type MainView = 'home' | 'playlists' | 'playlistDetail' | 'history' | 'offline' | 'channel' | 'video';
type ApiStatus = 'idle' | 'success' | 'error';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
    </div>
);

const App: React.FC = () => {
    const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
    const [recommendations, setRecommendations] = useState<VideoItem[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
    const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(true);

    const [currentTrack, setCurrentTrack] = useState<VideoItem | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isNowPlayingViewOpen, setIsNowPlayingViewOpen] = useState(false);
    const [startInVideoMode, setStartInVideoMode] = useState(false);
    
    const [activeView, setActiveView] = useState<MainView>('home');
    const [selectedChannel, setSelectedChannel] = useState<{ id: string; title: string } | null>(null);
    const [channelVideos, setChannelVideos] = useState<VideoItem[]>([]);
    const [isChannelLoading, setIsChannelLoading] = useState<boolean>(false);
    const [isChannelMoreLoading, setIsChannelMoreLoading] = useState<boolean>(false);
    const [channelNextPageToken, setChannelNextPageToken] = useState<string | undefined>(undefined);
    const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false);
    const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
    const [isAppEntered, setIsAppEntered] = useState<boolean>(false);
    const [isLandingPageMounted, setIsLandingPageMounted] = useState<boolean>(true);
    const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

    const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('ytas-playlists', []);
    const [history, setHistory] = useLocalStorage<VideoItem[]>('ytas-history', []);
    const [offlineItems, setOfflineItems] = useLocalStorage<VideoItem[]>('ytas-offline', []);
    const [syncedOfflineIds, setSyncedOfflineIds] = useLocalStorage<string[]>('ytas-synced-ids', []);
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useLocalStorage<boolean>('ytas-autoplay', true);
    const [likedSongs, setLikedSongs] = useLocalStorage<string[]>('ytas-liked-songs', []);
    
    const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
    const [modalTrack, setModalTrack] = useState<VideoItem | null>(null);

    const [activePlaybackList, setActivePlaybackList] = useState<VideoItem[]>([]);
    const currentTrackIndexRef = React.useRef(-1);
    const isAttemptingAutoplay = useRef(false);
    
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);
    const syncQueueRef = useRef<VideoItem[]>([]);
    const [syncingTrackProgress, setSyncingTrackProgress] = useState<number>(0);


    useEffect(() => {
        const oldPlaylistJson = localStorage.getItem('ytas-playlist');
        if (oldPlaylistJson) {
            try {
                const oldPlaylistTracks: VideoItem[] = JSON.parse(oldPlaylistJson);
                if (Array.isArray(oldPlaylistTracks) && oldPlaylistTracks.length > 0) {
                    const newPlaylist: Playlist = {
                        id: `migrated-${Date.now()}`,
                        name: 'My Old Playlist',
                        tracks: oldPlaylistTracks
                    };
                    setPlaylists(prev => [newPlaylist, ...prev]);
                }
            } catch (e) {
                console.error("Failed to migrate old playlist:", e);
            } finally {
                localStorage.removeItem('ytas-playlist');
            }
        }
    }, [setPlaylists]);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Terjadi galat yang tidak diketahui.';
        console.error("API Error:", err);
        setError(message);
        setApiStatus('error');
    };

    useEffect(() => {
        if (apiStatus === 'success' || apiStatus === 'error') {
            const timer = setTimeout(() => setApiStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [apiStatus]);

    useEffect(() => {
        if (!isAppEntered) return;

        const fetchRecommendations = async () => {
            if (history.length > 0) {
                setIsRecommendationsLoading(true);
                setError(null);
                try {
                    const results = await getRelatedVideos(history[0].id.videoId);
                    setRecommendations(results.filter(v => v.id.videoId !== history[0].id.videoId));
                    setApiStatus('success');
                } catch (err) { handleApiError(err); } 
                finally { setIsRecommendationsLoading(false); }
            } else {
                setRecommendations([]);
                setIsRecommendationsLoading(false);
            }
        };
        fetchRecommendations();
    }, [history, isAppEntered]);
    
    const handleGenerateDiscoveryMix = useCallback(async () => {
        setIsRecommendationsLoading(true);
        setError(null);
        setSearchResults(null);
        setActiveView('home');
    
        try {
            const historySeeds = history.slice(0, 3);
            const playlistSeeds = playlists.flatMap(p => p.tracks).sort(() => 0.5 - Math.random()).slice(0, 2);
            const seedTracks = [...new Map([...historySeeds, ...playlistSeeds].map(item => [item.id.videoId, item])).values()];
    
            if (seedTracks.length === 0) {
                setRecommendations([]);
                return;
            }
    
            const resultsArrays = await Promise.all(seedTracks.map(track => getRelatedVideos(track.id.videoId)));
            const allRelatedVideos = resultsArrays.flat();
            const uniqueVideosMap = new Map<string, VideoItem>();
            allRelatedVideos.forEach(video => {
                if (!seedTracks.some(seed => seed.id.videoId === video.id.videoId)) {
                    uniqueVideosMap.set(video.id.videoId, video);
                }
            });
            
            setRecommendations([...uniqueVideosMap.values()].sort(() => 0.5 - Math.random()));
            setApiStatus('success');
    
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsRecommendationsLoading(false);
        }
    }, [history, playlists]);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        setIsSearchLoading(true);
        setSearchResults([]);
        setError(null);
        setActiveView('home');
        try {
            const results = await searchVideos(query);
            setSearchResults(results);
            setApiStatus('success');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsSearchLoading(false);
        }
    }, []);
    
    const addToHistory = useCallback((track: VideoItem) => {
        setHistory(prevHistory => {
            const newHistory = [track, ...prevHistory.filter(item => item.id.videoId !== track.id.videoId)];
            return newHistory.slice(0, 50);
        });
    }, [setHistory]);

    const handleSelectTrack = useCallback((track: VideoItem, contextList: VideoItem[] = []) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
        setStartInVideoMode(false); // Reset video mode default
        addToHistory(track);

        if (offlineItems.some(i => i.id.videoId === track.id.videoId)) {
            setSyncedOfflineIds(prev => [...new Set([...prev, track.id.videoId])]);
        }

        setActivePlaybackList(contextList);
        currentTrackIndexRef.current = contextList.findIndex(item => item.id.videoId === track.id.videoId);
        
        if (window.innerWidth < 768) {
            setIsNowPlayingViewOpen(true);
        }
    }, [addToHistory, offlineItems, setSyncedOfflineIds]);

    const handleSelectVideo = useCallback((track: VideoItem, contextList: VideoItem[] = []) => {
        handleSelectTrack(track, contextList);
        setStartInVideoMode(true);
        setIsNowPlayingViewOpen(true);
    }, [handleSelectTrack]);
    
    const playNext = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        isAttemptingAutoplay.current = true;
        currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % activePlaybackList.length;
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack]);

    const playPrev = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        isAttemptingAutoplay.current = false;
        currentTrackIndexRef.current = (currentTrackIndexRef.current - 1 + activePlaybackList.length) % activePlaybackList.length;
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack]);
    
    const playRelatedVideo = useCallback(async () => {
        if (!currentTrack) return;
        isAttemptingAutoplay.current = true;
        try {
            const relatedVideos = await getRelatedVideos(currentTrack.id.videoId);
            const playableRelated = relatedVideos.filter(v => v.id.videoId !== currentTrack.id.videoId);

            if (playableRelated.length > 0) {
                const nextTrack = playableRelated[0];
                handleSelectTrack(nextTrack, playableRelated);
            } else {
                setIsPlaying(false);
            }
            setApiStatus('success');
        } catch (err) {
            handleApiError(err);
            setIsPlaying(false);
        }
    }, [currentTrack, handleSelectTrack]);
    
    const handlePlayerStateChange = useCallback((event: { data: number }) => {
        if (isAttemptingAutoplay.current && (event.data === 2 || event.data === 5)) {
            setIsAutoplayBlocked(true);
            setIsPlaying(false);
            isAttemptingAutoplay.current = false;
        } else if (event.data === 1) { // playing
            setIsPlaying(true);
            setIsAutoplayBlocked(false);
            isAttemptingAutoplay.current = false;
        } else if (event.data === 2) { // paused
            setIsPlaying(false);
            isAttemptingAutoplay.current = false;
        } else if (event.data === 0) { // ended
            if (isSyncingRef.current && syncQueueRef.current.length > 0) {
                const nextTrack = syncQueueRef.current[0];
                syncQueueRef.current = syncQueueRef.current.slice(1);
                handleSelectTrack(nextTrack, [nextTrack, ...syncQueueRef.current]);
            } else if (isSyncingRef.current) {
                isSyncingRef.current = false;
                setIsSyncing(false);
                setIsPlaying(false);
            } else if (isAutoplayEnabled) {
                if (currentTrackIndexRef.current !== -1 && activePlaybackList.length > 0) {
                    playNext();
                } else {
                    playRelatedVideo();
                }
            }
        }
    }, [playNext, isAutoplayEnabled, activePlaybackList.length, playRelatedVideo, handleSelectTrack]);
    
    const { volume, setVolume, seekTo, currentTime, duration } = useYouTubePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying,
        onStateChange: handlePlayerStateChange,
    });

    useEffect(() => {
        if (isSyncingRef.current && duration > 0) {
            setSyncingTrackProgress((currentTime / duration) * 100);
        } else {
            setSyncingTrackProgress(0);
        }
    }, [currentTime, duration]);

    const handleOpenAddToPlaylistModal = (track: VideoItem) => setModalTrack(track);
    const handleCloseAddToPlaylistModal = () => setModalTrack(null);

    const handleAddTrackToPlaylist = (playlistId: string, track: VideoItem) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId && !p.tracks.some(t => t.id.videoId === track.id.videoId)) {
                return { ...p, tracks: [...p.tracks, track] };
            }
            return p;
        }));
    };

    const handleCreatePlaylistAndAdd = (name: string, track: VideoItem) => {
        const newPlaylist: Playlist = { id: `playlist-${Date.now()}`, name, tracks: [track] };
        setPlaylists(prev => [newPlaylist, ...prev]);
        handleCloseAddToPlaylistModal();
    };
    
    const handleCreatePlaylist = (name: string) => {
        const newPlaylist: Playlist = { id: `playlist-${Date.now()}`, name, tracks: [] };
        setPlaylists(prev => [newPlaylist, ...prev]);
    };

    const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, tracks: p.tracks.filter(t => t.id.videoId !== trackId) };
            }
            return p;
        }));
         setActivePlaylist(prev => prev ? {...prev, tracks: prev.tracks.filter(t => t.id.videoId !== trackId)} : null);
    };

    const handleDeletePlaylist = (playlistId: string) => {
        if (window.confirm("Are you sure you want to delete this playlist?")) {
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            handleBackToPlaylists();
        }
    };
    
    const handleRenamePlaylist = (playlistId: string, newName: string) => {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, name: newName } : p));
        setActivePlaylist(prev => prev ? {...prev, name: newName} : null);
    };
    
    const handleSelectPlaylist = (playlist: Playlist) => {
        setActivePlaylist(playlist);
        setActiveView('playlistDetail');
    };

    const handleToggleLike = useCallback((track: VideoItem) => {
        setLikedSongs(prev => {
            const isLiked = prev.includes(track.id.videoId);
            if (isLiked) {
                return prev.filter(id => id !== track.id.videoId);
            } else {
                return [...prev, track.id.videoId];
            }
        });
        
        // Update virtual playlist if active
        if (activePlaylist && activePlaylist.id === 'liked-songs') {
            setActivePlaylist(prev => {
                if (!prev) return null;
                const isLiked = likedSongs.includes(track.id.videoId);
                // Note: state update is async, so we check current state logic inverse
                if (isLiked) {
                     return { ...prev, tracks: prev.tracks.filter(t => t.id.videoId !== track.id.videoId) };
                }
                // Adding is complex here without the full track object if called from ID context, 
                // but usually toggle like happens where we have the track.
                // For simplicity in detail view we just remove.
                return prev;
            });
        }

    }, [setLikedSongs, likedSongs, activePlaylist]);
    
    const getLikedSongsPlaylist = useCallback((): Playlist => {
        // Reconstruct playlist from history/offline/playlists to get full objects, 
        // fallback to a minimal object if not found (might happen if liked then cache cleared)
        const allKnownTracks = new Map<string, VideoItem>();
        [...history, ...offlineItems, ...playlists.flatMap(p => p.tracks), ...(searchResults || []), ...recommendations].forEach(t => {
            allKnownTracks.set(t.id.videoId, t);
        });
        
        // Special case: current track might not be in lists yet
        if (currentTrack) allKnownTracks.set(currentTrack.id.videoId, currentTrack);

        const tracks = likedSongs.map(id => allKnownTracks.get(id)).filter((t): t is VideoItem => !!t);
        
        return {
            id: 'liked-songs',
            name: 'Lagu yang Disukai',
            tracks: tracks.reverse() // Newest first
        };
    }, [likedSongs, history, offlineItems, playlists, searchResults, recommendations, currentTrack]);


    const handleSelectLikedSongs = () => {
        setActivePlaylist(getLikedSongsPlaylist());
        setActiveView('playlistDetail');
    };
    
    const handleBackToPlaylists = () => {
        setActivePlaylist(null);
        setActiveView('playlists');
    };

    const handleAddToOffline = useCallback((track: VideoItem) => {
        setOfflineItems(prev => {
            if (prev.some(item => item.id.videoId === track.id.videoId)) return prev;
            fetch(track.snippet.thumbnails.high?.url).catch(err => console.warn('Could not pre-cache thumbnail:', err));
            return [track, ...prev];
        });
    }, [setOfflineItems]);

    const handleRemoveFromOffline = useCallback((trackId: string) => {
        setOfflineItems(prev => prev.filter(item => item.id.videoId !== trackId));
        setSyncedOfflineIds(prev => prev.filter(id => id !== trackId));
    }, [setOfflineItems, setSyncedOfflineIds]);

    const handleStartSync = useCallback(() => {
        const itemsToSync = offlineItems.filter(item => !syncedOfflineIds.includes(item.id.videoId));
        if (itemsToSync.length === 0 || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        syncQueueRef.current = itemsToSync.slice(1);
        
        handleSelectTrack(itemsToSync[0], itemsToSync);

    }, [offlineItems, syncedOfflineIds, handleSelectTrack]);

    const handleSelectChannel = useCallback(async (channelId: string, channelTitle: string) => {
        setIsChannelLoading(true);
        setError(null);
        setSelectedChannel({ id: channelId, title: channelTitle });
        setActiveView('channel');
        setChannelVideos([]);
        setChannelNextPageToken(undefined);
        try {
            const { items, nextPageToken } = await getChannelVideos(channelId, 'date', 50);
            setChannelVideos(items);
            setChannelNextPageToken(nextPageToken);
            setApiStatus('success');
        } catch (err) { handleApiError(err); } 
        finally { setIsChannelLoading(false); }
    }, []);
    
    const handleLoadMoreChannelVideos = useCallback(async () => {
        if (!selectedChannel || !channelNextPageToken || isChannelMoreLoading) return;

        setIsChannelMoreLoading(true);
        try {
            const { items, nextPageToken } = await getChannelVideos(selectedChannel.id, 'date', 50, channelNextPageToken);
            setChannelVideos(prev => [...prev, ...items]);
            setChannelNextPageToken(nextPageToken);
            setApiStatus('success');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsChannelMoreLoading(false);
        }

    }, [selectedChannel, channelNextPageToken, isChannelMoreLoading]);
    
    const handleBackToTabs = (originView: MainView = 'home') => {
        setActiveView(originView);
        setSelectedChannel(null);
        setChannelVideos([]);
        setChannelNextPageToken(undefined);
    };
    
    const handleEnterApp = () => {
        setIsAppEntered(true);
        setTimeout(() => setIsLandingPageMounted(false), 500);
    };

    const handleForcePlay = () => {
        isAttemptingAutoplay.current = false;
        setIsAutoplayBlocked(false);
        setIsPlaying(true);
    };

    const renderMainView = () => {
        switch(activeView) {
            case 'home':
                const isShowingSearchResults = searchResults !== null;
                return <SearchResultList
                    results={isShowingSearchResults ? searchResults : recommendations}
                    isLoading={isShowingSearchResults ? isSearchLoading : isRecommendationsLoading}
                    onSelectTrack={handleSelectTrack}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onSelectChannel={handleSelectChannel}
                    viewType={isShowingSearchResults ? 'search' : 'recommendations'}
                    onGenerateDiscoveryMix={handleGenerateDiscoveryMix}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                    likedSongs={likedSongs}
                    onToggleLike={handleToggleLike}
                />;
            case 'video':
                return <VideoFeed
                    onSelectTrack={handleSelectVideo}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onSelectChannel={handleSelectChannel}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                />;
            case 'playlists':
                return <PlaylistListView
                    playlists={playlists}
                    onSelectPlaylist={handleSelectPlaylist}
                    onCreatePlaylist={handleCreatePlaylist}
                    onSelectLikedSongs={handleSelectLikedSongs}
                    hasLikedSongs={likedSongs.length > 0}
                />;
            case 'playlistDetail':
                 if (!activePlaylist) return null;
                 return <PlaylistDetailView
                    playlist={activePlaylist}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromPlaylist={(trackId) => handleRemoveTrackFromPlaylist(activePlaylist.id, trackId)}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    onBack={handleBackToPlaylists}
                    onDelete={() => handleDeletePlaylist(activePlaylist.id)}
                    onRename={(newName) => handleRenamePlaylist(activePlaylist.id, newName)}
                    likedSongs={likedSongs}
                    onToggleLike={handleToggleLike}
                />;
            case 'history':
                return <HistoryList
                    history={history}
                    onSelectTrack={handleSelectTrack}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onSelectChannel={handleSelectChannel}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                    likedSongs={likedSongs}
                    onToggleLike={handleToggleLike}
                />;
            case 'offline':
                 return <OfflineList
                    offlinePlaylist={offlineItems}
                    syncedOfflineIds={syncedOfflineIds}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromOfflinePlaylist={handleRemoveFromOffline}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    isSyncing={isSyncing}
                    onStartSync={handleStartSync}
                    syncingTrackProgress={syncingTrackProgress}
                />;
            case 'channel':
                if (!selectedChannel) return null;
                return <ChannelView
                    channelTitle={selectedChannel.title}
                    videos={channelVideos}
                    isLoading={isChannelLoading}
                    isMoreLoading={isChannelMoreLoading}
                    onSelectTrack={handleSelectTrack}
                    onBack={() => handleBackToTabs()}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onAddToOffline={handleAddToOffline}
                    offlineItems={offlineItems}
                    currentTrackId={currentTrack?.id.videoId}
                    onLoadMore={handleLoadMoreChannelVideos}
                    hasNextPage={!!channelNextPageToken}
                    likedSongs={likedSongs}
                    onToggleLike={handleToggleLike}
                />;
            default: return null;
        }
    }

    const viewTitles: { [key in MainView]?: string } = {
        home: 'Beranda',
        video: 'Video',
        playlists: 'Playlist',
        history: 'Riwayat',
        offline: 'Koleksi Offline',
    };
    
    const getCurrentTitle = () => {
        if (activeView === 'playlistDetail') return activePlaylist?.name || 'Playlist';
        if (activeView === 'channel') return selectedChannel?.title || 'Channel';
        return viewTitles[activeView];
    }

    return (
        <>
            {isLandingPageMounted && <LandingPage onEnter={handleEnterApp} isExiting={isAppEntered} />}
            
            <Suspense fallback={null}>
                {modalTrack && (
                    <AddToPlaylistModal
                        track={modalTrack}
                        playlists={playlists}
                        onClose={handleCloseAddToPlaylistModal}
                        onAddToPlaylist={(playlistId, track) => handleAddTrackToPlaylist(playlistId, track)}
                        onCreateAndAdd={handleCreatePlaylistAndAdd}
                    />
                )}
            </Suspense>

            <div className={`grid h-screen font-sans transition-opacity duration-500 ${isAppEntered ? 'opacity-100' : 'opacity-0'} ${currentTrack ? 'grid-rows-[1fr_auto]' : 'grid-rows-1'} grid-cols-1 md:grid-cols-[250px_1fr] bg-dark-bg text-dark-text`}>
                <Sidebar activeView={activeView} setActiveView={setActiveView} />

                <div className="flex flex-col overflow-hidden bg-dark-highlight">
                    {activeView !== 'channel' && activeView !== 'playlistDetail' && (
                        <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-4">
                            <h1 className="container mx-auto text-3xl md:text-4xl font-bold text-white">
                                {getCurrentTitle()}
                            </h1>
                        </div>
                    )}
                    
                    <header className="flex-shrink-0 z-10 p-2 md:p-4">
                        <div className="container mx-auto flex items-center justify-between">
                            <div className="flex-1 max-w-lg">
                                <SearchBar onSearch={handleSearch} />
                            </div>
                            <div className="flex items-center space-x-4">
                               <ApiStatusIndicator status={apiStatus} />
                            </div>
                        </div>
                    </header>

                    <main className="flex-grow p-2 md:p-4 overflow-y-auto pb-36 md:pb-4 bg-gradient-to-b from-dark-highlight to-dark-bg rounded-t-lg">
                        <div className="container mx-auto">
                           {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}
                           <Suspense fallback={<LoadingSpinner />}>
                                {renderMainView()}
                           </Suspense>
                        </div>
                    </main>
                </div>
                
                <Suspense fallback={<div className="col-span-1 md:col-span-2 z-30 h-[88px] bg-dark-surface"></div>}>
                    {currentTrack && !isMiniPlayerActive && (
                        <footer className="col-span-1 md:col-span-2 z-30">
                            <Player
                                track={currentTrack}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                onNext={playNext}
                                onPrev={playPrev}
                                onToggleNowPlaying={() => setIsNowPlayingViewOpen(true)}
                                volume={volume}
                                setVolume={setVolume}
                                currentTime={currentTime}
                                duration={duration}
                                seekTo={seekTo}
                                onSelectChannel={handleSelectChannel}
                                onToggleMiniPlayer={() => setIsMiniPlayerActive(p => !p)}
                                isAutoplayEnabled={isAutoplayEnabled}
                                onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                                isLiked={likedSongs.includes(currentTrack.id.videoId)}
                                onToggleLike={() => handleToggleLike(currentTrack)}
                            />
                        </footer>
                    )}
                </Suspense>
                
                <Suspense fallback={null}>
                    {currentTrack && isMiniPlayerActive && (
                        <FloatingPlayer
                            track={currentTrack}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onNext={playNext}
                            onPrev={playPrev}
                            onClose={() => setIsMiniPlayerActive(false)}
                        />
                    )}
                </Suspense>

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
                            volume={volume}
                            setVolume={setVolume}
                            currentTime={currentTime}
                            duration={duration}
                            seekTo={seekTo}
                            isAutoplayEnabled={isAutoplayEnabled}
                            onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                            isLiked={likedSongs.includes(currentTrack.id.videoId)}
                            onToggleLike={() => handleToggleLike(currentTrack)}
                            startInVideoMode={startInVideoMode}
                        >
                            {isAutoplayBlocked && (
                                <AutoplayOverlay track={currentTrack} onForcePlay={handleForcePlay} />
                            )}
                       </NowPlayingView>
                    )}
                </Suspense>
            </div>
            <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
        </>
    );
};

export default App;
