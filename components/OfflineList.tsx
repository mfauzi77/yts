import React from 'react';
import type { VideoItem } from '../types';

interface OfflineListProps {
  offlinePlaylist: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromOfflinePlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
}


const OfflineItem: React.FC<{
    item: VideoItem;
    index: number;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onRemoveFromOfflinePlaylist: (trackId: string) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isPlaying: boolean;
    offlinePlaylist: VideoItem[];
}> = ({ item, index, onSelectTrack, onRemoveFromOfflinePlaylist, onSelectChannel, isPlaying, offlinePlaylist }) => (
    <div className="grid grid-cols-[20px_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="flex items-center justify-center text-dark-subtext">
            <span className="group-hover:hidden">{index + 1}</span>
            <button onClick={() => onSelectTrack(item, offlinePlaylist)} className="hidden group-hover:block" aria-label={`Play ${item.snippet.title}`}>
                <i className="fas fa-play text-white"></i>
            </button>
        </div>
        <div className="flex items-center gap-4">
             <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-10 h-10 rounded-md object-cover"
            />
            <div className="min-w-0">
                <p className={`text-sm font-semibold truncate cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'}`} onClick={() => onSelectTrack(item, offlinePlaylist)}>
                    {item.snippet.title}
                </p>
                <p 
                    className="text-xs text-dark-subtext cursor-pointer hover:underline"
                    onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
                >
                    {item.snippet.channelTitle}
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onRemoveFromOfflinePlaylist(item.id.videoId)} className="p-2 w-10 rounded-full text-dark-subtext hover:text-white" title="Remove from Offline">
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    </div>
);


export const OfflineList: React.FC<OfflineListProps> = ({ offlinePlaylist, onSelectTrack, onRemoveFromOfflinePlaylist, onSelectChannel, currentTrackId }) => {
  if (offlinePlaylist.length === 0) {
    return (
      <div className="text-center py-10 text-dark-subtext">
        <i className="fas fa-cloud-download-alt text-4xl mb-4"></i>
        <p>You have no songs saved for offline access.</p>
        <p className="text-sm">Click the cloud icon on a song to save it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
        {offlinePlaylist.map((item, index) => (
            <OfflineItem 
                key={item.id.videoId} 
                item={item}
                index={index}
                onSelectTrack={onSelectTrack}
                onRemoveFromOfflinePlaylist={onRemoveFromOfflinePlaylist}
                onSelectChannel={onSelectChannel}
                isPlaying={currentTrackId === item.id.videoId}
                offlinePlaylist={offlinePlaylist}
            />
        ))}
    </div>
  );
};