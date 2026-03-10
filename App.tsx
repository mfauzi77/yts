
import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { SearchBar } from './components/SearchBar';
import { getChannelVideos, getRelatedVideos, searchVideos, getChannelPlaylists, getPlaylistItems } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem, Playlist, YouTubePlaylist } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AutoplayOverlay } from './components/AutoplayOverlay';

// Lazy load components
const Player = lazy(() => import('./components/Player').then(m => ({ default: m.Player })));
const SearchResultList = lazy(() => import('./components/SearchResultsList').then(m => ({ default: m.SearchResultList })));
const PlaylistListView = lazy(() => import('./components/Playlist').then(m => ({ default: m.PlaylistListView })));
const HistoryList = lazy(() => import('./components/HistoryList').then(m => ({ default: m.HistoryList })));
const NowPlayingView = lazy(() => import('./components/NowPlayingView').then(m => ({ default: m.NowPlayingView })));
const ChannelView = lazy(() => import('./components/ChannelView').then(m => ({ default: m.ChannelView })));
const OfflineList = lazy(() => import('./components/OfflineList').then(m => ({ default: m.OfflineList })));
const AddToPlaylistModal = lazy(() => import('./components/AddToPlaylistModal').then(m => ({ default: m.AddToPlaylistModal })));
const PlaylistDetailView = lazy(() => import('./components/PlaylistDetailView').then(m => ({ default: m.PlaylistDetailView })));
const LiteView = lazy(() => import('./components/LiteView').then(m => ({ default: m.LiteView })));

