
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
}

const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    const barClasses = "w-1 rounded-full bg-brand-red/70";
    const animationClass = isPlaying ? 'animate-pulse' : '';
    return (
        <div className="flex items-center justify-center space-x-1 h-6">
            <div className={`${barClasses} h-2 ${animationClass}`} style={{ animationDelay: '0s' }}></div>
            <div className={`${barClasses} h-4 ${animationClass}`} style={{ animationDelay: '0.2s' }}></div>
            <div className={`${barClasses} h-6 ${animationClass}`} style={{ animationDelay: '0.4s' }}></div>
            <div className={`${barClasses} h-4 ${animationClass}`} style={{ animationDelay: '0.6s' }}></div>
            <div className={`${barClasses} h-2 ${animationClass}`} style={{ animationDelay: '0.8s' }}></div>
        </div>
    );
};

export const Player: React.FC<PlayerProps> = ({
    track,
    isPlaying,
    setIsPlaying,
    onNext,
    onPrev,
    onToggleNowPlaying,
    onSelectChannel,
    volume,
    setVolume,
    currentTime,
    duration
}) => {
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    }
    
    const handleTogglePlay = () => {
        setIsPlaying(!isPlaying);
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                handleTogglePlay();
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                onNext();
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                onPrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onNext, onPrev, isPlaying]);
    
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleChannelClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onToggleNowPlaying from firing
        onSelectChannel(track.snippet.channelId, track.snippet.channelTitle);
    };

    return (
        <div className="relative bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md shadow-lg p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="absolute top-0 left-0 h-0.5 bg-brand-red" style={{ width: `${progress}%` }}></div>
            <div className="container mx-auto px-4 flex items-center justify-between">
                <div 
                    className="flex items-center space-x-4 w-1/4 cursor-pointer"
                    onClick={onToggleNowPlaying}
                    title="Open player view"
                >
                    <img src={track.snippet.thumbnails.default.url} alt={track.snippet.title} className="w-14 h-14 rounded-md object-cover" />
                    <div>
                        <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{track.snippet.title}</p>
                        <p 
                            className="text-xs text-gray-500 dark:text-dark-subtext hover:underline"
                            onClick={handleChannelClick}
                        >
                            {track.snippet.channelTitle}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center w-1/2">
                    <div className="flex items-center space-x-6">
                        <button onClick={onPrev} className="text-gray-600 dark:text-dark-subtext hover:text-black dark:hover:text-white transition-colors">
                            <i className="fas fa-step-backward fa-lg"></i>
                        </button>
                        <button onClick={handleTogglePlay} className="w-12 h-12 flex items-center justify-center bg-brand-red text-white rounded-full shadow-md hover:bg-red-700 transition-transform transform hover:scale-105">
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} fa-lg`}></i>
                        </button>
                        <button onClick={onNext} className="text-gray-600 dark:text-dark-subtext hover:text-black dark:hover:text-white transition-colors">
                            <i className="fas fa-step-forward fa-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-4 w-1/4 justify-end">
                    <AudioVisualizer isPlaying={isPlaying} />
                    <div className="flex items-center space-x-2 w-32">
                        <i className={`fas ${volume === 0 ? 'fa-volume-mute' : 'fa-volume-down'} text-gray-600 dark:text-dark-subtext`}></i>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-red"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
