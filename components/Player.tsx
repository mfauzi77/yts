import React, { useEffect, useState } from 'react';
import type { VideoItem } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Heart,
  Plus,
  Mic2,
  ListMusic,
  ChevronUp,
} from 'lucide-react';

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
  isShuffleEnabled?: boolean;
  onToggleShuffle?: () => void;
  isLiked?: boolean;
  onToggleLike?: (track: VideoItem) => void;
  onOpenAddToPlaylist?: (track: VideoItem) => void;
  onToggleQueue?: () => void;
  isQueueOpen?: boolean;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  duration,
  seekTo,
  isAutoplayEnabled,
  onToggleAutoplay,
  isShuffleEnabled = false,
  onToggleShuffle,
  isLiked = false,
  onToggleLike,
  onOpenAddToPlaylist,
  onToggleQueue,
  isQueueOpen = false,
}) => {
  const [prevVolume, setPrevVolume] = useState<number>(volume || 80);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekValue, setSeekValue] = useState<number>(currentTime);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  // Keyboard shortcut listener (Space = play/pause, Ctrl+Right = next, Ctrl+Left = prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onNext();
      }
      if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, isPlaying, setIsPlaying]);

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChannel(track.snippet.channelId, track.snippet.channelTitle);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 80);
    }
  };

  const progressPercentage = duration > 0 ? (seekValue / duration) * 100 : 0;
  const imageUrl =
    track.snippet.thumbnailData ||
    track.snippet.thumbnails.medium?.url ||
    track.snippet.thumbnails.default.url;

  return (
    <div className="relative select-none">
      {/* =========================================================================
          MOBILE VIEW: Sleek Floating Mini-Player docked right above bottom nav
      ========================================================================== */}
      <div className="md:hidden px-2 pb-1">
        <div
          onClick={onToggleNowPlaying}
          className="relative bg-[#181818] rounded-xl p-2 flex items-center justify-between gap-2.5 cursor-pointer shadow-2xl active:scale-[0.99] transition-transform overflow-hidden border border-[#282828]"
        >
          {/* Top Edge Progress Bar Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Left: Thumbnail & Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#242424]">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium sm:font-semibold text-[11px] sm:text-xs text-white truncate leading-tight">
                {track.snippet.title}
              </p>
              <p className="text-[10px] text-[#9ca3af] truncate mt-0.5">
                {track.snippet.channelTitle}
              </p>
            </div>
          </div>

          {/* Right: Quick Mini Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(track)}
                className={`p-1.5 rounded-full transition-colors ${
                  isLiked ? 'text-emerald-400' : 'text-[#9ca3af] active:text-white'
                }`}
                title={isLiked ? 'Batal Suka' : 'Suka'}
                aria-label="Suka"
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 rounded-full text-[#9ca3af] active:text-white transition-colors"
              aria-label="Lagu Berikutnya"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW: Persistent Bottom Player (Spotify-exact 3-column layout)
      ========================================================================== */}
      <div className="hidden md:grid grid-cols-[30%_40%_30%] items-center px-4 py-3 bg-[#121212] border-t border-[#282828] h-[80px]">
        {/* LEFT COLUMN: Track Info, Like & Add buttons */}
        <div className="flex items-center gap-3.5 min-w-0 pr-4">
          <div
            className="group relative w-14 h-14 rounded-lg overflow-hidden bg-[#242424] flex-shrink-0 cursor-pointer shadow-md"
            onClick={onToggleNowPlaying}
          >
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ChevronUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="text-sm font-bold text-white hover:underline truncate cursor-pointer"
              onClick={onToggleNowPlaying}
              title={track.snippet.title}
            >
              {track.snippet.title}
            </h4>
            <p
              className="text-xs text-[#9ca3af] hover:text-white hover:underline truncate cursor-pointer mt-0.5 transition-colors"
              onClick={handleChannelClick}
            >
              {track.snippet.channelTitle}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(track)}
                className={`p-2 rounded-full transition-colors ${
                  isLiked ? 'text-emerald-400' : 'text-[#9ca3af] hover:text-white'
                }`}
                title={isLiked ? 'Batal Suka' : 'Suka Lagu Ini'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            )}

            {onOpenAddToPlaylist && (
              <button
                onClick={() => onOpenAddToPlaylist(track)}
                className="p-2 rounded-full text-[#9ca3af] hover:text-white transition-colors"
                title="Tambah ke Playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Playback Controls & Progress Scrubber */}
        <div className="flex flex-col items-center justify-center w-full px-2">
          {/* Main Controls Row */}
          <div className="flex items-center gap-4 mb-1">
            {onToggleShuffle && (
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 rounded-full transition-colors ${
                  isShuffleEnabled
                    ? 'text-emerald-400'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
                title={isShuffleEnabled ? 'Acak Aktif' : 'Acak Nonaktif'}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onPrev}
              className="p-1.5 rounded-full text-[#9ca3af] hover:text-white transition-colors active:scale-95"
              title="Lagu Sebelumnya (P atau Shift+←)"
              aria-label="Lagu Sebelumnya"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 rounded-full text-[#9ca3af] hover:text-white transition-colors active:scale-95"
              title="Lagu Berikutnya (N atau Shift+→)"
              aria-label="Lagu Berikutnya"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onToggleAutoplay}
              className={`p-1.5 rounded-full transition-colors ${
                isAutoplayEnabled
                  ? 'text-emerald-400'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
              title={isAutoplayEnabled ? 'Putar Otomatis Aktif' : 'Putar Otomatis Nonaktif'}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-[11px] font-mono text-[#9ca3af] w-8 text-right">
              {formatTime(seekValue)}
            </span>

            <div className="relative flex-1 group flex items-center py-1 cursor-pointer">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={seekValue}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onChange={(e) => setSeekValue(Number(e.target.value))}
                onMouseUp={(e) => {
                  setIsSeeking(false);
                  seekTo(Number((e.target as HTMLInputElement).value));
                }}
                onTouchEnd={(e) => {
                  setIsSeeking(false);
                  seekTo(Number((e.target as HTMLInputElement).value));
                }}
                className="w-full h-1 bg-[#333333] rounded-full appearance-none cursor-pointer accent-emerald-500 hover:h-1.5 transition-all"
              />
            </div>

            <span className="text-[11px] font-mono text-[#9ca3af] w-8 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Lyrics, Queue, Volume & Fullscreen */}
        <div className="flex items-center justify-end gap-2 pl-4">
          <button
            onClick={onToggleNowPlaying}
            className="p-2 rounded-full text-[#9ca3af] hover:text-white transition-colors"
            title="Lirik & Visualizer"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {onToggleQueue && (
            <button
              onClick={onToggleQueue}
              className={`p-2 rounded-full transition-colors ${
                isQueueOpen ? 'text-emerald-400 bg-[#1c1c1c]' : 'text-[#9ca3af] hover:text-white'
              }`}
              title="Antrean Pemutaran"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full text-[#9ca3af] hover:text-white transition-colors"
              title={volume === 0 ? 'Bunyikan' : 'Bisukan'}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-emerald-400" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 lg:w-24 h-1 bg-[#333333] rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-500"
              title={`Volume ${volume}%`}
            />
          </div>

          <button
            onClick={onToggleNowPlaying}
            className="p-2 rounded-full text-[#9ca3af] hover:text-white transition-colors"
            title="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

