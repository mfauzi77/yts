import React from 'react';
import type { VideoItem } from '../types';

interface PlaylistProps {
  playlist: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromPlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ playlist, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, currentTrackId, isAutoplayEnabled, onToggleAutoplay, offlineItems, onAddToOffline }) => {
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
    <div>
        <div className="flex items-center justify-end mb-4 pr-2">
            <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">Autoplay</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isAutoplayEnabled} onChange={onToggleAutoplay} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-red"></div>
            </label>
        </div>
        <div className="space-y-3">
          {playlist.map(item => {
            const isOffline = offlineItems.some(oItem => oItem.id.videoId === item.id.videoId);
            return (
                <div 
                    key={item.id.videoId} 
                    className={`flex items-center p-3 space-x-4 rounded-lg shadow-sm transition-colors duration-200 ${currentTrackId === item.id.videoId ? 'bg-red-50 dark:bg-brand-red/10' : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
                >
                  <img
                    src={item.snippet.thumbnails.default.url}
                    alt={item.snippet.title}
                    className="w-12 h-12 rounded-md object-cover cursor-pointer"
                    onClick={() => onSelectTrack(item, playlist)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate cursor-pointer ${currentTrackId === item.id.videoId ? 'text-brand-red' : 'text-gray-900 dark:text-white'}`} onClick={() => onSelectTrack(item, playlist)}>
                      {item.snippet.title}
                    </p>
                    <p 
                        className="text-xs text-gray-500 dark:text-dark-subtext cursor-pointer hover:underline"
                        onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
                    >
                        {item.snippet.channelTitle}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                      <button
                          onClick={() => onAddToOffline(item)}
                          disabled={isOffline}
                          className={`p-2 w-10 rounded-full transition-colors duration-200 ${
                              isOffline
                                  ? 'text-green-500 cursor-not-allowed'
                                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-brand-red'
                          }`}
                          title={isOffline ? "Saved for offline" : "Save for offline"}
                      >
                          <i className={`fas ${isOffline ? 'fa-check-circle' : 'fa-cloud-download-alt'}`}></i>
                      </button>
                      <button onClick={() => onRemoveFromPlaylist(item.id.videoId)} className="p-2 w-10 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-500 transition-colors duration-200" title="Remove from playlist">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                  </div>
                </div>
            )
          })}
        </div>
    </div>
  );
};