
import React from 'react';
import type { Playlist, VideoItem } from '../types';

interface PlaylistListProps {
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (name: string) => void;
}

const PlaylistCard: React.FC<{
    playlist: Playlist;
    onSelect: () => void;
}> = ({ playlist, onSelect }) => (
    <div 
        className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
        onClick={onSelect}
    >
        {playlist.tracks.length > 0 ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                {playlist.tracks.slice(0, 4).map((track, index) => (
                    <img 
                        key={track.id.videoId + index}
                        src={track.snippet.thumbnails.medium?.url || track.snippet.thumbnails.default.url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ))}
                {/* Fill empty grid cells if less than 4 tracks */}
                {Array(Math.max(0, 4 - playlist.tracks.length)).fill(0).map((_, i) => (
                    <div key={i} className="bg-dark-card"></div>
                ))}
            </div>
        ) : (
            <div className="w-full h-full bg-dark-card flex items-center justify-center">
                <i className="fas fa-music text-5xl text-dark-surface"></i>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 md:p-4 text-white">
            <h3 className="font-bold text-lg md:text-xl [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{playlist.name}</h3>
            <p className="text-xs md:text-sm text-dark-subtext mt-1">{playlist.tracks.length} lagu</p>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-brand-red/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
            <i className="fas fa-play text-white text-2xl ml-1"></i>
        </div>
    </div>
);

const CreatePlaylistCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div 
        className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-dark-card hover:border-dark-subtext text-dark-subtext hover:text-white transition-colors duration-300 cursor-pointer"
        onClick={onClick}
    >
        <i className="fas fa-plus text-4xl"></i>
        <p className="mt-4 font-semibold">Buat Playlist Baru</p>
    </div>
);


export const PlaylistListView: React.FC<PlaylistListProps> = ({ playlists, onSelectPlaylist, onCreatePlaylist }) => {
    
    const handleCreateClick = () => {
        const name = prompt("Masukkan nama playlist baru:");
        if (name && name.trim()) {
            onCreatePlaylist(name.trim());
        }
    };
    
    if (playlists.length === 0) {
        return (
            <div className="text-center py-10">
                <CreatePlaylistCard onClick={handleCreateClick} />
                <div className="mt-8 text-dark-subtext">
                    <p>Anda belum memiliki playlist.</p>
                    <p className="text-sm">Klik di atas untuk membuat yang pertama!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <CreatePlaylistCard onClick={handleCreateClick} />
            {playlists.map(p => (
                <PlaylistCard 
                    key={p.id} 
                    playlist={p} 
                    onSelect={() => onSelectPlaylist(p)} 
                />
            ))}
        </div>
    );
};
