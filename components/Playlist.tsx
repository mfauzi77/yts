import React from 'react';
import type { Playlist } from '../types';
import { Plus, ListMusic, Play, Disc3 } from 'lucide-react';

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
    onClick={onSelect}
    className="group relative flex flex-col p-3 rounded-2xl bg-dark-card/60 hover:bg-dark-elevated/90 border border-white/5 hover:border-white/15 transition-all duration-300 shadow-card hover:shadow-card-hover cursor-pointer"
  >
    {/* Artwork Container: 4-Grid Mosaic or Placeholder */}
    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-dark-surface mb-3 shadow-md">
      {playlist.tracks.length > 0 ? (
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {playlist.tracks.slice(0, 4).map((track, idx) => (
            <img
              key={track.id.videoId + idx}
              src={
                track.snippet.thumbnailData ||
                track.snippet.thumbnails.medium?.url ||
                track.snippet.thumbnails.default.url
              }
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ))}
          {/* Fill empty grid cells */}
          {Array(Math.max(0, 4 - playlist.tracks.length))
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-dark-elevated/60" />
            ))}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-dark-card">
          <ListMusic className="w-12 h-12 text-dark-muted" />
        </div>
      )}

      {/* Dark Ambient Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Floating Play Button on Hover */}
      <div className="absolute right-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-glow hover:scale-110 active:scale-95 transition-transform"
          aria-label={`Buka playlist ${playlist.name}`}
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* Track count badge */}
      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white shadow-sm">
        {playlist.tracks.length} lagu
      </div>
    </div>

    {/* Title & Info */}
    <div className="flex flex-col flex-1 min-w-0">
      <h3
        className="text-sm font-bold text-white group-hover:text-white line-clamp-1 leading-snug mb-0.5"
        title={playlist.name}
      >
        {playlist.name}
      </h3>
      <p className="text-xs text-dark-subtext">Koleksi Pribadi</p>
    </div>
  </div>
);

const CreatePlaylistCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="group flex flex-col items-center justify-center p-6 aspect-square rounded-2xl border-2 border-dashed border-dark-border hover:border-brand/60 bg-dark-card/30 hover:bg-dark-elevated/40 text-dark-subtext hover:text-white transition-all duration-300 cursor-pointer text-center"
  >
    <div className="w-12 h-12 rounded-full bg-dark-surface group-hover:bg-brand group-hover:text-white text-dark-subtext flex items-center justify-center mb-3 transition-all duration-300 shadow-md group-hover:scale-110">
      <Plus className="w-6 h-6" />
    </div>
    <p className="font-bold text-sm text-white">Buat Playlist Baru</p>
    <p className="text-xs text-dark-muted mt-1">Koleksi lagu kustom Anda</p>
  </div>
);

export const PlaylistListView: React.FC<PlaylistListProps> = ({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
}) => {
  const handleCreateClick = () => {
    const name = prompt('Masukkan nama playlist baru:');
    if (name && name.trim()) {
      onCreatePlaylist(name.trim());
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Koleksi Playlist
          </h1>
          <p className="text-xs md:text-sm text-dark-subtext mt-0.5">
            Daftar putar musik pribadi Anda
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-bold rounded-full text-xs md:text-sm shadow-glow hover:bg-brand-hover active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
        <CreatePlaylistCard onClick={handleCreateClick} />
        {playlists.map((p) => (
          <PlaylistCard key={p.id} playlist={p} onSelect={() => onSelectPlaylist(p)} />
        ))}
      </div>
    </div>
  );
};
