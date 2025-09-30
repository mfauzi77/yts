import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SearchBar } from './components/SearchBar';
import { Player } from './components/Player';
import { SearchResultList } from './components/SearchResultsList';
import { Playlist } from './components/Playlist';
import { HistoryList } from './components/HistoryList';
import { searchVideos, getChannelVideos, getRelatedVideos } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { NowPlayingView } from './components/NowPlayingView';
import { ChannelView } from './components/ChannelView';
import { FloatingPlayer } from './components/FloatingPlayer';
import { OfflineList } from './components/OfflineList';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AutoplayOverlay } from './components/AutoplayOverlay';

type MainView = 'home' | 'playlist' | 'history' | 'offline' | 'channel';
type ApiStatus = 'idle' | 'success' | 'error';

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
    const [isChannelLoading, setIsChannelLoading] = useState<boolean>(false);
    const [isChannelMoreLoading, setIsChannelMoreLoading] = useState<boolean>(false);
    const [channelNextPageToken, setChannelNextPageToken] = useState<string | undefined>(undefined);
    const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false);
    const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
    const [isAppEntered, setIsAppEntered] = useState<boolean>(false);
    const [isLandingPageMounted, setIsLandingPageMounted] = useState<boolean>(true);
    const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

    const [playlist, setPlaylist] = useLocalStorage<VideoItem[]>('ytas-playlist', []);
    const [history, setHistory] = useLocalStorage<VideoItem[]>('ytas-history', []);
    const [offlineItems, setOfflineItems] = useLocalStorage<VideoItem[]>('ytas-offline', []);
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useLocalStorage<boolean>('ytas-autoplay', true);

    const [activePlaybackList, setActivePlaybackList] = useState<VideoItem[]>([]);
    const currentTrackIndexRef = React.useRef(-1);
    const isAttemptingAutoplay = useRef(false);

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
            const playlistSeeds = [...playlist].sort(() => 0.5 - Math.random()).slice(0, 2);
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
    }, [history, playlist]);

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
        setActivePlaybackList(contextList);
        currentTrackIndexRef.current = contextList.findIndex(item => item.id.videoId === track.id.videoId);
        
        // Automatically open Now Playing view on mobile
        if (window.innerWidth < 768) { // Corresponds to Tailwind's `md` breakpoint
            setIsNowPlayingViewOpen(true);
        }
    }, [addToHistory]);
    
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
            const nextTrack = relatedVideos.find(video => video.id.videoId !== currentTrack.id.videoId);
            if (nextTrack) {
                handleSelectTrack(nextTrack, []);
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
        // Player state codes: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        if (isAttemptingAutoplay.current && (event.data === 2 || event.data === 5)) {
             // Autoplay was blocked by the browser
            setIsAutoplayBlocked(true);
            setIsPlaying(false); // Correct the state
            isAttemptingAutoplay.current = false;
        } else if (event.data === 1) { // Playing
            setIsPlaying(true);
            setIsAutoplayBlocked(false);
            isAttemptingAutoplay.current = false;
        } else if (event.data === 2) { // Paused
            setIsPlaying(false);
            isAttemptingAutoplay.current = false;
        } else if (event.data === 0 && isAutoplayEnabled) { // Ended
            if (currentTrackIndexRef.current !== -1 && activePlaybackList.length > 0) {
                playNext();
            } else {
                playRelatedVideo();
            }
        }
    }, [playNext, isAutoplayEnabled, activePlaybackList.length, playRelatedVideo]);
    
    const { volume, setVolume, seekTo, currentTime, duration } = useYouTubePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying,
        onStateChange: handlePlayerStateChange,
    });

    const handleAddToPlaylist = useCallback((track: VideoItem) => {
        setPlaylist(prev => prev.some(item => item.id.videoId === track.id.videoId) ? prev : [...prev, track]);
    }, [setPlaylist]);

    const handleRemoveFromPlaylist = useCallback((trackId: string) => {
        setPlaylist(prev => prev.filter(item => item.id.videoId !== trackId));
    }, [setPlaylist]);

    const handleAddToOffline = useCallback((track: VideoItem) => {
        setOfflineItems(prev => {
            if (prev.some(item => item.id.videoId === track.id.videoId)) return prev;
            fetch(track.snippet.thumbnails.high?.url).catch(err => console.warn('Could not pre-cache thumbnail:', err));
            return [track, ...prev];
        });
    }, [setOfflineItems]);

    const handleRemoveFromOffline = useCallback((trackId: string) => {
        setOfflineItems(prev => prev.filter(item => item.id.videoId !== trackId));
    }, [setOfflineItems]);

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
                    onAddToPlaylist={handleAddToPlaylist}
                    onSelectChannel={handleSelectChannel}
                    playlist={playlist}
                    viewType={isShowingSearchResults ? 'search' : 'recommendations'}
                    onGenerateDiscoveryMix={handleGenerateDiscoveryMix}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                />;
            case 'playlist':
                return <Playlist
                    playlist={playlist}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
                    isAutoplayEnabled={isAutoplayEnabled}
                    onToggleAutoplay={() => setIsAutoplayEnabled(p => !p)}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                />;
            case 'history':
                return <HistoryList
                    history={history}
                    onSelectTrack={handleSelectTrack}
                    onAddToPlaylist={handleAddToPlaylist}
                    onSelectChannel={handleSelectChannel}
                    offlineItems={offlineItems}
                    onAddToOffline={handleAddToOffline}
                    currentTrackId={currentTrack?.id.videoId}
                />;
            case 'offline':
                 return <OfflineList
                    offlinePlaylist={offlineItems}
                    onSelectTrack={handleSelectTrack}
                    onRemoveFromOfflinePlaylist={handleRemoveFromOffline}
                    onSelectChannel={handleSelectChannel}
                    currentTrackId={currentTrack?.id.videoId}
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
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToOffline={handleAddToOffline}
                    playlist={playlist}
                    offlineItems={offlineItems}
                    currentTrackId={currentTrack?.id.videoId}
                    onLoadMore={handleLoadMoreChannelVideos}
                    hasNextPage={!!channelNextPageToken}
                />;
            default: return null;
        }
    }

    const viewTitles: { [key in MainView]?: string } = {
        home: 'Beranda',
        playlist: 'Playlist',
        history: 'Riwayat',
        offline: 'Koleksi Offline',
    };

    return (
        <>
            {isLandingPageMounted && <LandingPage onEnter={handleEnterApp} isExiting={isAppEntered} />}

            <div className={`grid h-screen font-sans transition-opacity duration-500 ${isAppEntered ? 'opacity-100' : 'opacity-0'} ${currentTrack ? 'grid-rows-[1fr_auto]' : 'grid-rows-1'} grid-cols-1 md:grid-cols-[250px_1fr] bg-dark-bg text-dark-text`}>
                <Sidebar activeView={activeView} setActiveView={setActiveView} />

                <div className="flex flex-col overflow-hidden bg-dark-highlight">
                    {activeView !== 'channel' && (
                        <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-4">
                            <h1 className="container mx-auto text-3xl md:text-4xl font-bold text-white">
                                {viewTitles[activeView]}
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
                           {renderMainView()}
                        </div>
                    </main>
                </div>
                
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
                        />
                    </footer>
                )}
                
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
                    >
                        {isAutoplayBlocked && (
                            <AutoplayOverlay track={currentTrack} onForcePlay={handleForcePlay} />
                        )}
                   </NowPlayingView>
                )}
            </div>
            <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
        </>
    );
};

export default App;