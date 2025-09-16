
import { useState, useEffect, useRef, useCallback } from 'react';

interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
}

interface UseYouTubePlayerProps {
    videoId: string | null;
    isPlaying: boolean;
    onStateChange?: (event: { data: number }) => void;
}

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';

export const useYouTubePlayer = ({ videoId, isPlaying, onStateChange }: UseYouTubePlayerProps) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    const initializePlayer = useCallback(() => {
        if (window.YT && window.YT.Player) {
            playerRef.current = new window.YT.Player('player-container', {
                height: '0',
                width: '0',
                playerVars: {
                    'playsinline': 1,
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                },
                events: {
                    'onReady': () => setIsReady(true),
                    'onStateChange': onStateChange
                }
            });
        }
    }, [onStateChange]);

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
        if (isPlaying) {
            playerRef.current?.playVideo();
        } else {
            playerRef.current?.pauseVideo();
        }
    }, [isReady, isPlaying]);
    
    const setVolume = useCallback((volume: number) => {
        if (isReady) {
            playerRef.current?.setVolume(volume);
        }
    }, [isReady]);
    
    const getVolume = useCallback(() => {
        return playerRef.current?.getVolume() ?? 100;
    }, []);

    return { setVolume, getVolume };
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
