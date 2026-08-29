import React, { useState, lazy, Suspense } from 'react';
import type { VideoItem } from '../types';
import { FloatingParticles } from './FloatingParticles';
import {
  ChevronDown,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Mic2,
  Activity,
  Disc3,
  Plus,
  Sparkles,
} from 'lucide-react';

const AudioVisualizerCanvas = lazy(() =>
  import('./AudioVisualizerCanvas').then((m) => ({ default: m.AudioVisualizerCanvas }))
);
const LyricsView = lazy(() =>
  import('./LyricsView').then((m) => ({ default: m.LyricsView }))
);

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
  isShuffleEnabled?: boolean;
  onToggleShuffle?: () => void;
  children?: React.ReactNode;
  isLiked: boolean;
  onToggleLike: () => void;
  onOpenAddToPlaylist?: (track: VideoItem) => void;
  onSelectChannel?: (channelId: string, channelTitle: string) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrev,
  currentTime,
  duration,
  seekTo,
  isAutoplayEnabled,
  onToggleAutoplay,
  isShuffleEnabled = false,
  onToggleShuffle,
  children,
  isLiked,
  onToggleLike,
  onOpenAddToPlaylist,
  onSelectChannel,
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'visualizer'>('cover');
  const [showParticles, setShowParticles] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(currentTime);

  const imageUrl =
    track.snippet.thumbnailData ||
    track.snippet.thumbnails.high?.url ||
    track.snippet.thumbnails.medium?.url ||
    track.snippet.thumbnails.default.url;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#121212] text-white overflow-hidden animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Ambient Glow Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover blur-[100px] scale-150 opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#121212]/85 to-[#121212]" />
        {showParticles && <FloatingParticles />}
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full px-6 py-4 md:py-6 justify-between">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full flex-shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center text-white transition-colors"
            aria-label="Tutup pemutar"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* Mode Switcher Pills */}
          <div className="flex items-center bg-[#1c1c1c] rounded-full p-1 border border-[#282828]">
            <button
              onClick={() => setActiveTab('cover')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'cover'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>Lagu</span>
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'lyrics'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Lirik</span>
            </button>
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'visualizer'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
          </div>

          <button
            onClick={() => setShowParticles((p) => !p)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showParticles ? 'text-emerald-400' : 'text-[#9ca3af] hover:text-white'
            }`}
            title="Efek Ambient"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Center Main Stage: Large Artwork / Lyrics / Visualizer */}
        <div className="flex-1 flex items-center justify-center my-4 min-h-0">
          {activeTab === 'cover' && (
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#181818] border border-[#282828]">
              <img
                src={imageUrl}
                alt={track.snippet.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="w-full h-full max-h-[52vh] overflow-y-auto no-scrollbar rounded-xl bg-[#181818]/90 p-5 border border-[#282828]">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full text-[#9ca3af]">
                    <span>Memuat lirik...</span>
                  </div>
                }
              >
                <LyricsView track={track} />
              </Suspense>
            </div>
          )}

          {activeTab === 'visualizer' && (
            <div className="w-full h-full max-h-[52vh] rounded-xl overflow-hidden bg-[#181818]/90 p-3 border border-[#282828] flex items-center justify-center">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full text-[#9ca3af]">
                    <span>Memuat visualizer...</span>
                  </div>
                }
              >
                <AudioVisualizerCanvas isPlaying={isPlaying} />
              </Suspense>
            </div>
          )}
        </div>

        {/* Bottom Section: Info, Scrubber, Controls */}
        <div className="w-full space-y-4 flex-shrink-0">
          {/* Song Title, Artist & Like */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2
                className="text-base sm:text-lg md:text-2xl font-bold md:font-black text-white line-clamp-2 leading-snug"
                title={track.snippet.title}
              >
                {track.snippet.title}
              </h2>
              <p
                className="text-xs sm:text-sm md:text-base text-[#9ca3af] hover:text-white hover:underline truncate cursor-pointer mt-1 font-medium"
                onClick={() => {
                  if (onSelectChannel) {
                    onClose();
                    onSelectChannel(track.snippet.channelId, track.snippet.channelTitle);
                  }
                }}
              >
                {track.snippet.channelTitle}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenAddToPlaylist && (
                <button
                  onClick={() => onOpenAddToPlaylist(track)}
                  className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  title="Tambah ke Playlist"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onToggleLike}
                className={`p-2.5 rounded-full transition-colors active:scale-95 ${
                  isLiked ? 'text-emerald-400' : 'text-[#9ca3af] hover:text-white'
                }`}
                title={isLiked ? 'Batal Suka' : 'Suka'}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={isSeeking ? seekVal : currentTime}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={(e) => setSeekVal(Number(e.target.value))}
              onMouseUp={(e) => {
                setIsSeeking(false);
                seekTo(Number((e.target as HTMLInputElement).value));
              }}
              onTouchEnd={(e) => {
                setIsSeeking(false);
                seekTo(Number((e.target as HTMLInputElement).value));
              }}
              className="w-full h-1.5 bg-[#282828] rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-500 transition-all"
            />
            <div className="flex justify-between text-xs font-mono text-[#9ca3af] px-0.5">
              <span>{formatTime(isSeeking ? seekVal : currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            {onToggleShuffle ? (
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-full transition-colors ${
                  isShuffleEnabled ? 'text-emerald-400' : 'text-[#9ca3af] hover:text-white'
                }`}
                title="Acak"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10" />
            )}

            <button
              onClick={onPrev}
              className="p-2.5 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Lagu Sebelumnya"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl p-4"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current text-black" />
              ) : (
                <Play className="w-8 h-8 fill-current text-black ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2.5 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Lagu Berikutnya"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onToggleAutoplay}
              className={`p-2.5 rounded-full transition-colors ${
                isAutoplayEnabled ? 'text-emerald-400' : 'text-[#9ca3af] hover:text-white'
              }`}
              title={isAutoplayEnabled ? 'Putar Otomatis Aktif' : 'Putar Otomatis Nonaktif'}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

