import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { SearchBar } from './components/SearchBar';
import { getChannelVideos, getRelatedVideos, searchVideos, getChannelPlaylists, getPlaylistItems } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem, Playlist, YouTubePlaylist } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useOfflinePlayer } from './hooks/useOfflinePlayer';
import { useDownloadManager } from './hooks/useDownloadManager';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AutoplayOverlay } from './components/AutoplayOverlay';
import { SharedPlaylistModal } from './components/SharedPlaylistModal';
import { getSharedPlaylistFromCurrentUrl, clearShareParam } from './services/sharePlaylist';

// Lazy load components
const Player = lazy(() => import('./components/Player').then(m => ({ default: m.Player })));
const SearchResultList = lazy(() => import('./components/SearchResultsList').then(m => ({ default: m.SearchResultList })));
const PlaylistListView = lazy(() => import('./components/Playlist').then(m => ({ default: m.PlaylistListView })));
const HistoryList = lazy(() => import('./components/HistoryList').then(m => ({ default: m.HistoryList })));
const NowPlayingView = lazy(() => import('./components/NowPlayingView').then(m => ({ default: m.NowPlayingView })));
const ChannelView = lazy(() => import('./components/ChannelView').then(m => ({ default: m.ChannelView })));
const AddToPlaylistModal = lazy(() => import('./components/AddToPlaylistModal').then(m => ({ default: m.AddToPlaylistModal })));
const PlaylistDetailView = lazy(() => import('./components/PlaylistDetailView').then(m => ({ default: m.PlaylistDetailView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));


type MainView = 'home' | 'playlists' | 'playlistDetail' | 'history' | 'offline' | 'channel' | 'youtubePlaylistDetail' | 'settings';
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
    
    const [activeView, setActiveView] = useState<MainView>('home');
    const [selectedChannel, setSelectedChannel] = useState<{ id: string; title: string } | null>(null);
    const [channelVideos, setChannelVideos] = useState<VideoItem[]>([]);
    const [channelPlaylists, setChannelPlaylists] = useState<YouTubePlaylist[]>([]);
    const [isChannelLoading, setIsChannelLoading] = useState<boolean>(false);
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
    const [_syncedOfflineIds, setSyncedOfflineIds] = useLocalStorage<string[]>('ytas-synced-ids', []);
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useLocalStorage<boolean>('ytas-autoplay', true);
    const [isShuffle, setIsShuffle] = useLocalStorage<boolean>('ytas-shuffle', false);
    const [likedSongs, setLikedSongs] = useLocalStorage<string[]>('ytas-liked-songs', []);
    const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('ytas-search-history', []);

    // Storage & Auto Cleanup Configuration
    const [historyLimit, setHistoryLimit] = useLocalStorage<number>('ytas-history-limit', 25);
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
            if (sleepTimerEndTimeRef.current && (sleepTimerEndTimeRef.current - Date.now()) <= 10000) {
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
                setError("Pengatur waktu tidur telah berakhir. Pemutaran musik dihentikan.");
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
    const currentTrackIndexRef = React.useRef(-1);
    

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
        setOfflineItems(prev => {
            const alreadyExists = prev.some(item => item.id.videoId === track.id.videoId);
            if (alreadyExists) return prev;
            return [track, ...prev];
        });
    }, [setOfflineItems]);

    const handleDownloadTrack = useCallback(async (track: VideoItem) => {
        // Otomatis tambahkan ke list metadata offline jika belum ada
        handleAddToOffline(track);
        // Jalankan download audio
        await downloadTrack(track);
    }, [handleAddToOffline, downloadTrack]);


    
    // Inisialisasi: Cek status offline saat aplikasi dimuat atau offlineItems berubah
    useEffect(() => {
        if (offlineItems.length > 0) {
            refreshSavedIds(offlineItems.map(i => i.id.videoId));
        }
    }, [offlineItems, refreshSavedIds]);

    useEffect(() => {
        if (apiStatus === 'success' || apiStatus === 'error') {
            const timer = setTimeout(() => setApiStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [apiStatus]);

    const fetchPersonalizedRecommendations = useCallback(async () => {
        if (!isAppEntered) return;
        
        setIsRecommendationsLoading(true);
        try {
            const seeds: { type: 'history' | 'playlist' | 'search', videoId?: string, query?: string, title?: string }[] = [];
            
            // Seed 1: Most Recent History
            if (history.length > 0) {
                seeds.push({ 
                    type: 'history', 
                    videoId: history[0].id.videoId,
                    title: history[0].snippet.title 
                });
            }

            
            // Seed 2: Random Playlist Track
            const playlistsWithTracks = playlists.filter(p => p.tracks.length > 0);
            if (playlistsWithTracks.length > 0) {
                const randomPL = playlistsWithTracks[Math.floor(Math.random() * playlistsWithTracks.length)];
                const randomTrack = randomPL.tracks[Math.floor(Math.random() * randomPL.tracks.length)];
                seeds.push({ 
                    type: 'playlist', 
                    videoId: randomTrack.id.videoId,
                    title: randomTrack.snippet.title
                });
            }


            // Seed 3: Recent Search
            if (searchHistory.length > 0) {
                seeds.push({ type: 'search', query: searchHistory[0] });
            }

            if (seeds.length === 0) {
                setRecommendations([]);
                setIsRecommendationsLoading(false);
                return;
            }

            // Fetch from all sources
            const results = await Promise.all(seeds.map(async seed => {
                try {
                    if (seed.type === 'search' && seed.query) {
                        return await searchVideos(seed.query);
                    } else if (seed.videoId) {
                        return await getRelatedVideos(seed.videoId, seed.title);
                    }

                    return [];
                } catch { return []; }
            }));

            // Merge & Interleave
            const interleaved: VideoItem[] = [];
            const seenIds = new Set<string>();
            history.slice(0, 10).forEach(h => seenIds.add(h.id.videoId));
            if (currentTrack) seenIds.add(currentTrack.id.videoId);

            const maxLen = Math.max(...results.map(r => r.length));
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
        } catch (err) { handleApiError(err); } 
        finally { setIsRecommendationsLoading(false); }
    }, [history, playlists, searchHistory, isAppEntered, currentTrack]);

    useEffect(() => {
        if (!isAppEntered) return;
        if (recommendations.length === 0) {
            fetchPersonalizedRecommendations();
        }
    }, [isAppEntered, recommendations.length, fetchPersonalizedRecommendations]);

    
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        setIsSearchLoading(true);
        setSearchResults([]);
        setError(null);
        setActiveView('home');

        // Save to search history
        setSearchHistory(prev => {
            const trimmed = query.trim();
            const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
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
    }, [setSearchHistory]);

    // Auto-cleanup on app startup or when settings change
    useEffect(() => {
        if (!autoCleanupEnabled) return;

        // Auto trim history by max age & history limit
        setHistory(prevHistory => {
            let updated = [...prevHistory];

            if (historyMaxAgeDays > 0) {
                const cutoffTime = Date.now() - historyMaxAgeDays * 24 * 60 * 60 * 1000;
                updated = updated.filter(item => {
                    const playedAt = (item as any)._playedAt;
                    return !playedAt || playedAt >= cutoffTime;
                });
            }

            if (updated.length > historyLimit) {
                updated = updated.slice(0, historyLimit);
            }

            return updated.length !== prevHistory.length ? updated : prevHistory;
        });

        // Auto clear API data cache on startup if configured
        if (autoClearCacheOnStartup && 'caches' in window) {
            caches.keys().then(keys => {
                keys.forEach(key => {
                    if (key.includes('data')) {
                        caches.delete(key);
                    }
                });
            }).catch(e => console.warn('Auto cache clear error:', e));
        }
    }, [autoCleanupEnabled, historyLimit, historyMaxAgeDays, autoClearCacheOnStartup, setHistory]);

    const addToHistory = useCallback((track: VideoItem) => {
        setHistory(prevHistory => {
            const trackWithTimestamp = {
                ...track,
                _playedAt: Date.now()
            };
            const newHistory = [trackWithTimestamp, ...prevHistory.filter(item => item.id.videoId !== track.id.videoId)];
            return newHistory.slice(0, historyLimit);
        });
    }, [setHistory, historyLimit]);

    const handleSelectTrack = useCallback((track: VideoItem, contextList: VideoItem[] = []) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
        addToHistory(track);
        
        // Haptic feedback for mobile
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20);
        }

        // Otomatis sinkronkan metadata jika diputar
        if (offlineItems.some(i => i.id.videoId === track.id.videoId)) {
            setSyncedOfflineIds(prev => [...new Set([...prev, track.id.videoId])]);
        }

        setActivePlaybackList(contextList);
        currentTrackIndexRef.current = contextList.findIndex(item => item.id.videoId === track.id.videoId);
    }, [addToHistory, offlineItems, setSyncedOfflineIds]);

    const playNext = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        
        if (isShuffle) {
            let nextIndex;
            // Pick a random song that isn't the current one (if possible)
            if (activePlaybackList.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * activePlaybackList.length);
                } while (nextIndex === currentTrackIndexRef.current);
            } else {
                nextIndex = 0;
            }
            currentTrackIndexRef.current = nextIndex;
        } else {
            currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % activePlaybackList.length;
        }
        
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack, isShuffle]);

    const playPrev = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        currentTrackIndexRef.current = (currentTrackIndexRef.current - 1 + activePlaybackList.length) % activePlaybackList.length;
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack]);

    const handlePlayerStateChange = useCallback((event: { data: number }) => {
        const PlayerState = {
            ENDED: 0,
            PLAYING: 1,
            PAUSED: 2,
            BUFFERING: 3,
            CUED: 5
        };

        console.log(`[Player State Change]: ${Object.keys(PlayerState).find(key => (PlayerState as Record<string, number>)[key] === event.data)} (${event.data})`);

        if (event.data === PlayerState.PLAYING) {
            setIsPlaying(true);
            setApiStatus('success');
        } else if (event.data === PlayerState.ENDED) {
            if (isAutoplayEnabled) {
                console.log("[Auto-Next]: Song ended, jumping to next...");
                playNext();
            } else {
                setIsPlaying(false);
            }
        } else if (event.data === PlayerState.PAUSED) {
            setIsPlaying(false);
        } else if (event.data === PlayerState.BUFFERING) {
            setIsPlaying(true);
        }
    }, [playNext, isAutoplayEnabled]);

    // --- Offline / Local Playback ---
    const offlinePlayerData = useOfflinePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying,
        onEnded: playNext,
    });

    const { volume, setVolume, seekTo, currentTime, duration, play, pause } = useYouTubePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying: isPlaying && !offlinePlayerData.isLocalMode,
        onStateChange: handlePlayerStateChange,
    });

    // Merge: if local mode, override time/duration/seek/volume
    const activeCurrentTime = offlinePlayerData.isLocalMode ? offlinePlayerData.localCurrentTime : currentTime;
    const activeDuration    = offlinePlayerData.isLocalMode ? offlinePlayerData.localDuration    : duration;
    const activeSeekTo      = offlinePlayerData.isLocalMode ? offlinePlayerData.localSeekTo      : seekTo;
    const activeVolume      = offlinePlayerData.isLocalMode ? offlinePlayerData.localVolume      : volume;
    const activeSetVolume   = offlinePlayerData.isLocalMode ? offlinePlayerData.localSetVolume   : setVolume;

    useEffect(() => { activeSetVolumeRef.current = activeSetVolume; }, [activeSetVolume]);
    useEffect(() => { sleepTimerEndTimeRef.current = sleepTimerEndTime; }, [sleepTimerEndTime]);
    useEffect(() => {
        const isFading = sleepTimerEndTime !== null && (sleepTimerEndTime - Date.now()) <= 10000;
        if (!isFading && activeVolume > 0) {
            baseVolumeRef.current = activeVolume;
        }
    }, [activeVolume, sleepTimerEndTime]);

    const activePlaybackProgress = (activeDuration > 0 && !isNaN(activeCurrentTime) && !isNaN(activeDuration)) 
        ? Math.min(Math.max(Math.round((activeCurrentTime / activeDuration) * 100), 0), 100) 
        : 0;

    // Store latest state & callbacks in refs to prevent MediaSession action handlers from re-registering on every tick
    const playRef = useRef(play);
    const pauseRef = useRef(pause);
    const playNextRef = useRef(playNext);
    const playPrevRef = useRef(playPrev);
    const activeSeekToRef = useRef(activeSeekTo);
    const isPlayingRef = useRef(isPlaying);
    const currentTrackRef = useRef(currentTrack);
    const activeCurrentTimeRef = useRef(activeCurrentTime);
    const activeDurationRef = useRef(activeDuration);

    useEffect(() => { playRef.current = play; }, [play]);
    useEffect(() => { pauseRef.current = pause; }, [pause]);
    useEffect(() => { playNextRef.current = playNext; }, [playNext]);
    useEffect(() => { playPrevRef.current = playPrev; }, [playPrev]);
    useEffect(() => { activeSeekToRef.current = activeSeekTo; }, [activeSeekTo]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
    useEffect(() => { activeCurrentTimeRef.current = activeCurrentTime; }, [activeCurrentTime]);
    useEffect(() => { activeDurationRef.current = activeDuration; }, [activeDuration]);

    // 1. Setup MediaSession metadata & Action Handlers ONCE per track change
    useEffect(() => {
        if (!currentTrack) return;

        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: currentTrack.snippet.title,
                    artist: currentTrack.snippet.channelTitle,
                    album: 'YTS Music',
                    artwork: [
                        { src: currentTrack.snippet.thumbnails.default.url, sizes: '120x90', type: 'image/jpeg' },
                        { src: currentTrack.snippet.thumbnails.medium?.url || currentTrack.snippet.thumbnails.default.url, sizes: '320x180', type: 'image/jpeg' },
                        { src: currentTrack.snippet.thumbnails.high?.url || currentTrack.snippet.thumbnails.default.url, sizes: '480x360', type: 'image/jpeg' },
                    ]
                });
            } catch (e) {
                console.warn('Failed to set MediaMetadata:', e);
            }

            const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch {
                    // Handler not supported on browser
                }
            };

            setHandler('play', () => {
                try {
                    navigator.mediaSession.playbackState = 'playing';
                    setIsPlaying(true);
                    playRef.current();
                } catch (e) {
                    console.error('MediaSession play error:', e);
                }
            });

            setHandler('pause', () => {
                try {
                    navigator.mediaSession.playbackState = 'paused';
                    setIsPlaying(false);
                    pauseRef.current();
                } catch (e) {
                    console.error('MediaSession pause error:', e);
                }
            });

            setHandler('stop', () => {
                try {
                    navigator.mediaSession.playbackState = 'none';
                    setIsPlaying(false);
                    pauseRef.current();
                } catch (e) {
                    console.error('MediaSession stop error:', e);
                }
            });

            setHandler('previoustrack', () => playPrevRef.current());
            setHandler('nexttrack', () => playNextRef.current());

            setHandler('seekto', (details) => {
                if (details.seekTime !== undefined && !isNaN(details.seekTime)) {
                    activeSeekToRef.current(details.seekTime);
                }
            });

            setHandler('seekbackward', (details) => {
                const offset = details.seekOffset || 10;
                activeSeekToRef.current(Math.max((activeCurrentTimeRef.current || 0) - offset, 0));
            });

            setHandler('seekforward', (details) => {
                const offset = details.seekOffset || 10;
                activeSeekToRef.current(Math.min((activeCurrentTimeRef.current || 0) + offset, activeDurationRef.current || 0));
            });
        }

        // Notify Android Native WebView ONCE on track change
        if ((window as any).AndroidBridge) {
            try {
                if (typeof (window as any).AndroidBridge.onTrackChanged === 'function') {
                    (window as any).AndroidBridge.onTrackChanged(JSON.stringify({
                        title: currentTrack.snippet.title,
                        artist: currentTrack.snippet.channelTitle,
                        thumbnail: currentTrack.snippet.thumbnails.medium?.url || currentTrack.snippet.thumbnails.default.url,
                        videoId: currentTrack.id.videoId,
                        isPlaying: isPlayingRef.current,
                        duration: activeDurationRef.current,
                        currentTime: activeCurrentTimeRef.current
                    }));
                }
            } catch (e) {
                console.warn('AndroidBridge call error:', e);
            }
        }
    }, [currentTrack]);

    // 2. Sync playbackState when isPlaying changes
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
        if ((window as any).AndroidBridge && typeof (window as any).AndroidBridge.onPlaybackStateChanged === 'function') {
            try {
                (window as any).AndroidBridge.onPlaybackStateChanged(isPlaying);
            } catch (e) {
                console.warn('AndroidBridge onPlaybackStateChanged error:', e);
            }
        }
    }, [isPlaying]);

    // 3. Sync positionState when activeCurrentTime / activeDuration changes
    useEffect(() => {
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && activeDuration > 0 && !isNaN(activeDuration) && !isNaN(activeCurrentTime)) {
            try {
                const validPosition = Math.min(Math.max(activeCurrentTime, 0), activeDuration);
                navigator.mediaSession.setPositionState({
                    duration: activeDuration,
                    playbackRate: 1,
                    position: validPosition
                });
            } catch {
                // Ignore position state errors
            }
        }
    }, [activeCurrentTime, activeDuration]);

    // 4. Register window.YTS_PLAYER for global JS calls from Android / browser extension
    useEffect(() => {
        (window as any).YTS_PLAYER = {
            play: () => { setIsPlaying(true); playRef.current(); },
            pause: () => { setIsPlaying(false); pauseRef.current(); },
            toggle: () => {
                if (isPlayingRef.current) { setIsPlaying(false); pauseRef.current(); }
                else { setIsPlaying(true); playRef.current(); }
            },
            next: () => playNextRef.current(),
            prev: () => playPrevRef.current(),
            getState: () => ({
                isPlaying: isPlayingRef.current,
                title: currentTrackRef.current?.snippet.title || '',
                artist: currentTrackRef.current?.snippet.channelTitle || '',
                thumbnail: currentTrackRef.current?.snippet.thumbnails.medium?.url || currentTrackRef.current?.snippet.thumbnails.default.url || '',
                currentTime: activeCurrentTimeRef.current,
                duration: activeDurationRef.current,
            })
        };
    }, []);

    const handleOpenAddToPlaylistModal = (track: VideoItem) => setModalTrack(track);
    const handleCloseAddToPlaylistModal = () => setModalTrack(null);

    const handleAddTrackToPlaylist = (playlistId: string, track: VideoItem) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId && !p.tracks.some(t => t.id.videoId === track.id.videoId)) {
                return { ...p, tracks: [...p.tracks, track] };
            }
            return p;
        }));
        setActivePlaylist(prev => {
            if (prev && prev.id === playlistId && !prev.tracks.some(t => t.id.videoId === track.id.videoId)) {
                return { ...prev, tracks: [...prev.tracks, track] };
            }
            return prev;
        });
    };

    const handleCreatePlaylistAndAdd = (name: string, track: VideoItem) => {
        const newPlaylist: Playlist = { id: `playlist-${Date.now()}`, name, tracks: [track] };
        setPlaylists(prev => [newPlaylist, ...prev]);
        handleCloseAddToPlaylistModal();
    };

    const handleToggleLike = useCallback((track: VideoItem) => {
        setLikedSongs(prev => prev.includes(track.id.videoId) ? prev.filter(id => id !== track.id.videoId) : [...prev, track.id.videoId]);
    }, [setLikedSongs]);


    const handleSelectChannel = useCallback(async (channelId: string, channelTitle: string) => {
        setIsChannelLoading(true);
        setSelectedChannel({ id: channelId, title: channelTitle });
        setActiveView('channel');
        setChannelVideos([]);
        setChannelPlaylists([]);
        try {
            const [videoData, playlistData] = await Promise.all([
                getChannelVideos(channelId),
                getChannelPlaylists(channelId)
            ]);
            setChannelVideos(videoData.items);
            setChannelNextPageToken(videoData.nextPageToken);
            setChannelPlaylists(playlistData.items);
            setApiStatus('success');
        } catch (err) { handleApiError(err); } 
        finally { setIsChannelLoading(false); }
    }, []);

    const handleSelectYouTubePlaylist = useCallback(async (playlist: YouTubePlaylist) => {
        setIsYoutubePlaylistLoading(true);
        setSelectedYouTubePlaylist(playlist);
        setActiveView('youtubePlaylistDetail');
        setYoutubePlaylistVideos([]);
        try {
            const { items } = await getPlaylistItems(playlist.id);
            setYoutubePlaylistVideos(items);
            setApiStatus('success');
        } catch (err) { handleApiError(err); }
        finally { setIsYoutubePlaylistLoading(false); }
    }, []);

    const handleEnterApp = () => {
        setIsAppEntered(true);
        setTimeout(() => setIsLandingPageMounted(false), 500);
    };

    const navigateToView = useCallback((view: MainView) => {
        if (view === 'home') {
            setSearchResults(null);
            if (activeView === 'home' && searchResults === null) {
                fetchPersonalizedRecommendations();
            }
        }
        setActiveView(view);
    }, [activeView, searchResults, fetchPersonalizedRecommendations]);

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

                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                    playbackProgress={activePlaybackProgress}
                    getDownloadState={getDownloadState}
                    onDownloadTrack={handleDownloadTrack}
                    onDeleteDownload={deleteOfflineTrack}
                />;

            case 'playlists':
                return <PlaylistListView
                    playlists={playlists}
                    onSelectPlaylist={(p) => { setActivePlaylist(p); setActiveView('playlistDetail'); }}
                    onCreatePlaylist={(name) => setPlaylists(p => [...p, { id: `pl-${Date.now()}`, name, tracks: [] }])}
                />;
            case 'playlistDetail':
                 if (!activePlaylist) return null;
                 return <PlaylistDetailView
                    playlist={activePlaylist}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromPlaylist={(trackId) => {
                        setPlaylists(prev => prev.map(p => p.id === activePlaylist.id ? {...p, tracks: p.tracks.filter(t => t.id.videoId !== trackId)} : p));
                        setActivePlaylist(prev => prev ? {...prev, tracks: prev.tracks.filter(t => t.id.videoId !== trackId)} : null);
                    }}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    playbackProgress={activePlaybackProgress}
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    isShuffle={isShuffle}
                    onToggleShuffle={() => setIsShuffle(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    onBack={() => setActiveView('playlists')}
                    onDelete={() => { setPlaylists(p => p.filter(pl => pl.id !== activePlaylist.id)); setActiveView('playlists'); }}
                    onRename={(newName) => {
                        setPlaylists(p => p.map(pl => pl.id === activePlaylist.id ? {...pl, name: newName} : pl));
                        setActivePlaylist(prev => prev ? {...prev, name: newName} : null);
                    }}
                    getDownloadState={getDownloadState}
                    onDownloadTrack={handleDownloadTrack}
                    onDeleteDownload={deleteOfflineTrack}
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
                    playbackProgress={activePlaybackProgress}
                    getDownloadState={getDownloadState}
                    onDownloadTrack={handleDownloadTrack}
                    onDeleteDownload={deleteOfflineTrack}
                />;

            case 'channel':
                if (!selectedChannel) return null;
                return <ChannelView
                    channelTitle={selectedChannel.title}
                    videos={channelVideos}
                    playlists={channelPlaylists}
                    isLoading={isChannelLoading}
                    isMoreLoading={false}
                    onSelectTrack={handleSelectTrack}
                    onSelectPlaylist={handleSelectYouTubePlaylist}
                    onBack={() => setActiveView('home')}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onAddToOffline={handleAddToOffline}
                    offlineItems={offlineItems}
                    currentTrackId={currentTrack?.id.videoId}
                    playbackProgress={activePlaybackProgress}
                    onLoadMore={() => {}}
                    hasNextPage={!!channelNextPageToken}
                    getDownloadState={getDownloadState}
                    onDownloadTrack={handleDownloadTrack}
                    onDeleteDownload={deleteOfflineTrack}
                />;
            case 'youtubePlaylistDetail':
                if (!selectedYouTubePlaylist) return null;
                return <PlaylistDetailView
                    playlist={{
                        id: selectedYouTubePlaylist.id,
                        name: selectedYouTubePlaylist.snippet.title,
                        tracks: youtubePlaylistVideos
                    }}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromPlaylist={() => {}} // Cannot remove from YouTube playlist
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    playbackProgress={activePlaybackProgress}
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    isShuffle={isShuffle}
                    onToggleShuffle={() => setIsShuffle(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    onBack={() => setActiveView('channel')}
                    onDelete={() => {}} // Cannot delete YouTube playlist
                    onRename={() => {}} // Cannot rename YouTube playlist
                    isYouTubePlaylist={true}
                    getDownloadState={getDownloadState}
                    onDownloadTrack={handleDownloadTrack}
                    onDeleteDownload={deleteOfflineTrack}
                />;
            case 'settings':
                return <SettingsView
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
                    onBack={() => setActiveView('home')}
                />;
            default: return null;
        }
    }

    const viewTitles: { [key in MainView]?: string } = {
        home: 'Beranda',
        playlists: 'Playlist',
        history: 'Riwayat',
        offline: 'Koleksi Offline',
        settings: 'Pengaturan & Pembersihan',
    };

    return (
        <>
            {isLandingPageMounted && <LandingPage onEnter={handleEnterApp} isExiting={isAppEntered} />}

            {/* Shared Playlist Modal */}
            {sharedPlaylist && (
                <SharedPlaylistModal
                    playlist={sharedPlaylist}
                    onListen={(pl) => {
                        // Langsung mulai putar lagu pertama dari shared playlist
                        if (pl.tracks.length > 0) {
                            handleSelectTrack(pl.tracks[0], pl.tracks);
                            // Masuk ke app jika belum
                            if (!isAppEntered) handleEnterApp();
                        }
                        setSharedPlaylist(null);
                    }}
                    onAddToMyPlaylist={(pl) => {
                        const newPlaylist: Playlist = {
                            ...pl,
                            id: `pl-shared-${Date.now()}`,
                        };
                        setPlaylists(prev => [newPlaylist, ...prev]);
                        setSharedPlaylist(null);
                        // Navigasi ke tab playlist
                        setIsAppEntered(true);
                        setTimeout(() => {
                            setIsLandingPageMounted(false);
                            setActiveView('playlists');
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

            <div className={`grid h-screen font-sans transition-opacity duration-500 ${isAppEntered ? 'opacity-100' : 'opacity-0'} ${currentTrack ? 'grid-rows-[1fr_auto]' : 'grid-rows-1'} grid-cols-1 md:grid-cols-[250px_1fr] bg-dark-bg text-dark-text`}>
                <Sidebar activeView={activeView} setActiveView={navigateToView} />


                <div className="flex flex-col overflow-hidden bg-dark-highlight">
                    <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-4 flex items-center justify-between">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            {viewTitles[activeView] || 'YTS'}
                        </h1>
                        <div className="flex items-center gap-2">
                            {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                                <button
                                    onClick={() => setActiveView('settings')}
                                    className="flex items-center text-indigo-300 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-full border border-indigo-500/40 gap-1.5 transition-colors"
                                    title="Pengatur Waktu Tidur Aktif - Klik untuk kelola"
                                >
                                    <i className="fas fa-moon text-indigo-400 animate-pulse"></i>
                                    <span>{Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s</span>
                                </button>
                            )}
                            {!navigator.onLine && (
                                <div className="flex items-center text-yellow-500 text-sm font-semibold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                    <i className="fas fa-wifi-slash mr-2"></i>
                                    Offline
                                </div>
                            )}
                        </div>
                    </div>
                    
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
                
                <Suspense fallback={null}>
                    {currentTrack && (
                        <footer className="col-span-1 md:col-span-2 z-30 fixed bottom-14 left-0 right-0 md:static md:bottom-auto">
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
                                onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                                isShuffle={isShuffle}
                                onToggleShuffle={() => setIsShuffle(p => !p)}
                                isLocalMode={offlinePlayerData.isLocalMode}
                                downloadState={getDownloadState(currentTrack.id.videoId)}
                                onDownload={() => handleDownloadTrack(currentTrack)}
                                onDeleteDownload={() => deleteOfflineTrack(currentTrack.id.videoId)}
                            />
                        </footer>
                    )}
                </Suspense>

                <Suspense fallback={null}>
                    {currentTrack && (
                        <NowPlayingView
                            isOpen={isNowPlayingViewOpen && typeof window !== 'undefined' && window.innerWidth >= 768}
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
                            onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                            isShuffle={isShuffle}
                            onToggleShuffle={() => setIsShuffle(p => !p)}
                            isLiked={likedSongs.includes(currentTrack.id.videoId)}
                            onToggleLike={() => handleToggleLike(currentTrack)}
                            isLocalMode={offlinePlayerData.isLocalMode}
                            downloadState={getDownloadState(currentTrack.id.videoId)}
                            onDownload={() => handleDownloadTrack(currentTrack)}
                            onDeleteDownload={() => deleteOfflineTrack(currentTrack.id.videoId)}
                        >
                            {isAutoplayBlocked && (
                                <AutoplayOverlay track={currentTrack} onForcePlay={() => setIsPlaying(true)} />
                            )}
                       </NowPlayingView>
                    )}
                </Suspense>
            </div>
            <BottomNavBar activeView={activeView} setActiveView={navigateToView} />
        </>

    );
};

export default App;
