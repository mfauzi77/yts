
import React from 'react';
import type { VideoItem } from '../types';

interface HistoryListProps {
  history: VideoItem[];
  onSelectTrack: (track: VideoItem) => void;
  onAddToPlaylist: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectTrack, onAddToPlaylist, onSelectChannel }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-dark-subtext">
        <i className="fas fa-history text-4xl mb-4"></i>
        <p>Your listening history is empty.</p>
        <p className="text-sm">Played songs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map(item => (
        <div key={item.id.videoId + item.snippet.publishedAt} className="flex items-center p-3 space-x-4 bg-white dark:bg-dark-card rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-200">
          <img
            src={item.snippet.thumbnails.default.url}
            alt={item.snippet.title}
            className="w-12 h-12 rounded-md object-cover cursor-pointer"
            onClick={() => onSelectTrack(item)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white cursor-pointer" onClick={() => onSelectTrack(item)}>
              {item.snippet.title}
            </p>
            <p 
                className="text-xs text-gray-500 dark:text-dark-subtext cursor-pointer hover:underline"
                onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
            >
                {item.snippet.channelTitle}
            </p>
          </div>
          <button onClick={() => onAddToPlaylist(item)} className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-brand-red transition-colors duration-200" title="Add to playlist">
            <i className="fas fa-plus"></i>
          </button>
        </div>
      ))}
    </div>
  );
};
