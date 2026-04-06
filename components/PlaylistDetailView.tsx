
import React, { useState, useEffect, useRef } from 'react';
import { DownloadButton } from './DownloadButton';
import type { TrackDownloadState } from '../hooks/useDownloadManager';
import type { VideoItem, Playlist } from '../types';
import { encodePlaylistToUrl } from '../services/sharePlaylist';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromPlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  onBack: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  isYouTubePlaylist?: boolean;
  getDownloadState: (videoId: string) => TrackDownloadState;
  onDownloadTrack: (track: VideoItem) => void;
  onDeleteDownload: (videoId: string) => void;
}

const PlaylistItem: React.FC<{
    item: VideoItem;
    index: number;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onRemoveFromPlaylist: (trackId: string) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isPlaying: boolean;
    playlistTracks: VideoItem[];
    isYouTubePlaylist?: boolean;
    downloadState: TrackDownloadState;
    onDownload: () => void;
    onDeleteDownload: () => void;
}> = ({ item, index, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, isPlaying, playlistTracks, isYouTubePlaylist, downloadState, onDownload, onDeleteDownload }) => (
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
            <DownloadButton
                state={downloadState}
                onDownload={onDownload}
                onDelete={onDeleteDownload}
            />
            {!isYouTubePlaylist && (
                <button onClick={() => onRemoveFromPlaylist(item.id.videoId)} className="p-2 w-10 rounded-full text-dark-subtext hover:text-white" title="Hapus dari playlist">
                    <i className="fas fa-trash-alt"></i>
                </button>
            )}
        </div>
    </div>
);

const PlaylistHeader: React.FC<{
    playlist: Playlist;
    onBack: () => void;
    onDelete: () => void;
    onRename: (newName: string) => void;
    isYouTubePlaylist?: boolean;
}> = ({ playlist, onBack, onDelete, onRename, isYouTubePlaylist }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(playlist.name);
    const [shareToast, setShareToast] = useState<'idle' | 'copied' | 'error'>('idle');
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

    const handleShare = async () => {
        if (playlist.tracks.length === 0) return;
        const url = encodePlaylistToUrl(playlist);
        try {
            await navigator.clipboard.writeText(url);
            setShareToast('copied');
        } catch {
            // Fallback: buka prompt agar user bisa copy manual
            prompt('Salin link share di bawah ini:', url);
            setShareToast('copied');
        }
        setTimeout(() => setShareToast('idle'), 2500);
    };
    
    return (
        <div className="flex-shrink-0 pt-6 pb-4 px-2 md:px-0 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
                <button onClick={onBack} className="p-2 mr-2 -ml-2 rounded-full hover:bg-dark-surface flex-shrink-0">
                    <i className="fas fa-arrow-left text-white"></i>
                </button>
                {isEditing && !isYouTubePlaylist ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        className="text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-brand-red outline-none min-w-0"
                    />
                ) : (
                    <h1 
                        className={`text-3xl md:text-4xl font-bold text-white truncate ${!isYouTubePlaylist ? 'cursor-pointer' : ''}`} 
                        onClick={() => !isYouTubePlaylist && setIsEditing(true)}
                    >
                        {playlist.name}
                    </h1>
                )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Share button — hanya untuk playlist lokal yg ada isinya */}
                {!isYouTubePlaylist && playlist.tracks.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full text-dark-subtext hover:text-white hover:bg-dark-surface transition-colors"
                            title="Bagikan playlist"
                        >
                            <i className={`fas ${shareToast === 'copied' ? 'fa-check text-green-400' : 'fa-share-alt'}`}></i>
                        </button>
                        {shareToast === 'copied' && (
                            <div className="absolute right-0 top-full mt-1 z-50 whitespace-nowrap bg-dark-card border border-white/10 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
                                Link disalin!
                            </div>
                        )}
                    </div>
                )}
                {!isYouTubePlaylist && (
                    <button onClick={onDelete} className="p-2 rounded-full text-dark-subtext hover:text-brand-red hover:bg-dark-surface transition-colors" title="Hapus playlist">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                )}
            </div>
        </div>
    );
};


export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({ playlist, onSelectTrack, onRemoveFromPlaylist, onSelectChannel, currentTrackId, isAutoplayEnabled, onToggleAutoplay, isShuffle, onToggleShuffle, offlineItems, onAddToOffline, onBack, onDelete, onRename, isYouTubePlaylist, getDownloadState, onDownloadTrack, onDeleteDownload }) => {
  if (!playlist) return null;

  if (playlist.tracks.length === 0) {
    return (
      <>
        <PlaylistHeader playlist={playlist} onBack={onBack} onDelete={onDelete} onRename={onRename} isYouTubePlaylist={isYouTubePlaylist} />
        <div className="text-center py-10 text-dark-subtext">
            <i className="fas fa-list-ul text-4xl mb-4"></i>
            <p>Playlist ini kosong.</p>
            {!isYouTubePlaylist && <p className="text-sm">Tambahkan lagu dari hasil pencarian untuk memulai.</p>}
        </div>
      </>
    );
  }

  return (
    <div>
        <PlaylistHeader playlist={playlist} onBack={onBack} onDelete={onDelete} onRename={onRename} isYouTubePlaylist={isYouTubePlaylist} />
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 mb-6 pr-2">

            <div className="flex items-center">
                <span className="mr-3 text-sm font-medium text-dark-subtext">Acak</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isShuffle} onChange={onToggleShuffle} className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-red"></div>
                </label>
            </div>
            <div className="flex items-center">
                <span className="mr-3 text-sm font-medium text-dark-subtext">Putar Otomatis</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isAutoplayEnabled} onChange={onToggleAutoplay} className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-red"></div>
                </label>
            </div>
        </div>

        <div className="space-y-1">
          {playlist.tracks.map((item, index) => (
                <PlaylistItem 
                    key={item.id.videoId} 
                    item={item}
                    index={index}
                    onSelectTrack={onSelectTrack}
                    onRemoveFromPlaylist={onRemoveFromPlaylist}
                    onSelectChannel={onSelectChannel}
                    isPlaying={currentTrackId === item.id.videoId}
                    playlistTracks={playlist.tracks}
                    isYouTubePlaylist={isYouTubePlaylist}
                    downloadState={getDownloadState(item.id.videoId)}
                    onDownload={() => onDownloadTrack(item)}
                    onDeleteDownload={() => onDeleteDownload(item.id.videoId)}
                />
                ))
          }
        </div>
    </div>
  );
};
