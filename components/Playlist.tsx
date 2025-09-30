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

const PlaylistItem: React.FC<{
    item: VideoItem;
    index: number;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onRemoveFromPlaylist: (trackId: string) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isPlaying: boolean;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
    playlist: VideoItem[];
}> = ({ item, index, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, isPlaying, isOffline, onAddToOffline, playlist }) => (
    <div className="grid grid-cols-[20px_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="flex items-center justify-center text-dark-subtext">
            <span className="group-hover:hidden">{index + 1}</span>
            <button onClick={() => onSelectTrack(item, playlist)} className="hidden group-hover:block" aria-label={`Putar ${item.snippet.title}`}>
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
                <p className={`text-sm font-semibold truncate cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'}`} onClick={() => onSelectTrack(item, playlist)}>
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
            <button onClick={() => onRemoveFromPlaylist(item.id.videoId)} className="p-2 w-10 rounded-full text-dark-subtext hover:text-white" title="Hapus dari playlist">
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    </div>
);


export const Playlist: React.FC<PlaylistProps> = ({ playlist, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, currentTrackId, isAutoplayEnabled, onToggleAutoplay, offlineItems, onAddToOffline }) => {
  if (playlist.length === 0) {
    return (
      <div className="text-center py-10 text-dark-subtext">
        <i className="fas fa-list-ul text-4xl mb-4"></i>
        <p>Playlist Anda kosong.</p>
        <p className="text-sm">Tambahkan lagu dari hasil pencarian untuk memulai.</p>
      </div>
    );
  }

  return (
    <div>
        <div className="flex items-center justify-end mb-4 pr-2">
            <div className="flex items-center">
                <span className="mr-3 text-sm font-medium text-dark-subtext">Putar Otomatis</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isAutoplayEnabled} onChange={onToggleAutoplay} className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-red"></div>
                </label>
            </div>
        </div>
        <div className="space-y-1">
          {playlist.map((item, index) => {
            const isOffline = offlineItems.some(o => o.id.videoId === item.id.videoId);
            return (
                <PlaylistItem 
                    key={item.id.videoId} 
                    item={item}
                    index={index}
                    onSelectTrack={onSelectTrack}
                    onRemoveFromPlaylist={onRemoveFromPlaylist}
                    onSelectChannel={onSelectChannel}
                    isPlaying={currentTrackId === item.id.videoId}
                    isOffline={isOffline}
                    onAddToOffline={onAddToOffline}
                    playlist={playlist}
                />
            )
          })}
        </div>
    </div>
  );
};