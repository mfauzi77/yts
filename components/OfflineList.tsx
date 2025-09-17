import React from 'react';
import type { VideoItem } from '../types';

interface OfflineListProps {
  offlinePlaylist: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromOfflinePlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
}

export const OfflineList: React.FC<OfflineListProps> = ({ offlinePlaylist, onSelectTrack, onRemoveFromOfflinePlaylist, onSelectChannel, currentTrackId }) => {
  if (offlinePlaylist.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-dark-subtext">
        <i className="fas fa-cloud-download-alt text-4xl mb-4"></i>
        <p>You have no songs saved for offline access.</p>
        <p className="text-sm">Click the cloud icon on a song to save it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offlinePlaylist.map(item => (
        <div 
            key={item.id.videoId} 
            className={`flex items-center p-3 space-x-4 rounded-lg shadow-sm transition-colors duration-200 ${currentTrackId === item.id.videoId ? 'bg-red-50 dark:bg-brand-red/10' : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
        >
          <img
            src={item.snippet.thumbnails.default.url}
            alt={item.snippet.title}
            className="w-12 h-12 rounded-md object-cover cursor-pointer"
            onClick={() => onSelectTrack(item, offlinePlaylist)}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate cursor-pointer ${currentTrackId === item.id.videoId ? 'text-brand-red' : 'text-gray-900 dark:text-white'}`} onClick={() => onSelectTrack(item, offlinePlaylist)}>
              {item.snippet.title}
            </p>
            <p 
                className="text-xs text-gray-500 dark:text-dark-subtext cursor-pointer hover:underline"
                onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
            >
                {item.snippet.channelTitle}
            </p>
          </div>
          <button onClick={() => onRemoveFromOfflinePlaylist(item.id.videoId)} className="p-2 w-10 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 transition-colors duration-200" title="Remove from Offline">
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      ))}
    </div>
  );
};