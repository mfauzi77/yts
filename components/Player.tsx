import React, { useEffect } from 'react';
import type { VideoItem } from '../types';

interface PlayerProps {
  track: VideoItem;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleNowPlaying: () => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  seekTo: (seconds: number) => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};


export const Player: React.FC<PlayerProps> = ({
    track, isPlaying, setIsPlaying, onNext, onPrev, onToggleNowPlaying,
    onSelectChannel, volume, setVolume, currentTime, duration, seekTo,
    isAutoplayEnabled, onToggleAutoplay
}) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === 'Space') { e.preventDefault(); setIsPlaying(!isPlaying); }
            if (e.code === 'ArrowRight') { e.preventDefault(); onNext(); }
            if (e.code === 'ArrowLeft') { e.preventDefault(); onPrev(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, isPlaying, setIsPlaying]);

    const handleChannelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleNowPlaying();
        onSelectChannel(track.snippet.channelId, track.snippet.channelTitle);
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative bg-dark-surface border-t border-dark-card/50">
             {/* Mobile Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-dark-card md:hidden">
                <div className="bg-brand-red h-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden p-2 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img 
                        src={track.snippet.thumbnails.default.url} 
                        alt={track.snippet.title} 
                        className="w-12 h-12 rounded-md object-cover cursor-pointer flex-shrink-0"
                        onClick={onToggleNowPlaying}
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-sm cursor-pointer text-white truncate" onClick={onToggleNowPlaying}>{track.snippet.title}</p>
                        <p className="text-xs text-dark-subtext truncate cursor-pointer hover:underline" onClick={handleChannelClick}>
                            {track.snippet.channelTitle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center text-white">
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl`}></i>
                    </button>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-3 items-center text-white p-3">
                {/* Left: Track Info */}
                <div className="flex items-center space-x-4">
                    <img 
                        src={track.snippet.thumbnails.default.url} 
                        alt={track.snippet.title} 
                        className="w-14 h-14 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={onToggleNowPlaying}
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-sm cursor-pointer hover:underline truncate" onClick={onToggleNowPlaying}>{track.snippet.title}</p>
                        <p className="text-xs text-dark-subtext cursor-pointer hover:underline" onClick={handleChannelClick}>
                            {track.snippet.channelTitle}
                        </p>
                    </div>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-6">
                        <button onClick={onPrev} className="text-dark-subtext hover:text-white transition-colors">
                            <i className="fas fa-step-backward fa-lg"></i>
                        </button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-md hover:scale-105 transition-transform">
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} fa-lg`}></i>
                        </button>
                        <button onClick={onNext} className="text-dark-subtext hover:text-white transition-colors">
                            <i className="fas fa-step-forward fa-lg"></i>
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 w-full max-w-md mt-2">
                        <span className="text-xs text-dark-subtext font-mono">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => seekTo(Number(e.target.value))}
                            className="w-full h-1 bg-dark-card rounded-lg appearance-none cursor-pointer accent-brand-red"
                        />
                        <span className="text-xs text-dark-subtext font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Volume & Options */}
                <div className="flex items-center space-x-4 justify-end">
                    <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-green-900/30 border border-green-500/30 rounded text-[10px] text-green-400 font-bold">
                        <i className="fas fa-leaf"></i>
                        DATA SAVER
                    </div>
                    <button
                        onClick={onToggleAutoplay}
                        title="Alihkan Putar Otomatis"
                        className={`p-2 rounded-full text-dark-subtext hover:bg-dark-card hover:text-white transition-colors ${isAutoplayEnabled ? 'text-brand-red' : ''}`}
                    >
                        <i className="fas fa-redo-alt"></i>
                    </button>
                    <div className="flex items-center space-x-2 w-32">
                        <i className={`fas ${volume === 0 ? 'fa-volume-mute' : 'fa-volume-down'} text-dark-subtext`}></i>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-full h-1 bg-dark-card rounded-lg appearance-none cursor-pointer accent-brand-red"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};