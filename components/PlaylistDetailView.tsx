
import React, { useState, useEffect, useRef } from 'react';
import type { VideoItem, Playlist } from '../types';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromPlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  onBack: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
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
    playlistTracks: VideoItem[];
}> = ({ item, index, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, isPlaying, isOffline, onAddToOffline, playlistTracks }) => (
    <div className="grid grid-cols-[20px_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="flex items-center justify-center text-dark-subtext">
            <span className="group-hover:hidden">{index + 1}</span>
            <button onClick={() => onSelectTrack(item, playlistTracks)} className="hidden group-hover:block" aria-label={`Putar ${item.snippet.title}`}>
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
                <p className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`} onClick={() => onSelectTrack(item, playlistTracks)}>
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

const PlaylistHeader: React.FC<{
    playlist: Playlist;
    onBack: () => void;
    onDelete: () => void;
    onRename: (newName: string) => void;
}> = ({ playlist, onBack, onDelete, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(playlist.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(playlist.name);
    }, [playlist.name]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleRename = () => {
        if (title.trim() && title.trim() !== playlist.name) {
            onRename(title.trim());
        } else {
            setTitle(playlist.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') {
            setTitle(playlist.name);
            setIsEditing(false);
        }
    };
    
    return (
        <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="p-2 mr-2 -ml-2 rounded-full hover:bg-dark-surface">
                    <i className="fas fa-arrow-left text-white"></i>
                </button>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        className="text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-brand-red outline-none"
                    />
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-white truncate cursor-pointer" onClick={() => setIsEditing(true)}>
                        {playlist.name}
                    </h1>
                )}
            </div>
            <button onClick={onDelete} className="p-2 rounded-full text-dark-subtext hover:text-brand-red hover:bg-dark-surface" title="Hapus playlist">
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    );
};


export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({ playlist, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, currentTrackId, isAutoplayEnabled, onToggleAutoplay, offlineItems, onAddToOffline, onBack, onDelete, onRename }) => {
  if (!playlist) return null;

  if (playlist.tracks.length === 0) {
    return (
      <>
        <PlaylistHeader playlist={playlist} onBack={onBack} onDelete={onDelete} onRename={onRename} />
        <div className="text-center py-10 text-dark-subtext">
            <i className="fas fa-list-ul text-4xl mb-4"></i>
            <p>Playlist ini kosong.</p>
            <p className="text-sm">Tambahkan lagu dari hasil pencarian untuk memulai.</p>
        </div>
      </>
    );
  }

  return (
    <div>
        <PlaylistHeader playlist={playlist} onBack={onBack} onDelete={onDelete} onRename={onRename} />
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
          {playlist.tracks.map((item, index) => {
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
                    playlistTracks={playlist.tracks}
                />
            )
          })}
        </div>
    </div>
  );
};
