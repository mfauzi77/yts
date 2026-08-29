import React, { useState, useEffect } from 'react';
import type { VideoItem, Playlist } from '../types';
import { Plus, Check, X, ListMusic, Music } from 'lucide-react';

interface AddToPlaylistModalProps {
  track: VideoItem;
  playlists: Playlist[];
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, track: VideoItem) => void;
  onCreateAndAdd: (name: string, track: VideoItem) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  onClose,
  onAddToPlaylist,
  onCreateAndAdd,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreateAndAdd(newPlaylistName.trim(), track);
      setNewPlaylistName('');
      onClose();
    }
  };

  const handleAddToExisting = (playlistId: string) => {
    onAddToPlaylist(playlistId, track);
    setAddedIds((prev) => new Set(prev).add(playlistId));
  };

  const isTrackInPlaylist = (playlist: Playlist) =>
    playlist.tracks.some((t) => t.id.videoId === track.id.videoId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-[#181818] border border-[#282828] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#282828]">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-base font-bold text-white">Tambahkan ke Playlist</h2>
            <p className="text-xs text-[#9ca3af] truncate mt-0.5">{track.snippet.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] hover:bg-[#242424] text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Form */}
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 flex items-center gap-2 border-b border-[#282828] bg-[#121212]"
        >
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Atau buat playlist baru..."
            className="flex-1 bg-[#1c1c1c] border border-[#282828] rounded-xl py-2 px-3.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Buat</span>
          </button>
        </form>

        {/* Playlist Items */}
        <div className="overflow-y-auto max-h-64 p-3 space-y-1.5 no-scrollbar">
          {playlists.length > 0 ? (
            playlists.map((p) => {
              const isIn = isTrackInPlaylist(p);
              const justAdded = addedIds.has(p.id);
              const disabled = isIn || justAdded;
              return (
                <button
                  key={p.id}
                  onClick={() => handleAddToExisting(p.id)}
                  disabled={disabled}
                  className="w-full text-left p-3 flex items-center justify-between rounded-xl hover:bg-[#222222] disabled:opacity-40 disabled:hover:bg-transparent transition-all border border-transparent hover:border-[#282828]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-[#9ca3af] flex-shrink-0">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-[#9ca3af]">{p.tracks.length} lagu</p>
                    </div>
                  </div>

                  {(isIn || justAdded) && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      <span>Tersimpan</span>
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#9ca3af]">
              <Music className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
              <p>Belum ada playlist yang dibuat.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282828] text-right bg-[#121212]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] text-white text-xs font-bold border border-[#282828] transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

