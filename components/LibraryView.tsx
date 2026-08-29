import React, { useState } from 'react';
import type { Playlist, VideoItem } from '../types';
import {
  Plus,
  Heart,
  Download,
  History,
  ListMusic,
  Play,
} from 'lucide-react';

interface LibraryViewProps {
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: () => void;
  likedTracks: VideoItem[];
  onSelectLikedSongs: () => void;
  offlineTracks: VideoItem[];
  onSelectOffline: () => void;
  historyTracks: VideoItem[];
  onSelectHistory: () => void;
  onImportYouTube?: () => void;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
  likedTracks,
  onSelectLikedSongs,
  offlineTracks,
  onSelectOffline,
  historyTracks,
  onSelectHistory,
  onImportYouTube: _onImportYouTube,
  onSelectTrack: _onSelectTrack,
}) => {
  const [filter, setFilter] = useState<'all' | 'playlists' | 'liked' | 'offline' | 'history'>('all');

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Library Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Koleksi Kamu
          </h1>
          <p className="text-xs md:text-sm text-[#9ca3af] mt-0.5">
            Kelola playlist, lagu favorit, dan koleksi offline Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreatePlaylist}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs md:text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Playlist</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-white text-black'
              : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('playlists')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'playlists'
              ? 'bg-white text-black'
              : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => setFilter('liked')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'liked'
              ? 'bg-white text-black'
              : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
          }`}
        >
          Disukai ({likedTracks.length})
        </button>
        <button
          onClick={() => setFilter('offline')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'offline'
              ? 'bg-white text-black'
              : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
          }`}
        >
          Offline ({offlineTracks.length})
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'history'
              ? 'bg-white text-black'
              : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
          }`}
        >
          Riwayat
        </button>
      </div>

      {/* Grid of Special Collections & Playlists */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Liked Songs Big Card */}
        {(filter === 'all' || filter === 'liked') && (
          <div
            onClick={onSelectLikedSongs}
            className="group relative p-4 rounded-xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>

            <div>
              <h3 className="text-base md:text-lg font-black text-white">Lagu yang Disukai</h3>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                {likedTracks.length} lagu favorit
              </p>
            </div>

            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Offline Songs Card */}
        {(filter === 'all' || filter === 'offline') && (
          <div
            onClick={onSelectOffline}
            className="group relative p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Download className="w-5 h-5 text-white" />
            </div>

            <div>
              <h3 className="text-base md:text-lg font-black text-white">Koleksi Offline</h3>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                {offlineTracks.length} lagu terunduh
              </p>
            </div>

            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* History Card */}
        {(filter === 'all' || filter === 'history') && (
          <div
            onClick={onSelectHistory}
            className="group relative p-4 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#282828] cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <History className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-base md:text-lg font-black text-white">Riwayat Putar</h3>
              <p className="text-xs text-[#9ca3af] font-medium mt-0.5">
                {historyTracks.length} lagu terakhir
              </p>
            </div>

            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(filter === 'all' || filter === 'playlists') &&
          playlists.map((pl) => {
            const firstTrack = pl.tracks[0];
            const coverUrl =
              firstTrack?.snippet.thumbnailData ||
              firstTrack?.snippet.thumbnails.medium?.url ||
              firstTrack?.snippet.thumbnails.default.url;

            return (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group relative flex flex-col p-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-transparent hover:border-[#282828] transition-all cursor-pointer shadow-sm"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-3 flex items-center justify-center">
                  {coverUrl ? (
                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-10 h-10 text-[#6b7280]" />
                  )}

                  <div className="absolute right-2 bottom-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
                      <Play className="w-4 h-4 fill-current text-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white truncate" title={pl.name}>
                  {pl.name}
                </h4>
                <p className="text-xs text-[#9ca3af] truncate mt-0.5">
                  Playlist • {pl.tracks.length} lagu
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

