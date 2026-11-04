import React from 'react';
import type { VideoItem } from '../types';

interface FloatingMiniVideoProps {
  track: VideoItem;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  onCloseVideoMode: () => void;
}

export const FloatingMiniVideo: React.FC<FloatingMiniVideoProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onExpand,
  onCloseVideoMode,
}) => {
  return (
    <aside 
      aria-label="Pemutar Mini Video YouTube"
      className="fixed z-40 bottom-16 md:bottom-24 right-3 md:right-6 w-64 sm:w-80 bg-dark-surface/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/15 overflow-hidden flex flex-col group transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Top Header / Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 border-b border-white/5 text-xs text-white">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <i className="fab fa-youtube text-brand-red text-sm flex-shrink-0"></i>
          <span className="font-semibold truncate text-[11px]">{track.snippet.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onExpand}
            className="p-1 rounded hover:bg-white/10 text-dark-subtext hover:text-white transition-colors"
            title="Perbesar ke Mode Video YouTube Penuh"
            aria-label="Perbesar ke Mode Video YouTube Penuh"
          >
            <i className="fas fa-expand-alt text-xs"></i>
          </button>
          <button
            onClick={onCloseVideoMode}
            className="p-1 rounded hover:bg-white/10 text-dark-subtext hover:text-red-400 transition-colors"
            title="Kembali ke Mode Audio"
            aria-label="Kembali ke Mode Audio"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      {/* 16:9 Video Viewport Slot for #player-container docking */}
      <div 
        id="yt-pip-video-slot"
        onClick={onExpand}
        className="w-full aspect-video bg-black relative cursor-pointer group"
      >
        <div className="absolute inset-0 bg-transparent pointer-events-none group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm transition-opacity">
            <i className="fas fa-expand text-[9px]"></i> Klik untuk memperbesar
          </span>
        </div>
      </div>

      {/* Mini Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-card/90">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] text-dark-subtext truncate">{track.snippet.channelTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center text-dark-subtext hover:text-white transition-colors"
            aria-label="Lagu Sebelumnya"
          >
            <i className="fas fa-step-backward text-xs"></i>
          </button>
          <button
            onClick={onTogglePlay}
            className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center shadow hover:bg-red-700 transition-colors"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-[10px] ${!isPlaying ? 'ml-0.5' : ''}`}></i>
          </button>
          <button
            onClick={onNext}
            className="w-7 h-7 flex items-center justify-center text-dark-subtext hover:text-white transition-colors"
            aria-label="Lagu Berikutnya"
          >
            <i className="fas fa-step-forward text-xs"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};
