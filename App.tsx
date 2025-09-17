import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SearchBar } from './components/SearchBar';
import { Player } from './components/Player';
import { TabView } from './components/TabView';
import { SearchResultList } from './components/SearchResultsList';
import { Playlist } from './components/Playlist';
import { HistoryList } from './components/HistoryList';
import { searchVideos, getChannelVideos, getRelatedVideos } from './services/youtubeService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { VideoItem } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { NowPlayingView } from './components/NowPlayingView';
import { ChannelView } from './components/ChannelView';
import { FloatingPlayer } from './components/FloatingPlayer';

type ActiveView = 'tabs' | 'channel';

const App: React.FC = () => {
    const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
    const [recommendations, setRecommendations] = useState<VideoItem[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
    const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(true);

    const [currentTrack, setCurrentTrack] = useState<VideoItem | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isNowPlayingViewOpen, setIsNowPlayingViewOpen] = useState(false);
    
    const [activeView, setActiveView] = useState<ActiveView>('tabs');
    const [selectedChannel, setSelectedChannel] = useState<{ id: string; title: string } | null>(null);
    const [channelVideos, setChannelVideos] = useState<VideoItem[]>([]);
    const [isChannelLoading, setIsChannelLoading] = useState<boolean>(false);
    const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);

    const [playlist, setPlaylist] = useLocalStorage<VideoItem[]>('ytas-playlist', []);
    const [history, setHistory] = useLocalStorage<VideoItem[]>('ytas-history', []);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ytas-theme', 'dark');
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useLocalStorage<boolean>('ytas-autoplay', true);

    const currentTrackIndexInPlaylist = useRef(-1);
    const footerRef = useRef<HTMLElement>(null);

    const handleApiError = (err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsMiniPlayerVisible(!entry.isIntersecting);
            },
            { root: null, threshold: 0.1 }
        );

        const currentFooter = footerRef.current;
        if (currentFooter) {
            observer.observe(currentFooter);
        }

        return () => {
            if (currentFooter) {
                observer.unobserve(currentFooter);
            }
        };
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (history.length > 0) {
                setIsRecommendationsLoading(true);
                setError(null);
                try {
                    const results = await getRelatedVideos(history[0].id.videoId);
                    setRecommendations(results.filter(v => v.id.videoId !== history[0].id.videoId));
                } catch (err) {
                    handleApiError(err);
                    console.error(err);
                } finally {
                    setIsRecommendationsLoading(false);
                }
            } else {
                setRecommendations([]);
                setIsRecommendationsLoading(false);
            }
        };
        fetchRecommendations();
    }, [history]);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null); // Return to recommendations view
            return;
        }
        setIsSearchLoading(true);
        setSearchResults([]); // Clear previous results and show loader
        setError(null);
        setActiveView('tabs');
        try {
            const results = await searchVideos(query);
            setSearchResults(results);
        } catch (err) {
            handleApiError(err);
            console.error(err);
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

    const handleSelectTrack = useCallback((track: VideoItem) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        addToHistory(track);
        currentTrackIndexInPlaylist.current = playlist.findIndex(item => item.id.videoId === track.id.videoId);
    }, [addToHistory, playlist]);
    
    const playNext = useCallback(() => {
        if (playlist.length === 0) return;
        currentTrackIndexInPlaylist.current = (currentTrackIndexInPlaylist.current + 1) % playlist.length;
        const nextTrack = playlist[currentTrackIndexInPlaylist.current];
        handleSelectTrack(nextTrack);
    }, [playlist, handleSelectTrack]);

    const playPrev = useCallback(() => {
        if (playlist.length === 0) return;
        currentTrackIndexInPlaylist.current = (currentTrackIndexInPlaylist.current - 1 + playlist.length) % playlist.length;
        const prevTrack = playlist[currentTrackIndexInPlaylist.current];
        handleSelectTrack(prevTrack);
    }, [playlist, handleSelectTrack]);
    
    const playRelatedVideo = useCallback(async () => {
        if (!currentTrack) return;
        try {
            const relatedVideos = await getRelatedVideos(currentTrack.id.videoId);
            const nextTrack = relatedVideos.find(video => video.id.videoId !== currentTrack.id.videoId);
            if (nextTrack) {
                handleSelectTrack(nextTrack);
            } else {
                setIsPlaying(false);
            }
        } catch (err) {
            handleApiError(err);
            console.error('Failed to autoplay related video:', err);
            setIsPlaying(false);
        }
    }, [currentTrack, handleSelectTrack]);
    
    const handlePlayerStateChange = useCallback((event: { data: number }) => {
        if (event.data === 0 && isAutoplayEnabled) {
            const isTrackInPlaylist = currentTrackIndexInPlaylist.current !== -1;
            if (isTrackInPlaylist && playlist.length > 0) {
                playNext();
            } else {
                playRelatedVideo();
            }
        } else if (event.data === 1) {
            setIsPlaying(true);
        } else if (event.data === 2) {
            setIsPlaying(false);
        }
    }, [playNext, isAutoplayEnabled, playlist.length, playRelatedVideo]);
    
    const { volume, setVolume, seekTo, currentTime, duration } = useYouTubePlayer({
        videoId: currentTrack?.id.videoId ?? null,
        isPlaying,
        onStateChange: handlePlayerStateChange,
    });

    const handleAddToPlaylist = useCallback((track: VideoItem) => {
        setPlaylist(prevPlaylist => {
            if (prevPlaylist.some(item => item.id.videoId === track.id.videoId)) {
                return prevPlaylist;
            }
            return [...prevPlaylist, track];
        });
    }, [setPlaylist]);

    const handleRemoveFromPlaylist = useCallback((trackId: string) => {
        setPlaylist(prevPlaylist => prevPlaylist.filter(item => item.id.videoId !== trackId));
    }, [setPlaylist]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const openNowPlayingView = useCallback(() => {
        setIsNowPlayingViewOpen(true);
    }, []);

    const closeNowPlayingView = useCallback(() => {
        setIsNowPlayingViewOpen(false);
    }, []);

    const handleSelectChannel = useCallback(async (channelId: string, channelTitle: string) => {
        setIsChannelLoading(true);
        setError(null);
        setSelectedChannel({ id: channelId, title: channelTitle });
        setActiveView('channel');
        try {
            const results = await getChannelVideos(channelId);
            setChannelVideos(results);
        } catch (err) {
            handleApiError(err);
            console.error(err);
        } finally {
            setIsChannelLoading(false);
        }
    }, []);
    
    const handleBackToTabs = () => {
        setActiveView('tabs');
        setSelectedChannel(null);
        setChannelVideos([]);
    };
    
    const handleToggleAutoplay = () => {
        setIsAutoplayEnabled(prev => !prev);
    };

    const isShowingSearchResults = searchResults !== null;
    const listItems = isShowingSearchResults ? searchResults : recommendations;
    const listIsLoading = isShowingSearchResults ? isSearchLoading : isRecommendationsLoading;
    const viewType = isShowingSearchResults ? 'search' : 'recommendations';

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text font-sans">
            <header className="flex-shrink-0 bg-white dark:bg-dark-surface shadow-md z-20">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <i className="fab fa-youtube text-brand-red text-3xl"></i>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Audio Streamer</h1>
                    </div>
                    <div className="w-full max-w-lg">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-4 overflow-y-auto" style={{paddingBottom: '100px'}}>
                {error && <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</div>}
                
                {activeView === 'tabs' && (
                    <TabView
                        searchResults={
                            <SearchResultList
                                results={listItems}
                                isLoading={listIsLoading}
                                onSelectTrack={handleSelectTrack}
                                onAddToPlaylist={handleAddToPlaylist}
                                onSelectChannel={handleSelectChannel}
                                playlist={playlist}
                                viewType={viewType}
                            />
                        }
                        playlist={
                            <Playlist
                                playlist={playlist}
                                onSelectTrack={handleSelectTrack}
                                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                                onSelectChannel={handleSelectChannel}
                                currentTrackId={currentTrack?.id.videoId}
                                isAutoplayEnabled={isAutoplayEnabled}
                                onToggleAutoplay={handleToggleAutoplay}
                            />
                        }
                        history={
                            <HistoryList
                                history={history}
                                onSelectTrack={handleSelectTrack}
                                onAddToPlaylist={handleAddToPlaylist}
                                onSelectChannel={handleSelectChannel}
                            />
                        }
                    />
                )}
                
                {activeView === 'channel' && selectedChannel && (
                    <ChannelView
                        channelTitle={selectedChannel.title}
                        videos={channelVideos}
                        isLoading={isChannelLoading}
                        onSelectTrack={handleSelectTrack}
                        onAddToPlaylist={handleAddToPlaylist}
                        onBack={handleBackToTabs}
                        playlist={playlist}
                    />
                )}

            </main>

            {currentTrack && (
                <>
                    <footer ref={footerRef} className="fixed bottom-0 left-0 right-0 z-30">
                        <Player
                            track={currentTrack}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onNext={playNext}
                            onPrev={playPrev}
                            onToggleNowPlaying={openNowPlayingView}
                            volume={volume}
                            setVolume={setVolume}
                            currentTime={currentTime}
                            duration={duration}
                            onSelectChannel={handleSelectChannel}
                        />
                    </footer>
                    <NowPlayingView
                        isOpen={isNowPlayingViewOpen}
                        onClose={closeNowPlayingView}
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
                        onToggleAutoplay={handleToggleAutoplay}
                    />
                    {isMiniPlayerVisible && (
                        <FloatingPlayer
                            track={currentTrack}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onNext={playNext}
                            onPrev={playPrev}
                            onClose={() => setIsMiniPlayerVisible(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default App;