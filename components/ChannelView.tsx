import React from 'react';
import type { VideoItem } from '../types';

interface ChannelViewProps {
  channelTitle: string;
  videos: VideoItem[];
  isLoading: boolean;
  isMoreLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onBack: () => void;
  onAddToPlaylist: (track: VideoItem) => void;
  onAddToOffline: (track: VideoItem) => void;
  playlist: VideoItem[];
  offlineItems: VideoItem[];
  currentTrackId?: string | null;
  onLoadMore: () => void;
  hasNextPage: boolean;
}

const ChannelVideoItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onAddToPlaylist: (track: VideoItem) => void;
    isInPlaylist: boolean;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
    isPlaying: boolean;
    videoList: VideoItem[];
}> = ({ item, onSelectTrack, onAddToPlaylist, isInPlaylist, isOffline, onAddToOffline, isPlaying, videoList }) => (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="relative w-12 h-12">
            <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-full h-full rounded-md object-cover"
            />
             <button
                onClick={() => onSelectTrack(item, videoList)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                aria-label={`Putar ${item.snippet.title}`}
            >
                <i className="fas fa-play text-white text-lg"></i>
            </button>
        </div>
        <div className="min-w-0">
            <p className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`} onClick={() => onSelectTrack(item, videoList)}>
                {item.snippet.title}
            </p>
             <p className="text-xs text-dark-subtext">
                {new Date(item.snippet.publishedAt).toLocaleDateString()}
            </p>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => onAddToOffline(item)}
                disabled={isOffline}
                className={`p-2 w-10 rounded-full transition-colors duration-200 ${
                    isOffline ? 'text-green-500' : 'text-dark-subtext hover:text-white'
                }`}
                title={isOffline ? "Disimpan offline" : "Simpan untuk offline"}
            >
                <i className={`fas ${isOffline ? 'fa-check-circle' : 'fa-cloud-download-alt'}`}></i>
            </button>
            <button
                onClick={() => onAddToPlaylist(item)}
                disabled={isInPlaylist}
                className={`p-2 w-10 rounded-full transition-colors duration-200 ${
                    isInPlaylist ? 'text-green-500' : 'text-dark-subtext hover:text-white'
                }`}
                title={isInPlaylist ? "Ditambahkan ke playlist" : "Tambahkan ke playlist"}
            >
                <i className={`fas ${isInPlaylist ? 'fa-check' : 'fa-plus'}`}></i>
            </button>
        </div>
    </div>
);

export const ChannelView: React.FC<ChannelViewProps> = ({ 
    channelTitle, 
    videos, 
    isLoading, 
    isMoreLoading,
    onSelectTrack, 
    onBack,
    onAddToPlaylist,
    onAddToOffline,
    playlist,
    offlineItems,
    currentTrackId,
    onLoadMore,
    hasNextPage,
}) => {
    return (
        <>
            <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-0 flex items-center">
                <button onClick={onBack} className="md:hidden p-2 mr-2 -ml-2 rounded-full hover:bg-dark-surface">
                    <i className="fas fa-arrow-left text-white"></i>
                </button>
                <h1 className="text-3xl md:text-4xl font-bold text-white truncate">
                    {channelTitle}
                </h1>
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
                </div>
            ) : (
                <div className="mt-4 space-y-2">
                   {videos.map(item => (
                       <ChannelVideoItem
                            key={item.id.videoId}
                            item={item}
                            onSelectTrack={onSelectTrack}
                            onAddToPlaylist={onAddToPlaylist}
                            isInPlaylist={playlist.some(p => p.id.videoId === item.id.videoId)}
                            isOffline={offlineItems.some(o => o.id.videoId === item.id.videoId)}
                            onAddToOffline={onAddToOffline}
                            isPlaying={currentTrackId === item.id.videoId}
                            videoList={videos}
                       />
                   ))}
                   
                   {hasNextPage && (
                       <div className="flex justify-center py-6">
                           <button
                               onClick={onLoadMore}
                               disabled={isMoreLoading}
                               className="px-6 py-2 bg-dark-card text-white font-semibold rounded-full hover:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                           >
                               {isMoreLoading ? (
                                   <>
                                       <i className="fas fa-spinner fa-spin mr-2"></i>
                                       Memuat...
                                   </>
                               ) : (
                                   'Muat Lebih Banyak'
                               )}
                           </button>
                       </div>
                   )}
                </div>
            )}
        </>
    );
};