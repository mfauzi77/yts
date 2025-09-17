import React from 'react';
import type { VideoItem } from '../types';

interface ChannelViewProps {
  channelTitle: string;
  videos: VideoItem[];
  isLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
  onAddToPlaylist: (track: VideoItem) => void;
  onBack: () => void;
  playlist: VideoItem[];
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
}

const ChannelVideoItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
    onAddToPlaylist: (track: VideoItem) => void;
    isInPlaylist: boolean;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
}> = ({ item, onSelectTrack, onAddToPlaylist, isInPlaylist, isOffline, onAddToOffline }) => (
    <div className="flex items-center p-3 space-x-4 bg-white dark:bg-dark-card rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-200">
        <img
            src={item.snippet.thumbnails.default.url}
            alt={item.snippet.title}
            className="w-16 h-16 rounded-md object-cover cursor-pointer"
            onClick={() => onSelectTrack(item, [])}
        />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white cursor-pointer" onClick={() => onSelectTrack(item, [])}>
                {item.snippet.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-subtext">{new Date(item.snippet.publishedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
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
            <button
                onClick={() => onAddToPlaylist(item)}
                disabled={isInPlaylist}
                className={`p-2 w-10 rounded-full transition-colors duration-200 ${
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

const ChannelVideoItemSkeleton: React.FC = () => (
    <div className="flex items-center p-3 space-x-4 bg-white dark:bg-dark-card rounded-lg shadow-sm">
        <div className="w-16 h-16 rounded-md bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <div className="flex-1 min-w-0 space-y-2 py-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        </div>
    </div>
);

export const ChannelView: React.FC<ChannelViewProps> = ({ channelTitle, videos, isLoading, onSelectTrack, onAddToPlaylist, onBack, playlist, offlineItems, onAddToOffline }) => {
    
    return (
        <div>
            <div className="flex items-center mb-4">
                <button 
                    onClick={onBack} 
                    className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors"
                    aria-label="Back to main view"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{channelTitle}</h2>
            </div>
            
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <ChannelVideoItemSkeleton key={index} />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {videos.map(item => {
                        const isInPlaylist = playlist.some(pItem => pItem.id.videoId === item.id.videoId);
                        const isOffline = offlineItems.some(oItem => oItem.id.videoId === item.id.videoId);
                        return (
                            <ChannelVideoItem
                                key={item.id.videoId}
                                item={item}
                                onSelectTrack={onSelectTrack}
                                onAddToPlaylist={onAddToPlaylist}
                                isInPlaylist={isInPlaylist}
                                isOffline={isOffline}
                                onAddToOffline={onAddToOffline}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
};