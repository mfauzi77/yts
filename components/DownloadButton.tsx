import React from 'react';
import type { TrackDownloadState } from '../hooks/useDownloadManager';

interface DownloadButtonProps {
  state: TrackDownloadState;
  onDownload: () => void;
  onDelete: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  state,
  onDownload,
  onDelete,
  className = '',
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 'text-sm' : 'text-base';
  const btnBase = `flex items-center justify-center rounded-full transition-all duration-200 ${className}`;

  if (state.status === 'downloading') {
    // Show circular progress
    const r = 8;
    const circ = 2 * Math.PI * r;
    const offset = circ - (state.progress / 100) * circ;
    return (
      <div className={`${btnBase} w-8 h-8 relative`} title={`Mengunduh... ${state.progress}%`}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 20 20">
          {/* Track */}
          <circle cx="10" cy="10" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          {/* Progress */}
          <circle
            cx="10" cy="10" r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${offset}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <span className="text-[9px] font-bold text-white z-10">{state.progress}</span>
      </div>
    );
  }

  if (state.status === 'done') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={`${btnBase} w-8 h-8 text-green-400 hover:text-red-400 hover:bg-red-500/10`}
        title="Tersimpan offline — Klik untuk hapus"
      >
        <i className={`fas fa-check-circle ${iconSize}`} />
      </button>
    );
  }

  if (state.status === 'error') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        className={`${btnBase} w-8 h-8 text-red-400 hover:text-white hover:bg-red-500/20`}
        title={`Gagal: ${state.error ?? ''} — Coba lagi`}
      >
        <i className={`fas fa-exclamation-circle ${iconSize}`} />
      </button>
    );
  }

  // idle
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onDownload(); }}
      className={`${btnBase} w-8 h-8 text-dark-subtext hover:text-white hover:bg-white/10`}
      title="Simpan untuk diputar offline"
    >
      <i className={`fas fa-arrow-circle-down ${iconSize}`} />
    </button>
  );
};
