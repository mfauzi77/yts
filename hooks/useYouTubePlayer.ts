
import { useState, useEffect, useRef, useCallback } from 'react';

interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
}

interface UseYouTubePlayerProps {
    videoId: string | null;
    isPlaying: boolean;
    onStateChange?: (event: { data: number }) => void;
}

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';

export const useYouTubePlayer = ({ videoId, isPlaying, onStateChange }: UseYouTubePlayerProps) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const intervalRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(100);

    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    const clearTimeInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const initializePlayer = useCallback(() => {
        if (window.YT && window.YT.Player) {
            playerRef.current = new window.YT.Player('player-container', {
                height: '100%',
                width: '100%',
                playerVars: {
                    'playsinline': 1,
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 1, // Enable fullscreen API permission
                    'origin': window.location.origin, // Fix for Error 153
                    'widget_referrer': window.location.origin,
                    'enablejsapi': 1,
                    'rel': 0,
                    'iv_load_policy': 3, // Hide annotations
                },
                events: {
                    'onReady': () => {
                        setIsReady(true);
                    },
                    'onStateChange': (event) => onStateChangeRef.current?.(event),
                }
            });
        }
    }, []);

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = YOUTUBE_API_SRC;
            window.onYouTubeIframeAPIReady = () => {
                initializePlayer();
            };
            document.body.appendChild(tag);
        } else {
            initializePlayer();
        }

        return () => {
            clearTimeInterval();
            playerRef.current?.destroy();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isReady && videoId) {
            playerRef.current?.loadVideoById(videoId);
        }
    }, [isReady, videoId]);
    
    useEffect(() => {
        if (!isReady) return;

        clearTimeInterval(); // Clear any existing interval
        if (isPlaying) {
            playerRef.current?.playVideo();
            intervalRef.current = window.setInterval(() => {
                const newDuration = playerRef.current?.getDuration() ?? 0;
                const newTime = playerRef.current?.getCurrentTime() ?? 0;
                setDuration(newDuration);
                setCurrentTime(newTime);
            }, 500);
        } else {
            playerRef.current?.pauseVideo();
        }
        
        return clearTimeInterval;
    }, [isReady, isPlaying]);
    
    const setVolume = useCallback((newVolume: number) => {
        if (isReady) {
            playerRef.current?.setVolume(newVolume);
            setVolumeState(newVolume);
        }
    }, [isReady]);

    const seekTo = useCallback((seconds: number) => {
        if (isReady) {
            playerRef.current?.seekTo(seconds, true);
            setCurrentTime(seconds);
        }
    }, [isReady]);
    
    useEffect(() => {
        if(isReady) {
            setVolumeState(playerRef.current?.getVolume() ?? 100);
        }
    }, [isReady]);

    return { setVolume, volume, seekTo, currentTime, duration };
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
