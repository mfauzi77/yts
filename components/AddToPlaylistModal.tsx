
import React, { useState, useEffect } from 'react';
import type { VideoItem, Playlist } from '../types';

interface AddToPlaylistModalProps {
  track: VideoItem;
  playlists: Playlist[];
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, track: VideoItem) => void;
  onCreateAndAdd: (name: string, track: VideoItem) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, playlists, onClose, onAddToPlaylist, onCreateAndAdd }) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreateAndAdd(newPlaylistName.trim(), track);
    }
  };

  const handleAddToExisting = (playlistId: string) => {
    onAddToPlaylist(playlistId, track);
    setAddedIds(prev => new Set(prev).add(playlistId));
  };
  
  const isTrackInPlaylist = (playlist: Playlist) => playlist.tracks.some(t => t.id.videoId === track.id.videoId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-dark-card rounded-xl shadow-2xl w-11/12 max-w-sm flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-dark-surface">
            <h2 className="text-lg font-bold text-white">Tambahkan ke playlist</h2>
            <p className="text-sm text-dark-subtext truncate">{track.snippet.title}</p>
        </div>

        <form onSubmit={handleCreateSubmit} className="p-4 flex items-center gap-2 border-b border-dark-surface">
          <input
            type="text"
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            placeholder="...atau buat playlist baru"
            className="flex-grow bg-dark-surface border-none rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-red/70 text-dark-text placeholder-dark-subtext"
          />
          <button type="submit" className="px-4 py-2 bg-brand-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50" disabled={!newPlaylistName.trim()}>Buat</button>
        </form>

        <div className="overflow-y-auto max-h-60 p-2">
            {playlists.length > 0 ? playlists.map(p => {
                const isInPlaylist = isTrackInPlaylist(p);
                const justAdded = addedIds.has(p.id);
                const isDisabled = isInPlaylist || justAdded;
                return (
                    <button 
                        key={p.id}
                        onClick={() => handleAddToExisting(p.id)}
                        disabled={isDisabled}
                        className="w-full text-left p-3 flex items-center justify-between rounded-md hover:bg-dark-highlight disabled:opacity-60 disabled:hover:bg-transparent transition-colors"
                    >
                        <span className="truncate">{p.name}</span>
                        {(isInPlaylist || justAdded) && <i className="fas fa-check text-green-500"></i>}
                    </button>
                )
            }) : (
                <p className="text-center p-4 text-dark-subtext">Tidak ada playlist. Buat satu di atas!</p>
            )}
        </div>
        
        <div className="p-3 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-dark-surface font-semibold rounded-md hover:bg-dark-highlight transition-colors">Selesai</button>
        </div>
      </div>
    </div>
  );
};
