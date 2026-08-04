
import React from 'react';
import type { VideoItem } from '../types';

interface HistoryListProps {
  history: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
  playbackProgress?: number;
}

const HistoryItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onOpenAddToPlaylistModal: (track: VideoItem) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
    isPlaying: boolean;
    history: VideoItem[];
    playbackProgress?: number;
}> = ({ item, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, isOffline, onAddToOffline, isPlaying, history, playbackProgress }) => (
    <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group ${isPlaying ? 'bg-dark-highlight/50' : ''}`}>
        <div className="relative w-12 h-12">
            <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-full h-full rounded-md object-cover"
            />
            {isPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                    <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                    </span>
                </div>
            ) : (
                <button
                    onClick={() => onSelectTrack(item, history)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    aria-label={`Putar ${item.snippet.title}`}
                >
                    <i className="fas fa-play text-white text-lg"></i>
                </button>
            )}
        </div>
        <div className="min-w-0">
            <p className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`} onClick={() => onSelectTrack(item, history)}>
                {item.snippet.title}
            </p>
            <p 
                className="text-xs text-dark-subtext cursor-pointer hover:underline"
                onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
            >
                {item.snippet.channelTitle}
            </p>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
            {isPlaying && typeof playbackProgress === 'number' && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-brand-red text-xs font-mono font-bold shadow-sm mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></span>
                    <span>{playbackProgress}%</span>
                </div>
            )}
            <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onOpenAddToPlaylistModal(item)}
                    className={`p-2 w-10 rounded-full text-dark-subtext hover:text-white transition-colors duration-200`}
                    title="Tambahkan ke playlist"
                >
                    <i className={`fas fa-plus`}></i>
                </button>
            </div>
        </div>
    </div>
);

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, offlineItems, onAddToOffline, currentTrackId, playbackProgress }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-dark-subtext">
        <i className="fas fa-history text-4xl mb-4"></i>
        <p>Riwayat mendengarkan Anda kosong.</p>
        <p className="text-sm">Lagu yang Anda putar akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {history.map((item) => {
        const isOffline = offlineItems.some(o => o.id.videoId === item.id.videoId);
        return (
            <HistoryItem 
                key={item.id.videoId} 
                item={item}
                onSelectTrack={onSelectTrack}
                onOpenAddToPlaylistModal={onOpenAddToPlaylistModal}
                onSelectChannel={onSelectChannel}
                isPlaying={currentTrackId === item.id.videoId}
                isOffline={isOffline}
                onAddToOffline={onAddToOffline}
                history={history}
                playbackProgress={currentTrackId === item.id.videoId ? playbackProgress : undefined}
            />
        );
      })}
    </div>
  );
};
