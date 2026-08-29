
import React from 'react';
import type { VideoItem } from '../types';

interface SearchResultListProps {
  results: VideoItem[];
  isLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  viewType: 'search' | 'recommendations';
  onGenerateDiscoveryMix?: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
  playbackProgress?: number | string;
}

const SearchResultItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
    onOpenAddToPlaylistModal: (track: VideoItem) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
    isPlaying: boolean;
    contextList: VideoItem[];
    playbackProgress?: number | string;
}> = ({ item, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, isOffline, onAddToOffline, isPlaying, contextList, playbackProgress }) => (
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
                    onClick={() => onSelectTrack(item, contextList)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    aria-label={`Putar ${item.snippet.title}`}
                >
                    <i className="fas fa-play text-white text-lg"></i>
                </button>
            )}
        </div>
        <div className="min-w-0">
            <p 
                onClick={() => onSelectTrack(item, contextList)}
                className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`}>
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
            {isPlaying && playbackProgress !== undefined && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-brand-red text-xs font-mono font-bold shadow-sm mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></span>
                    <span>{typeof playbackProgress === 'number' ? `${playbackProgress}%` : playbackProgress}</span>
                </div>
            )}
            <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onOpenAddToPlaylistModal(item)}
                    className="p-2 w-10 rounded-full text-dark-subtext hover:text-white transition-colors duration-200"
                    title="Tambahkan ke playlist"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>
        </div>
    </div>
);


export const SearchResultList: React.FC<SearchResultListProps> = ({ results, isLoading, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, viewType, offlineItems, onAddToOffline, currentTrackId, playbackProgress }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
        <div className="text-center py-10 text-dark-subtext">
            <i className={`fas ${viewType === 'search' ? 'fa-search' : 'fa-music'} text-4xl mb-4 mt-6`}></i>
            <p>{viewType === 'search' ? 'Tidak ada hasil yang ditemukan.' : 'Rekomendasi pribadi Anda akan muncul di sini.'}</p>
            <p className="text-sm">{viewType === 'search' ? 'Coba kata kunci pencarian yang lain.' : 'Dengarkan beberapa lagu untuk memulai.'}</p>
        </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map(item => (
            <SearchResultItem
                key={item.id.videoId}
                item={item}
                onSelectTrack={onSelectTrack}
                onOpenAddToPlaylistModal={onOpenAddToPlaylistModal}
                onSelectChannel={onSelectChannel}
                isOffline={offlineItems.some(o => o.id.videoId === item.id.videoId)}
                onAddToOffline={onAddToOffline}
                isPlaying={currentTrackId === item.id.videoId}
                contextList={results}
                playbackProgress={currentTrackId === item.id.videoId ? playbackProgress : undefined}
            />
        )
      )}
    </div>
  );
};
