import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { getTrackBlobUrl, isTrackOffline } from '../services/offlineService';

interface UseOfflinePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  onEnded?: () => void;
}

interface UseOfflinePlayerReturn {
  isLocalMode: boolean;       // true jika memutar dari local blob
  localDuration: number;
  localCurrentTime: number;
  localVolume: number;
  localSeekTo: (seconds: number) => void;
  localSetVolume: (v: number) => void;
  audioRef: RefObject<HTMLAudioElement>;
}

export const useOfflinePlayer = ({
  videoId,
  isPlaying,
  onEnded,
}: UseOfflinePlayerProps): UseOfflinePlayerReturn => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const blobUrlRef = useRef<string | null>(null);

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localVolume, setLocalVolumeState] = useState(100);

  // Cek apakah videoId tersedia offline & atur sumber audio
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!videoId) {
        // Reset
        audioRef.current.src = '';
        setIsLocalMode(false);
        return;
      }

      const offline = await isTrackOffline(videoId);
      if (cancelled) return;

      if (offline) {
        const blobUrl = await getTrackBlobUrl(videoId);
        if (cancelled || !blobUrl) return;

        // Revoke old blob URL
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = blobUrl;

        audioRef.current.src = blobUrl;
        audioRef.current.load();
        setIsLocalMode(true);
        setLocalDuration(0);
        setLocalCurrentTime(0);
      } else {
        audioRef.current.src = '';
        setIsLocalMode(false);
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [videoId]);

  // Play / Pause
  useEffect(() => {
    if (!isLocalMode) return;

    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isLocalMode]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => setLocalCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (!isNaN(audio.duration)) setLocalDuration(audio.duration);
    };
    const onEnded_ = () => onEnded?.();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded_);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded_);
    };
  }, [onEnded]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      audioRef.current.pause();
    };
  }, []);

  const localSeekTo = useCallback((seconds: number) => {
    audioRef.current.currentTime = seconds;
    setLocalCurrentTime(seconds);
  }, []);

  const localSetVolume = useCallback((v: number) => {
    audioRef.current.volume = v / 100;
    setLocalVolumeState(v);
  }, []);

  return {
    isLocalMode,
    localDuration,
    localCurrentTime,
    localVolume,
    localSeekTo,
    localSetVolume,
    audioRef,
  };
};
