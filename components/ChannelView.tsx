
import React, { useState } from 'react';
import type { VideoItem, YouTubePlaylist } from '../types';
import { DownloadButton } from './DownloadButton';
import type { TrackDownloadState } from '../hooks/useDownloadManager';

interface ChannelViewProps {
  channelTitle: string;
  videos: VideoItem[];
  playlists: YouTubePlaylist[];
  isLoading: boolean;
  isMoreLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onSelectPlaylist: (playlist: YouTubePlaylist) => void;
  onBack: () => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onAddToOffline: (track: VideoItem) => void;
  offlineItems: VideoItem[];
  currentTrackId?: string | null;
  onLoadMore: () => void;
  hasNextPage: boolean;
  getDownloadState: (videoId: string) => TrackDownloadState;
  onDownloadTrack: (track: VideoItem) => void;
  onDeleteDownload: (videoId: string) => void;
}

const ChannelVideoItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onOpenAddToPlaylistModal: (track: VideoItem) => void;
    isPlaying: boolean;
    videoList: VideoItem[];
    downloadState: TrackDownloadState;
    onDownload: () => void;
    onDeleteDownload: () => void;
}> = ({ item, onSelectTrack, onOpenAddToPlaylistModal, isPlaying, videoList, downloadState, onDownload, onDeleteDownload }) => (
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
            <DownloadButton
                state={downloadState}
                onDownload={onDownload}
                onDelete={onDeleteDownload}
            />
            <button
                onClick={() => onOpenAddToPlaylistModal(item)}
                className="p-2 w-8 h-8 flex items-center justify-center rounded-full text-dark-subtext hover:text-white transition-colors duration-200"
                title="Tambahkan ke playlist"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
    </div>
);

const ChannelPlaylistItem: React.FC<{
    playlist: YouTubePlaylist;
    onSelectPlaylist: (playlist: YouTubePlaylist) => void;
}> = ({ playlist, onSelectPlaylist }) => (
    <div 
        onClick={() => onSelectPlaylist(playlist)}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group cursor-pointer"
    >
        <div className="relative w-12 h-12">
            <img
                src={playlist.snippet.thumbnails.default.url}
                alt={playlist.snippet.title}
                className="w-full h-full rounded-md object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                <i className="fas fa-list text-white text-xs"></i>
            </div>
        </div>
        <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
                {playlist.snippet.title}
            </p>
            <p className="text-xs text-dark-subtext">
                {playlist.contentDetails.itemCount} lagu
            </p>
        </div>
        <div className="text-dark-subtext">
            <i className="fas fa-chevron-right"></i>
        </div>
    </div>
);

export const ChannelView: React.FC<ChannelViewProps> = ({ 
    channelTitle, 
    videos, 
    playlists,
    isLoading, 
    isMoreLoading,
    onSelectTrack, 
    onSelectPlaylist,
    onBack,
    onOpenAddToPlaylistModal,
    onAddToOffline,
    offlineItems,
    currentTrackId,
    onLoadMore,
    hasNextPage,
    getDownloadState,
    onDownloadTrack,
    onDeleteDownload,
}) => {
    const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');

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

            <div className="flex border-b border-dark-card mb-4">
                <button 
                    onClick={() => setActiveTab('videos')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'videos' ? 'text-brand-red border-b-2 border-brand-red' : 'text-dark-subtext hover:text-white'}`}
                >
                    Video
                </button>
                <button 
                    onClick={() => setActiveTab('playlists')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'playlists' ? 'text-brand-red border-b-2 border-brand-red' : 'text-dark-subtext hover:text-white'}`}
                >
                    Playlist
                </button>
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
                </div>
            ) : (
                <div className="mt-4 space-y-2">
                   {activeTab === 'videos' ? (
                       <>
                           {videos.map(item => (
                               <ChannelVideoItem
                                    key={item.id.videoId}
                                    item={item}
                                    onSelectTrack={onSelectTrack}
                                    onOpenAddToPlaylistModal={onOpenAddToPlaylistModal}
                                    isPlaying={currentTrackId === item.id.videoId}
                                    videoList={videos}
                                    downloadState={getDownloadState(item.id.videoId)}
                                    onDownload={() => onDownloadTrack(item)}
                                    onDeleteDownload={() => onDeleteDownload(item.id.videoId)}
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
                       </>
                   ) : (
                       <>
                           {playlists.length > 0 ? (
                               playlists.map(playlist => (
                                   <ChannelPlaylistItem 
                                        key={playlist.id}
                                        playlist={playlist}
                                        onSelectPlaylist={onSelectPlaylist}
                                   />
                               ))
                           ) : (
                               <div className="text-center py-10 text-dark-subtext">
                                   <i className="fas fa-list-ul text-4xl mb-4"></i>
                                   <p>Channel ini tidak memiliki playlist publik.</p>
                               </div>
                           )}
                       </>
                   )}
                </div>
            )}
        </>
    );
};
