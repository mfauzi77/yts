
import React from 'react';
import type { VideoItem } from '../types';

interface PlaylistProps {
  playlist: VideoItem[];
  onSelectTrack: (track: VideoItem) => void;
  onRemoveFromPlaylist: (trackId: string) => void;
  currentTrackId?: string | null;
}

export const Playlist: React.FC<PlaylistProps> = ({ playlist, onSelectTrack, onRemoveFromPlaylist, currentTrackId }) => {
  if (playlist.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-dark-subtext">
        <i className="fas fa-list-ul text-4xl mb-4"></i>
        <p>Your playlist is empty.</p>
        <p className="text-sm">Add songs from search results to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {playlist.map(item => (
        <div 
            key={item.id.videoId} 
            className={`flex items-center p-3 space-x-4 rounded-lg shadow-sm transition-colors duration-200 ${currentTrackId === item.id.videoId ? 'bg-red-50 dark:bg-brand-red/10' : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
        >
          <img
            src={item.snippet.thumbnails.default.url}
            alt={item.snippet.title}
            className="w-12 h-12 rounded-md object-cover cursor-pointer"
            onClick={() => onSelectTrack(item)}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate cursor-pointer ${currentTrackId === item.id.videoId ? 'text-brand-red' : 'text-gray-900 dark:text-white'}`} onClick={() => onSelectTrack(item)}>
              {item.snippet.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-subtext">{item.snippet.channelTitle}</p>
          </div>
          <button onClick={() => onRemoveFromPlaylist(item.id.videoId)} className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 transition-colors duration-200">
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      ))}
    </div>
  );
};
