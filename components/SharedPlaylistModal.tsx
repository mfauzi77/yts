import React from 'react';
import type { Playlist } from '../types';
import { Share2, X, Play, Plus, ListMusic } from 'lucide-react';

interface SharedPlaylistModalProps {
  playlist: Playlist;
  onListen: (playlist: Playlist) => void;
  onAddToMyPlaylist: (playlist: Playlist) => void;
  onDismiss: () => void;
}

export const SharedPlaylistModal: React.FC<SharedPlaylistModalProps> = ({
  playlist,
  onListen,
  onAddToMyPlaylist,
  onDismiss,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-dark-surface/95 border border-white/10 rounded-3xl p-6 text-white space-y-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Playlist Dibagikan</h2>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-dark-card hover:bg-dark-elevated text-dark-subtext hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-xl font-black text-white truncate">{playlist.name}</h3>
          <p className="text-xs text-dark-subtext mt-0.5">{playlist.tracks.length} lagu tersedia</p>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
          {playlist.tracks.map((track, idx) => (
            <div
              key={track.id.videoId || idx}
              className="flex items-center gap-3 p-2 rounded-xl bg-dark-card/60 border border-white/5"
            >
              <img
                src={
                  track.snippet.thumbnailData ||
                  track.snippet.thumbnails.medium?.url ||
                  track.snippet.thumbnails.default.url
                }
                alt=""
                className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-white">{track.snippet.title}</p>
                <p className="text-[11px] text-dark-subtext truncate">
                  {track.snippet.channelTitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => onListen(playlist)}
            className="flex-1 py-2.5 px-4 bg-brand hover:bg-brand-hover font-bold rounded-xl text-xs text-white transition-all shadow-glow flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Dengarkan</span>
          </button>
          <button
            onClick={() => onAddToMyPlaylist(playlist)}
            className="flex-1 py-2.5 px-4 bg-dark-card hover:bg-dark-elevated font-bold rounded-xl text-xs text-white transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
