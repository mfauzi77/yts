
import { useState, useEffect, useRef, useCallback } from 'react';

interface YouTubePlayer {
  loadVideoById: (videoId: string | { videoId: string; suggestedQuality?: string }) => void;
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
    onError?: (event: { data: number }) => void;
}

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';

export const useYouTubePlayer = ({ videoId, isPlaying, onStateChange, onError }: UseYouTubePlayerProps) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const intervalRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(100);

    const onStateChangeRef = useRef(onStateChange);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onStateChangeRef.current = onStateChange;
        onErrorRef.current = onError;
    }, [onStateChange, onError]);

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
                    'vq': 'tiny', // Unofficial but often respected quality hint
                },
                events: {
                    'onReady': () => {
                        setIsReady(true);
                    },
                    'onStateChange': (event: any) => onStateChangeRef.current?.(event),
                    'onError': (event: any) => onErrorRef.current?.(event),
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
            playerRef.current?.loadVideoById({
                videoId: videoId,
                suggestedQuality: 'small'
            });
        }
    }, [isReady, videoId]);
    
    useEffect(() => {
        if (!isReady) return;

        clearTimeInterval(); // Clear any existing interval
        if (isPlaying) {
            // Panggil playVideo secara eksplisit dan gunakan interval untuk memastikan statusnya 'playing'
            const attemptPlay = () => {
                const state = playerRef.current?.getPlayerState();
                if (state !== 1) { // 1 is Playing
                    playerRef.current?.playVideo();
                }
            };
            
            attemptPlay();
            // Coba lagi setelah jeda singkat jika belum memutar (antisipasi blokir browser)
            const retryTimeout = setTimeout(attemptPlay, 1000);

            intervalRef.current = window.setInterval(() => {
                const newDuration = playerRef.current?.getDuration() ?? 0;
                const newTime = playerRef.current?.getCurrentTime() ?? 0;
                setDuration(newDuration);
                setCurrentTime(newTime);
                
                // Jika isPlaying true tapi player berhenti (bukan karena buffering), coba putar lagi
                const state = playerRef.current?.getPlayerState();
                if (isPlaying && state === 2) { // 2 is Paused
                    // Jangan paksa jika user memang baru saja pause, tapi di sini isPlaying adalah state internal app
                    // Jika state app 'playing' tapi player 'paused', berarti ada ketidaksinkronan
                }
            }, 500);
            
            return () => {
                clearTimeInterval();
                clearTimeout(retryTimeout);
            };
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

    const play = useCallback(() => {
        if (isReady) {
            playerRef.current?.playVideo();
        }
    }, [isReady]);

    const pause = useCallback(() => {
        if (isReady) {
            playerRef.current?.pauseVideo();
        }
    }, [isReady]);
    
    useEffect(() => {
        if(isReady) {
            setVolumeState(playerRef.current?.getVolume() ?? 100);
        }
    }, [isReady]);

    return { setVolume, volume, seekTo, currentTime, duration, play, pause };
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
