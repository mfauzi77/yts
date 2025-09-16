import React from 'react';
import type { VideoItem } from '../types';

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
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
    isOpen, onClose, track, isPlaying, setIsPlaying, onNext, onPrev,
    volume, setVolume, currentTime, duration, seekTo, isAutoplayEnabled, onToggleAutoplay
}) => {
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        seekTo(Number(e.target.value));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    };
    
    const imageUrl = track.snippet.thumbnails.high?.url || track.snippet.thumbnails.default.url;

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-40"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div 
                className={`absolute bottom-0 left-0 right-0 z-50 max-w-4xl mx-auto bg-dark-surface/80 backdrop-blur-md rounded-t-2xl p-6 shadow-2xl text-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    
                    <button 
                        onClick={onClose} 
                        className="absolute -top-2 -right-2 md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/20 transition-colors" 
                        aria-label="Close player view"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>

                    <img 
                        src={imageUrl} 
                        alt={track.snippet.title} 
                        className="w-48 h-48 md:w-64 md:h-64 rounded-lg shadow-2xl object-cover flex-shrink-0"
                    />
                    
                    <div className="flex flex-col flex-grow w-full text-center md:text-left">
                         <h1 className="text-xl md:text-2xl font-bold">{track.snippet.title}</h1>
                        <p className="text-base text-white/70 mt-1 mb-4">{track.snippet.channelTitle}</p>

                        <div className="space-y-1 my-4">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleProgressChange}
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-red"
                            />
                            <div className="flex justify-between text-xs font-mono text-white/80">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex justify-center items-center space-x-8 my-4">
                            <button
                                onClick={onToggleAutoplay}
                                aria-label="Toggle Autoplay"
                                title="Toggle Autoplay"
                                className={`w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors ${isAutoplayEnabled ? 'text-brand-red' : 'text-white/80'}`}
                            >
                                <i className="fas fa-repeat text-xl"></i>
                            </button>
                            <button 
                                onClick={onPrev} 
                                aria-label="Previous track"
                                className="w-12 h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                            >
                                <i className="fas fa-step-backward text-xl"></i>
                            </button>
                            <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full shadow-lg transition-transform transform hover:scale-105">
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl ml-1`}></i>
                            </button>
                            <button 
                                onClick={onNext} 
                                aria-label="Next track"
                                className="w-12 h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                            >
                                <i className="fas fa-step-forward text-xl"></i>
                            </button>
                            {/* Placeholder for spacing */}
                            <div className="w-12 h-12"></div>
                        </div>

                         <div className="flex items-center space-x-3 justify-center md:justify-start mt-4">
                            <i className={`fas fa-volume-down text-white/70`}></i>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-32 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-red"
                            />
                             <i className="fas fa-volume-up text-white/70"></i>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};