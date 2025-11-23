
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import type { VideoItem } from '../types';

// Lazy load child components
const AudioVisualizerCanvas = lazy(() => import('./AudioVisualizerCanvas').then(m => ({ default: m.AudioVisualizerCanvas })));
const LyricsView = lazy(() => import('./LyricsView').then(m => ({ default: m.LyricsView })));
const FloatingParticles = lazy(() => import('./FloatingParticles').then(m => ({ default: m.FloatingParticles })));


interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
  track: VideoItem;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  seekTo: (time: number) => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  children?: React.ReactNode;
  isLiked: boolean;
  onToggleLike: () => void;
  startInVideoMode?: boolean;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ViewPlaceholder: React.FC = () => (
    <div className="w-full h-full bg-dark-card/50 rounded-lg animate-pulse" />
);

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
    isOpen, onClose, track, isPlaying, setIsPlaying, onNext, onPrev,
    volume, setVolume, currentTime, duration, seekTo, isAutoplayEnabled, onToggleAutoplay,
    children, isLiked, onToggleLike, startInVideoMode
}) => {
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [showVisualEffect, setShowVisualEffect] = useState(false);
    const [viewMode, setViewMode] = useState<'album' | 'lyrics' | 'video'>('album');
    const [isMaximized, setIsMaximized] = useState(false);
    
    const imageUrl = track.snippet.thumbnails.high?.url || track.snippet.thumbnails.default.url;
    const albumContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // If startInVideoMode is true, force video mode
            if (startInVideoMode) {
                setViewMode('video');
            } else {
                 // Reset view mode only if not in video mode to prevent jarring switches if user prefers video
                 // Or if specifically requested to not start in video mode (default behavior)
                 if (viewMode !== 'video') {
                     setViewMode('album');
                 }
            }
        } else {
            // Reset maximized state when closed
            setIsMaximized(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [track.id.videoId, isOpen, startInVideoMode]);

    // Logic to handle the YouTube Iframe visibility for "Video Mode"
    useEffect(() => {
        const playerContainer = document.getElementById('player-container');
        const iframe = playerContainer?.querySelector('iframe');
        
        const updateVideoPosition = () => {
            if (isOpen && viewMode === 'video' && playerContainer && iframe && albumContainerRef.current) {
                const rect = albumContainerRef.current.getBoundingClientRect();
                
                playerContainer.style.position = 'fixed';
                playerContainer.style.top = `${rect.top}px`;
                playerContainer.style.left = `${rect.left}px`;
                playerContainer.style.width = `${rect.width}px`;
                playerContainer.style.height = `${rect.height}px`;
                // Ensure it's above everything if maximized
                playerContainer.style.zIndex = isMaximized ? '60' : '50'; 
                playerContainer.style.borderRadius = isMaximized ? '0' : '0.5rem';
                playerContainer.style.overflow = 'hidden';
                playerContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to controls if needed, or set to auto if interactions desired
                playerContainer.style.display = 'block';

                iframe.width = '100%';
                iframe.height = '100%';
            } else if (playerContainer) {
                // Reset to hidden/default
                playerContainer.style.width = '0';
                playerContainer.style.height = '0';
                playerContainer.style.position = 'static';
                playerContainer.style.display = 'none';
            }
        };

        // Run immediately and on resize/scroll
        updateVideoPosition();
        window.addEventListener('resize', updateVideoPosition);
        window.addEventListener('scroll', updateVideoPosition, true);
        
        return () => {
            window.removeEventListener('resize', updateVideoPosition);
            window.removeEventListener('scroll', updateVideoPosition, true);
             if (playerContainer) {
                 // Cleanup when unmounting or switching modes
                playerContainer.style.width = '0';
                playerContainer.style.height = '0';
                playerContainer.style.position = 'static';
                playerContainer.style.display = 'none';
            }
        };
    }, [isOpen, viewMode, track.id.videoId, isMaximized]);


    return (
        <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-modal="true"
            role="dialog"
        >
            {/* Background */}
            <div className="absolute inset-0" onClick={onClose}>
                <img src={imageUrl} alt="" className="w-full h-full object-cover blur-3xl scale-110" />
                <div className="absolute inset-0 bg-black/70"></div>
                {showVisualEffect && <FloatingParticles />}
            </div>
            
            <div 
                onClick={e => e.stopPropagation()}
                className={`
                    absolute bottom-0 left-0 right-0 z-10 
                    h-[75vh] md:h-full 
                    w-full 
                    bg-dark-surface/50 backdrop-blur-lg rounded-t-2xl
                    md:bg-transparent md:backdrop-blur-none md:rounded-none
                    flex flex-col items-center justify-around p-4 pt-8
                    md:justify-center md:p-6 text-white
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                    ${isMaximized ? '!bg-black !h-full !rounded-none justify-center p-0' : ''}
                `}>
                
                {children}

                {/* Mobile Handle (Hidden if maximized) */}
                {!isMaximized && <div className="absolute top-2.5 w-10 h-1.5 bg-white/30 rounded-full md:hidden"></div>}

                 <button 
                    onClick={onClose} 
                    className={`absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors z-50 ${isMaximized ? 'hidden' : ''}`}
                    aria-label="Tutup tampilan pemutar"
                >
                    <i className="fas fa-chevron-down text-lg"></i>
                </button>
                
                {/* Album Art / Lyrics / Video Container */}
                <div 
                    ref={albumContainerRef}
                    className={`
                        relative z-10 transition-all duration-300 ease-in-out
                        ${isMaximized 
                            ? 'fixed inset-0 w-screen h-screen bg-black' 
                            : 'w-10/12 max-w-[280px] md:w-full md:max-w-sm aspect-video md:aspect-square mb-4 md:mb-8'
                        }
                    `}
                >
                   <Suspense fallback={<ViewPlaceholder />}>
                        {viewMode === 'lyrics' ? (
                            <LyricsView track={track} />
                        ) : (
                            <div className={`relative w-full h-full ${isMaximized ? '' : 'rounded-lg shadow-2xl'} overflow-hidden bg-black`}>
                                {/* If video mode, the iframe is positioned here via the useEffect */}
                                {viewMode === 'album' && (
                                    <>
                                        {showVisualizer ? (
                                            <AudioVisualizerCanvas isPlaying={isPlaying} />
                                        ) : (
                                            <img 
                                                src={imageUrl} 
                                                alt={track.snippet.title} 
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </>
                                )}
                                {/* Fallback/Loading state for video mode before iframe snaps in */}
                                {viewMode === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black text-dark-subtext">
                                        <i className="fas fa-video text-4xl animate-pulse"></i>
                                    </div>
                                )}

                                {isMaximized && (
                                    <button 
                                        onClick={() => setIsMaximized(false)}
                                        className="absolute top-4 right-4 z-[70] w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-brand-red transition-colors"
                                    >
                                        <i className="fas fa-compress"></i>
                                    </button>
                                )}
                            </div>
                        )}
                   </Suspense>
                </div>
                    
                {/* Controls (Hidden if maximized) */}
                {!isMaximized && (
                    <div className="w-full max-w-md text-center z-50 relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1 text-center px-4">
                                <h1 className="text-lg md:text-2xl font-bold [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden" title={track.snippet.title}>{track.snippet.title}</h1>
                                <p className="text-sm text-white/70 mt-1">{track.snippet.channelTitle}</p>
                            </div>
                            <button 
                                onClick={onToggleLike}
                                className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0 ${isLiked ? 'text-brand-red' : 'text-white/70'}`}
                                title={isLiked ? "Batal Suka" : "Suka"}
                            >
                                <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-xl`}></i>
                            </button>
                        </div>

                        <div className="space-y-1 my-3 md:my-6">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={(e) => seekTo(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-red"
                            />
                            <div className="flex justify-between text-xs font-mono text-white/80">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex justify-center items-center space-x-2 md:space-x-4 my-2 md:my-4">
                            <button
                                onClick={() => setShowVisualEffect(p => !p)}
                                title="Efek Visual"
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${showVisualEffect ? 'text-brand-red' : ''}`}
                            >
                                <i className="fas fa-magic text-lg md:text-xl"></i>
                            </button>
                            <button
                                onClick={() => setShowVisualizer(p => !p)}
                                title="Alihkan Visualizer"
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${showVisualizer && viewMode === 'album' ? 'text-brand-red' : ''} disabled:opacity-30`}
                                disabled={viewMode !== 'album'}
                            >
                                <i className="fas fa-chart-bar text-lg md:text-xl"></i>
                            </button>
                            
                            <button onClick={onPrev} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10">
                                <i className="fas fa-step-backward text-lg md:text-xl"></i>
                            </button>
                            <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white text-black rounded-full shadow-lg transform hover:scale-105 transition-transform">
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl md:text-3xl ml-1`}></i>
                            </button>
                            <button onClick={onNext} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10">
                                <i className="fas fa-step-forward text-lg md:text-xl"></i>
                            </button>

                            <button
                                onClick={() => setViewMode(p => p === 'lyrics' ? 'album' : 'lyrics')}
                                title="Lirik"
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${viewMode === 'lyrics' ? 'text-brand-red' : ''}`}
                            >
                                <i className="fas fa-microphone-alt text-lg md:text-xl"></i>
                            </button>
                            
                            <button
                                onClick={() => setViewMode(p => p === 'video' ? 'album' : 'video')}
                                title="Mode Video"
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${viewMode === 'video' ? 'text-brand-red' : ''}`}
                            >
                                <i className="fas fa-video text-lg md:text-xl"></i>
                            </button>
                            
                            {viewMode === 'video' && (
                                <button
                                    onClick={() => setIsMaximized(true)}
                                    title="Layar Penuh"
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10"
                                >
                                    <i className="fas fa-expand text-lg md:text-xl"></i>
                                </button>
                            )}
                        </div>

                        <div className="hidden md:flex items-center space-x-3 justify-center w-full max-w-xs mx-auto mt-4">
                            <i className={`fas fa-volume-down text-white/70`}></i>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-red"
                            />
                            <i className="fas fa-volume-up text-white/70"></i>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
