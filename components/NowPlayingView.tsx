import React, { useState } from 'react';
import type { VideoItem } from '../types';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';

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
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
    isOpen, onClose, track, isPlaying, setIsPlaying, onNext, onPrev,
    volume, setVolume, currentTime, duration, seekTo, isAutoplayEnabled, onToggleAutoplay,
    children
}) => {
    const [showVisualizer, setShowVisualizer] = useState(false);
    
    const imageUrl = track.snippet.thumbnails.high?.url || track.snippet.thumbnails.default.url;

    return (
        <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0" onClick={onClose}>
                <img src={imageUrl} alt="" className="w-full h-full object-cover blur-3xl scale-110" />
                <div className="absolute inset-0 bg-black/70"></div>
            </div>
            
            <div 
                onClick={e => e.stopPropagation()}
                className={`
                    absolute bottom-0 left-0 right-0 z-10 
                    h-[65vh] md:h-full 
                    w-full 
                    bg-dark-surface/50 backdrop-blur-lg rounded-t-2xl
                    md:bg-transparent md:backdrop-blur-none md:rounded-none
                    flex flex-col items-center justify-around p-4 pt-8
                    md:justify-center md:p-6 text-white
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                `}>
                
                {children}

                {/* Mobile Handle */}
                <div className="absolute top-2.5 w-10 h-1.5 bg-white/30 rounded-full md:hidden"></div>

                 <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors" 
                    aria-label="Tutup tampilan pemutar"
                >
                    <i className="fas fa-chevron-down text-lg"></i>
                </button>
                
                {/* Album Art */}
                <div className="w-10/12 max-w-[240px] md:w-full md:max-w-sm">
                    <div className="relative w-full aspect-square rounded-lg shadow-2xl overflow-hidden mb-4 md:mb-8">
                        {showVisualizer ? (
                            <AudioVisualizerCanvas isPlaying={isPlaying} />
                        ) : (
                            <img 
                                src={imageUrl} 
                                alt={track.snippet.title} 
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>
                    
                {/* Controls */}
                <div className="w-full max-w-md text-center">
                    <h1 className="text-lg md:text-2xl font-bold">{track.snippet.title}</h1>
                    <p className="text-sm text-white/70 mt-1">{track.snippet.channelTitle}</p>

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

                    <div className="flex justify-center items-center space-x-4 md:space-x-8 my-2 md:my-4">
                        <button
                            onClick={() => setShowVisualizer(p => !p)}
                            title="Alihkan Visualizer"
                            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${showVisualizer ? 'text-brand-red' : ''}`}
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
                            onClick={onToggleAutoplay}
                            title="Alihkan Putar Otomatis"
                            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 ${isAutoplayEnabled ? 'text-brand-red' : ''}`}
                        >
                            <i className="fas fa-redo-alt text-lg md:text-xl"></i>
                        </button>
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
            </div>
        </div>
    );
};