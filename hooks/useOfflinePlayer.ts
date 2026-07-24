import { useState, useCallback } from 'react';

interface UseOfflinePlayerProps {
    videoId: string | null;
    isPlaying: boolean;
    onEnded?: () => void;
}

export const useOfflinePlayer = ({ videoId: _videoId, isPlaying: _isPlaying, onEnded: _onEnded }: UseOfflinePlayerProps) => {
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [localCurrentTime, setLocalCurrentTime] = useState(0);
    const [localDuration, setLocalDuration] = useState(0);
    const [localVolume, setLocalVolumeState] = useState(100);

    const localSeekTo = useCallback((seconds: number) => {
        setLocalCurrentTime(seconds);
    }, []);

    const localSetVolume = useCallback((vol: number) => {
        setLocalVolumeState(vol);
    }, []);

    return {
        isLocalMode,
        setIsLocalMode,
        localCurrentTime,
        localDuration,
        localSeekTo,
        localVolume,
        localSetVolume,
    };
};
