
import React, { useState } from 'react';
import type { Playlist, VideoItem } from '../types';

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
  const [added, setAdded] = useState(false);

  const previewTracks = playlist.tracks.slice(0, 4);
  const remainingCount = Math.max(0, playlist.tracks.length - 4);

  const handleAddToMyPlaylist = () => {
    onAddToMyPlaylist(playlist);
    setAdded(true);
    setTimeout(() => {
      onDismiss();
    }, 1200);
  };

  const handleListen = () => {
    onListen(playlist);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal panel */}
      <div className="relative w-full md:max-w-md bg-dark-surface rounded-t-2xl md:rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up">

        {/* Gradient header strip */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-red via-pink-500 to-orange-400" />

        <div className="p-6">
          {/* Shared badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-1 rounded-full">
              <i className="fas fa-share-alt" />
              Shared Playlist
            </span>
          </div>

          {/* Playlist info */}
          <h2 className="text-2xl font-bold text-white mb-1 truncate">{playlist.name}</h2>
          <p className="text-dark-subtext text-sm mb-5">
            {playlist.tracks.length} lagu
          </p>

          {/* Track preview grid */}
          {previewTracks.length > 0 && (
            <div className="flex gap-2 mb-5 overflow-hidden rounded-xl">
              {previewTracks.map((track) => (
                <div
                  key={track.id.videoId}
                  className="relative flex-1 aspect-square overflow-hidden"
                >
                  <img
                    src={track.snippet.thumbnails.medium?.url || track.snippet.thumbnails.default.url}
                    alt={track.snippet.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Track list preview */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
            {playlist.tracks.map((track, i) => (
              <div key={track.id.videoId} className="flex items-center gap-3">
                <span className="text-dark-subtext text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                <img
                  src={track.snippet.thumbnails.default.url}
                  alt=""
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{track.snippet.title}</p>
                  <p className="text-dark-subtext text-xs truncate">{track.snippet.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleListen}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 active:scale-95"
            >
              <i className="fas fa-play" />
              Dengarkan
            </button>
            <button
              onClick={handleAddToMyPlaylist}
              disabled={added}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl border transition-all duration-200 active:scale-95
                ${added
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                }`}
            >
              <i className={`fas ${added ? 'fa-check' : 'fa-plus'}`} />
              {added ? 'Ditambahkan!' : 'Tambah ke Playlist'}
            </button>
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full mt-3 text-dark-subtext text-sm hover:text-white transition-colors py-2"
          >
            Lewati
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (min-width: 768px) {
          @keyframes slide-up {
            from { transform: translateY(20px) scale(0.96); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};
