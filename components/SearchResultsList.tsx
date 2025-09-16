
import React from 'react';
import type { VideoItem } from '../types';

interface SearchResultListProps {
  results: VideoItem[];
  isLoading: boolean;
  onSelectTrack: (track: VideoItem) => void;
  onAddToPlaylist: (track: VideoItem) => void;
  playlist: VideoItem[];
}

const SearchResultItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem) => void;
    onAddToPlaylist: (track: VideoItem) => void;
    isInPlaylist: boolean;
}> = ({ item, onSelectTrack, onAddToPlaylist, isInPlaylist }) => (
    <div className="flex items-center p-3 space-x-4 bg-white dark:bg-dark-card rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-200">
        <img
            src={item.snippet.thumbnails.default.url}
            alt={item.snippet.title}
            className="w-16 h-16 rounded-md object-cover cursor-pointer"
            onClick={() => onSelectTrack(item)}
        />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white cursor-pointer" onClick={() => onSelectTrack(item)}>
                {item.snippet.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-subtext">{item.snippet.channelTitle}</p>
        </div>
        <div className="flex-shrink-0">
            <button
                onClick={() => onAddToPlaylist(item)}
                disabled={isInPlaylist}
                className={`p-2 rounded-full transition-colors duration-200 ${
                    isInPlaylist
                        ? 'text-green-500 cursor-not-allowed'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-brand-red'
                }`}
                title={isInPlaylist ? "Added to playlist" : "Add to playlist"}
            >
                <i className={`fas ${isInPlaylist ? 'fa-check' : 'fa-plus'}`}></i>
            </button>
        </div>
    </div>
);


export const SearchResultList: React.FC<SearchResultListProps> = ({ results, isLoading, onSelectTrack, onAddToPlaylist, playlist }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
        <div className="text-center py-10 text-gray-500 dark:text-dark-subtext">
            <i className="fas fa-music text-4xl mb-4"></i>
            <p>Your search results will appear here.</p>
            <p className="text-sm">Start by typing in the search bar above.</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map(item => {
        const isInPlaylist = playlist.some(pItem => pItem.id.videoId === item.id.videoId);
        return (
            <SearchResultItem
                key={item.id.videoId}
                item={item}
                onSelectTrack={onSelectTrack}
                onAddToPlaylist={onAddToPlaylist}
                isInPlaylist={isInPlaylist}
            />
        );
      })}
    </div>
  );
};
