import React from 'react';
import type { Playlist } from '../types';

interface SharedPlaylistModalProps {
    playlist: Playlist;
    onListen: (playlist: Playlist) => void;
    onAddToMyPlaylist: (playlist: Playlist) => void;
    onDismiss: () => void;
}

export const SharedPlaylistModal: React.FC<SharedPlaylistModalProps> = ({
    playlist,
    onListen,
    onAddToMyPlaylist,
    onDismiss,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-dark-card border border-neutral-700 rounded-xl p-6 max-w-md w-full text-white space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-share-alt text-brand-red"></i> Playlist Bagian
                    </h2>
                    <button onClick={onDismiss} className="text-gray-400 hover:text-white">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                    <p className="text-sm text-gray-400">{playlist.tracks.length} lagu</p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {playlist.tracks.map((track, idx) => (
                        <div key={track.id.videoId || idx} className="flex items-center gap-3 p-2 rounded bg-dark-surface">
                            <img src={track.snippet.thumbnails.default.url} alt="" className="w-10 h-10 object-cover rounded" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{track.snippet.title}</p>
                                <p className="text-xs text-gray-400 truncate">{track.snippet.channelTitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => onListen(playlist)}
                        className="flex-1 py-2 px-4 bg-brand-red hover:bg-red-700 font-semibold rounded-lg text-sm text-white transition-colors"
                    >
                        Dengarkan
                    </button>
                    <button
                        onClick={() => onAddToMyPlaylist(playlist)}
                        className="flex-1 py-2 px-4 bg-dark-surface hover:bg-neutral-700 font-semibold rounded-lg text-sm text-white transition-colors border border-neutral-600"
                    >
                        Simpan ke Playlist Saya
                    </button>
                </div>
            </div>
        </div>
    );
};
