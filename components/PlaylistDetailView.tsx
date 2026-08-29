import React, { useState, useEffect, useRef } from 'react';
import type { VideoItem, Playlist } from '../types';
import {
  ChevronLeft,
  Play,
  Shuffle,
  Trash2,
  Edit2,
  Share2,
  ListMusic,
} from 'lucide-react';
import { TrackCard } from './TrackCard';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromPlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isPlaying?: boolean;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  onBack: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  isYouTubePlaylist?: boolean;
  playbackProgress?: number | string;
  onToggleLike?: (track: VideoItem) => void;
  likedTrackIds?: string[];
  onShare?: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  onSelectTrack,
  onRemoveFromPlaylist,
  onSelectChannel,
  currentTrackId,
  isPlaying = false,
  offlineItems,
  onAddToOffline,
  onBack,
  onDelete,
  onRename,
  isYouTubePlaylist = false,
  onToggleLike,
  likedTrackIds = [],
  onShare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(playlist?.name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (playlist?.name) {
      setTitle(playlist.name);
    }
  }, [playlist?.name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!playlist) return null;

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

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      onSelectTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      onSelectTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Hero Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#242424] via-[#181818] to-[#121212] p-6 md:p-8 border border-[#282828] shadow-2xl">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1c1c1c] hover:bg-[#282828] text-[#9ca3af] hover:text-white text-xs font-semibold transition-colors border border-[#282828]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          {/* Cover Art / Mosaic */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-xl overflow-hidden bg-[#242424] shadow-2xl flex-shrink-0 border border-[#282828]">
            {playlist.tracks.length > 0 ? (
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                {playlist.tracks.slice(0, 4).map((t, i) => (
                  <img
                    key={t.id.videoId + i}
                    src={
                      t.snippet.thumbnailData ||
                      t.snippet.thumbnails.medium?.url ||
                      t.snippet.thumbnails.default.url
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6b7280]">
                <ListMusic className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left min-w-0 space-y-1.5 sm:space-y-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#9ca3af]">
              {isYouTubePlaylist ? 'YouTube Playlist' : 'Playlist'}
            </span>

            {isEditing && !isYouTubePlaylist ? (
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full text-xl sm:text-2xl md:text-4xl font-black text-white bg-transparent border-b-2 border-emerald-500 outline-none pb-1"
              />
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 group">
                <h1
                  className={`text-xl sm:text-2xl md:text-4xl font-black text-white truncate ${
                    !isYouTubePlaylist ? 'cursor-pointer hover:underline' : ''
                  }`}
                  onClick={() => !isYouTubePlaylist && setIsEditing(true)}
                  title={playlist.name}
                >
                  {playlist.name}
                </h1>
                {!isYouTubePlaylist && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-[#9ca3af] hover:text-white transition-opacity"
                    title="Ubah nama playlist"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs md:text-sm text-[#9ca3af] font-medium">
              {playlist.tracks.length} lagu • Dibuat oleh Anda
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                onClick={handlePlayAll}
                disabled={playlist.tracks.length === 0}
                className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
                title="Putar Semua"
              >
                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
              </button>

              <button
                onClick={handleShufflePlay}
                disabled={playlist.tracks.length === 0}
                className="p-3 rounded-full hover:bg-white/10 text-[#9ca3af] hover:text-white transition-colors"
                title="Acak"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {onShare && (
                <button
                  onClick={onShare}
                  className="p-3 rounded-full hover:bg-white/10 text-[#9ca3af] hover:text-white transition-colors"
                  title="Bagikan Playlist"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}

              {!isYouTubePlaylist && (
                <button
                  onClick={onDelete}
                  className="p-3 rounded-full hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 transition-colors"
                  title="Hapus Playlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track List Table */}
      {playlist.tracks.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#181818] rounded-xl border border-[#282828]">
          <ListMusic className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Playlist Ini Kosong</h3>
          <p className="text-xs text-[#9ca3af] max-w-xs mx-auto">
            Cari lagu di Beranda atau Cari dan tambahkan ke sini.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#282828]">
            <span>Daftar Lagu ({playlist.tracks.length})</span>
            <span>Aksi</span>
          </div>

          {playlist.tracks.map((item, index) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === item.id.videoId);
            const isLiked = likedTrackIds.includes(item.id.videoId);
            return (
              <div key={item.id.videoId + index} className="group relative flex items-center">
                <div className="flex-1 min-w-0">
                  <TrackCard
                    item={item}
                    index={index}
                    isCurrent={currentTrackId === item.id.videoId}
                    isPlaying={isPlaying}
                    onSelect={(track) => onSelectTrack(track, playlist.tracks)}
                    onSelectChannel={onSelectChannel}
                    onToggleLike={onToggleLike}
                    isLiked={isLiked}
                    isOffline={isOffline}
                    onDownload={onAddToOffline}
                    variant="row"
                  />
                </div>

                {!isYouTubePlaylist && (
                  <button
                    onClick={() => onRemoveFromPlaylist(item.id.videoId)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[#6b7280] hover:text-red-400 transition-all mr-2 flex-shrink-0"
                    title="Hapus dari Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

