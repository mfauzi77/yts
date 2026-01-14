
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import type { VideoItem } from '../types';
import { FloatingParticles } from './FloatingParticles';

// Lazy load child components
const AudioVisualizerCanvas = lazy(() => import('./AudioVisualizerCanvas').then(m => ({ default: m.AudioVisualizerCanvas })));
const LyricsView = lazy(() => import('./LyricsView').then(m => ({ default: m.LyricsView })));


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
        let animationFrameId: number;

        const updateVideoPosition = () => {
            const playerElement = document.getElementById('player-container');
            
            // Only position if open, in video mode, and elements exist
            if (isOpen && viewMode === 'video' && playerElement && albumContainerRef.current) {
                const rect = albumContainerRef.current.getBoundingClientRect();
                
                // Force important styles to override any specific iframe styles or global defaults
                playerElement.style.setProperty('position', 'fixed', 'important');
                playerElement.style.setProperty('top', `${rect.top}px`, 'important');
                playerElement.style.setProperty('left', `${rect.left}px`, 'important');
                playerElement.style.setProperty('width', `${rect.width}px`, 'important');
                playerElement.style.setProperty('height', `${rect.height}px`, 'important');
                
                // Z-index hierarchy handling
                const zIndex = isMaximized ? '60' : '50';
                playerElement.style.setProperty('z-index', zIndex, 'important');
                
                playerElement.style.setProperty('border-radius', isMaximized ? '0' : '0.75rem', 'important');
                playerElement.style.setProperty('overflow', 'hidden', 'important');
                
                playerElement.style.setProperty('pointer-events', 'auto', 'important');
                playerElement.style.setProperty('display', 'block', 'important');
                playerElement.style.setProperty('opacity', '1', 'important'); // Visible

                // If the element is an iframe, ensure attributes are set
                if (playerElement.tagName === 'IFRAME') {
                    playerElement.setAttribute('width', '100%');
                    playerElement.setAttribute('height', '100%');
                }
            } else if (playerElement) {
                // Hide if not in video mode or view closed
                // We use opacity 0 and size 1px to keep it "active" for audio but hidden
                playerElement.style.setProperty('width', '1px', 'important');
                playerElement.style.setProperty('height', '1px', 'important');
                playerElement.style.setProperty('opacity', '0', 'important');
                playerElement.style.setProperty('z-index', '-100', 'important');
                playerElement.style.setProperty('pointer-events', 'none', 'important');
            }

            // Continuously update position to handle smooth transitions/resizes
            if (isOpen && viewMode === 'video') {
                animationFrameId = requestAnimationFrame(updateVideoPosition);
            }
        };

        updateVideoPosition();
        
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
             const playerElement = document.getElementById('player-container');
             if (playerElement) {
                playerElement.style.setProperty('width', '1px', 'important');
                playerElement.style.setProperty('height', '1px', 'important');
                playerElement.style.setProperty('opacity', '0', 'important');
                playerElement.style.setProperty('z-index', '-100', 'important');
            }
        };
    }, [isOpen, viewMode, isMaximized]);


    return (
        <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-modal="true"
            role="dialog"
        >
            {/* Background */}
            <div className="absolute inset-0" onClick={onClose}>
                <img src={imageUrl} alt="" className="w-full h-full object-cover blur-3xl scale-110 opacity-60" />
                <div className="absolute inset-0 bg-black/80"></div>
                {showVisualEffect && <FloatingParticles />}
            </div>
            
            <div 
                onClick={e => e.stopPropagation()}
                className={`
                    absolute bottom-0 left-0 right-0 z-10 
                    h-[85vh] md:h-full 
                    w-full 
                    bg-dark-surface/80 backdrop-blur-xl rounded-t-3xl
                    md:bg-transparent md:backdrop-blur-none md:rounded-none
                    flex flex-col items-center justify-start pt-12 p-4
                    md:justify-center md:pt-0 md:p-6 text-white
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                    ${isMaximized ? '!bg-black !h-full !rounded-none justify-center p-0' : ''}
                `}>
                
                {children}

                {/* Mobile Handle (Hidden if maximized) */}
                {!isMaximized && <div className="absolute top-3 w-12 h-1.5 bg-white/20 rounded-full md:hidden"></div>}

                 <button 
                    onClick={onClose} 
                    className={`absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 ${isMaximized ? 'hidden' : ''}`}
                    aria-label="Tutup tampilan pemutar"
                >
                    <i className="fas fa-chevron-down text-lg"></i>
                </button>
                
                {/* Album Art / Lyrics / Video Container */}
                <div 
                    ref={albumContainerRef}
                    className={`
                        relative z-20 transition-all duration-300 ease-in-out shadow-2xl
                        ${isMaximized 
                            ? 'fixed inset-0 w-full h-full bg-black' 
                            : `w-full max-w-[350px] md:max-w-lg mx-auto ${viewMode === 'video' ? 'aspect-video' : 'aspect-square'} max-h-[50vh] md:max-h-[60vh] mb-8`
                        }
                    `}
                >
                   <Suspense fallback={<ViewPlaceholder />}>
                        {viewMode === 'lyrics' ? (
                            <LyricsView track={track} />
                        ) : (
                            <div className={`relative w-full h-full ${isMaximized ? '' : 'rounded-xl'} overflow-hidden bg-black ring-1 ring-white/10`}>
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
                                        className="absolute top-6 right-6 z-[70] w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-red transition-colors border border-white/10"
                                    >
                                        <i className="fas fa-compress text-xl"></i>
                                    </button>
                                )}
                            </div>
                        )}
                   </Suspense>
                </div>
                    
                {/* Controls (Hidden if maximized) */}
                {!isMaximized && (
                    <div className="w-full max-w-lg text-center z-50 relative flex flex-col justify-end flex-grow md:flex-grow-0 pb-6 md:pb-0">
                        <div className="flex items-center justify-between mb-2 md:mb-6 px-2">
                            <div className="flex-1 text-left">
                                <h1 className="text-xl md:text-2xl font-bold text-white truncate leading-tight" title={track.snippet.title}>{track.snippet.title}</h1>
                                <p className="text-sm md:text-base text-gray-400 mt-1 truncate">{track.snippet.channelTitle}</p>
                            </div>
                            <button 
                                onClick={onToggleLike}
                                className={`w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0 ml-4 ${isLiked ? 'text-brand-red' : 'text-white/60'}`}
                                title={isLiked ? "Batal Suka" : "Suka"}
                            >
                                <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-2xl`}></i>
                            </button>
                        </div>

                        <div className="space-y-2 mb-6 md:mb-8">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={(e) => seekTo(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-red hover:h-2 transition-all"
                            />
                            <div className="flex justify-between text-xs font-medium text-gray-400 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2 md:px-8">
                            <button
                                onClick={() => setShowVisualEffect(p => !p)}
                                title="Efek Visual"
                                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors ${showVisualEffect ? 'text-brand-red !text-opacity-100 bg-white/5' : ''}`}
                            >
                                <i className="fas fa-magic text-lg"></i>
                            </button>
                            
                            <button onClick={onPrev} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors">
                                <i className="fas fa-step-backward text-2xl"></i>
                            </button>
                            
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)} 
                                className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white text-black rounded-full shadow-lg shadow-white/10 hover:scale-105 active:scale-95 transition-all"
                            >
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl md:text-4xl ml-1`}></i>
                            </button>
                            
                            <button onClick={onNext} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors">
                                <i className="fas fa-step-forward text-2xl"></i>
                            </button>

                            <div className="relative group">
                                <button
                                    onClick={() => {
                                        if (viewMode === 'video') {
                                            if (isMaximized) setIsMaximized(false);
                                            else setIsMaximized(true);
                                        } else {
                                            setViewMode('video');
                                        }
                                    }}
                                    title={viewMode === 'video' ? (isMaximized ? "Keluar Layar Penuh" : "Layar Penuh") : "Mode Video"}
                                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors ${viewMode === 'video' ? 'text-brand-red !text-opacity-100 bg-white/5' : ''}`}
                                >
                                    <i className={`fas ${viewMode === 'video' && !isMaximized ? 'fa-expand' : 'fa-video'} text-lg`}></i>
                                </button>
                            </div>
                        </div>
                        
                        {/* Secondary Controls Row */}
                        <div className="flex justify-center items-center space-x-6 mt-6 md:mt-8">
                             <button
                                onClick={() => setViewMode(p => p === 'lyrics' ? 'album' : 'lyrics')}
                                title="Lirik"
                                className={`text-xs flex flex-col items-center gap-1 ${viewMode === 'lyrics' ? 'text-brand-red' : 'text-gray-400 hover:text-white'}`}
                            >
                                <i className="fas fa-microphone-alt text-xl"></i>
                                <span>Lirik</span>
                            </button>
                            
                            <button
                                onClick={() => setShowVisualizer(p => !p)}
                                disabled={viewMode !== 'album'}
                                title="Visualizer"
                                className={`text-xs flex flex-col items-center gap-1 ${showVisualizer && viewMode === 'album' ? 'text-brand-red' : 'text-gray-400 hover:text-white'} disabled:opacity-30`}
                            >
                                <i className="fas fa-chart-bar text-xl"></i>
                                <span>Visual</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