type MainView = 'home' | 'playlists' | 'playlistDetail' | 'history' | 'offline' | 'channel' | 'lite' | 'youtubePlaylistDetail';
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
    const [isYoutubePlaylistLoading, setIsYoutubePlaylistLoading] = useState<boolean>(false);

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
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncingTrackProgress, setSyncingTrackProgress] = useState<number>(0);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Terjadi galat.';
        setError(message);
        setApiStatus('error');
    };

    const getBase64FromUrl = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Failed to fetch image');
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            // Fallback to no-cors if cors fails, but we won't get base64
            // This is just to ensure the service worker at least tries to cache it
            await fetch(url, { mode: 'no-cors' });
            throw err;
        }
    };

    // Logic Sinkronisasi Offline yang diperbarui
    const startOfflineSync = useCallback(async () => {
        if (isSyncing || offlineItems.length === 0) return;
        
        setIsSyncing(true);
        setSyncingTrackProgress(0);
        
        const unsyncedItems = offlineItems.filter(item => !syncedOfflineIds.includes(item.id.videoId));
        
        if (unsyncedItems.length === 0) {
            setIsSyncing(false);
            return;
        }

        let completed = 0;

        for (const item of unsyncedItems) {
            try {
                // 1. Ambil Base64 Thumbnail
                const imgUrl = item.snippet.thumbnails.default.url;
                const base64 = await getBase64FromUrl(imgUrl);
                
                // 2. Update item dengan data thumbnail secara atomik
                setOfflineItems(prev => prev.map(i => 
                    i.id.videoId === item.id.videoId 
                        ? { ...i, snippet: { ...i.snippet, thumbnailData: base64 } } 
                        : i
                ));

                // 3. Tandai sebagai tersinkronisasi
                setSyncedOfflineIds(prev => [...new Set([...prev, item.id.videoId])]);
                
                completed++;
                setSyncingTrackProgress((completed / unsyncedItems.length) * 100);
                
                // Jeda kecil agar tidak memberatkan browser
                await new Promise(r => setTimeout(r, 300));
            } catch (err) {
                console.error("Gagal sinkronisasi item:", item.snippet.title, err);
                // Jika gagal base64, kita tetap tandai synced agar tidak loop terus
                setSyncedOfflineIds(prev => [...new Set([...prev, item.id.videoId])]);
            }
        }
        
        setIsSyncing(false);
        setSyncingTrackProgress(100);
    }, [isSyncing, offlineItems, syncedOfflineIds, setSyncedOfflineIds, setOfflineItems]);

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
        addToHistory(track);

        // Otomatis sinkronkan metadata jika diputar
        if (offlineItems.some(i => i.id.videoId === track.id.videoId)) {
            setSyncedOfflineIds(prev => [...new Set([...prev, track.id.videoId])]);
        }

        setActivePlaybackList(contextList);
        currentTrackIndexRef.current = contextList.findIndex(item => item.id.videoId === track.id.videoId);
        
        if (window.innerWidth < 768) {
            setIsNowPlayingViewOpen(true);
        }
    }, [addToHistory, offlineItems, setSyncedOfflineIds]);

    const playNext = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % activePlaybackList.length;
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack]);

    const playPrev = useCallback(() => {
        if (activePlaybackList.length === 0) return;
        currentTrackIndexRef.current = (currentTrackIndexRef.current - 1 + activePlaybackList.length) % activePlaybackList.length;
        handleSelectTrack(activePlaybackList[currentTrackIndexRef.current], activePlaybackList);
    }, [activePlaybackList, handleSelectTrack]);

    const handlePlayerStateChange = useCallback((event: { data: number }) => {
        if (event.data === 1) {
            setIsPlaying(true);
        } else if (event.data === 2) {
            setIsPlaying(false);
        } else if (event.data === 0) {
            if (isAutoplayEnabled) {
                playNext();
            }
        }
    }, [playNext, isAutoplayEnabled]);

    const { volume, setVolume, seekTo, currentTime, duration } = useYouTubePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying,
        onStateChange: handlePlayerStateChange,
    });

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

    const handleToggleLike = useCallback((track: VideoItem) => {
        setLikedSongs(prev => prev.includes(track.id.videoId) ? prev.filter(id => id !== track.id.videoId) : [...prev, track.id.videoId]);
    }, [setLikedSongs]);

    const handleAddToOffline = useCallback((track: VideoItem) => {
        setOfflineItems(prev => {
            const alreadyExists = prev.some(item => item.id.videoId === track.id.videoId);
            if (alreadyExists) return prev;
            return [track, ...prev];
        });
        // Berikan notifikasi kecil atau feedback visual jika perlu
    }, [setOfflineItems]);

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
                    onGenerateDiscoveryMix={() => {}}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                />;
            case 'lite':
                return <LiteView
                    onSelectTrack={handleSelectTrack}
                    onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                    onAddToOffline={handleAddToOffline}
                    offlineItems={offlineItems}
                    currentTrackId={currentTrack?.id.videoId}
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
                    onRemoveFromPlaylist={(trackId) => setPlaylists(prev => prev.map(p => p.id === activePlaylist.id ? {...p, tracks: p.tracks.filter(t => t.id.videoId !== trackId)} : p))}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    onBack={() => setActiveView('playlists')}
                    onDelete={() => { setPlaylists(p => p.filter(pl => pl.id !== activePlaylist.id)); setActiveView('playlists'); }}
                    onRename={(newName) => setPlaylists(p => p.map(pl => pl.id === activePlaylist.id ? {...pl, name: newName} : pl))}
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
                />;
            case 'offline':
                 return <OfflineList
                    offlinePlaylist={offlineItems}
                    syncedOfflineIds={syncedOfflineIds}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromOfflinePlaylist={(id) => {
                        setOfflineItems(p => p.filter(i => i.id.videoId !== id));
                        setSyncedOfflineIds(p => p.filter(sid => sid !== id));
                    }}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    isSyncing={isSyncing}
                    onStartSync={startOfflineSync}
                    syncingTrackProgress={syncingTrackProgress}
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
                    onLoadMore={() => {}}
                    hasNextPage={!!channelNextPageToken}
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
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    onBack={() => setActiveView('channel')}
                    onDelete={() => {}} // Cannot delete YouTube playlist
                    onRename={() => {}} // Cannot rename YouTube playlist
                    isYouTubePlaylist={true}
                />;
            default: return null;
        }
    }

    const viewTitles: { [key in MainView]?: string } = {
        home: 'Beranda',
        lite: 'Mode Lite',
        playlists: 'Playlist',
        history: 'Riwayat',
        offline: 'Offline',
    };

    return (
        <>
            {isLandingPageMounted && <LandingPage onEnter={handleEnterApp} isExiting={isAppEntered} />}
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
                <Sidebar activeView={activeView} setActiveView={setActiveView} />

                <div className="flex flex-col overflow-hidden bg-dark-highlight">
                    <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-4 flex items-center justify-between">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            {viewTitles[activeView] || 'YTS'}
                        </h1>
                        {!navigator.onLine && (
                            <div className="flex items-center text-yellow-500 text-sm font-semibold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                <i className="fas fa-wifi-slash mr-2"></i>
                                Offline
                            </div>
                        )}
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
                                isAutoplayEnabled={isAutoplayEnabled}
                                onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                            />
                        </footer>
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
                        >
                            {isAutoplayBlocked && (
                                <AutoplayOverlay track={currentTrack} onForcePlay={() => setIsPlaying(true)} />
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
