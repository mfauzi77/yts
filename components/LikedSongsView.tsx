import React from 'react';
import type { VideoItem } from '../types';
import { TrackCard } from './TrackCard';
import { Heart, Play, Shuffle, ChevronLeft, Music2 } from 'lucide-react';

interface LikedSongsViewProps {
  likedTracks: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
  isPlaying?: boolean;
  onToggleLike: (track: VideoItem) => void;
  onBack?: () => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  likedTracks,
  onSelectTrack,
  onOpenAddToPlaylistModal,
  onSelectChannel,
  offlineItems,
  onAddToOffline,
  currentTrackId,
  isPlaying,
  onToggleLike,
  onBack,
}) => {
  const handlePlayAll = () => {
    if (likedTracks.length > 0) {
      onSelectTrack(likedTracks[0], likedTracks);
    }
  };

  const handleShufflePlay = () => {
    if (likedTracks.length > 0) {
      const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
      onSelectTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#450af5] via-[#24136e] to-[#121212] p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 shadow-2xl border border-[#282828]">
        {/* Back Button if needed */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-3.5 left-3.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Large Heart Icon Box */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center flex-shrink-0 shadow-2xl">
          <Heart className="w-14 h-14 sm:w-20 sm:h-20 text-white fill-current drop-shadow-lg" />
        </div>

        {/* Metadata & Actions */}
        <div className="flex-1 text-center md:text-left space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/80">
            Koleksi Favorit
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">
            Lagu yang Disukai
          </h1>
          <p className="text-xs md:text-sm text-white/80 font-medium">
            {likedTracks.length} lagu favorit tersimpan
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={likedTracks.length === 0}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs md:text-sm shadow-xl hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black" />
              <span>Putar Semua</span>
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={likedTracks.length === 0}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#1c1c1c] hover:bg-[#282828] text-white font-bold text-xs md:text-sm active:scale-95 disabled:opacity-40 transition-all border border-[#282828]"
            >
              <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Acak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Song List */}
      {likedTracks.length === 0 ? (
        <div className="text-center py-20 px-4">
          <Music2 className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Belum Ada Lagu yang Disukai</h3>
          <p className="text-xs text-[#9ca3af] max-w-xs mx-auto">
            Tekan tombol hati (♥) pada lagu yang Anda suka untuk menyimpannya di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#282828]">
            <span>Daftar Lagu ({likedTracks.length})</span>
            <span>Aksi</span>
          </div>

          {likedTracks.map((item, index) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === item.id.videoId);
            return (
              <TrackCard
                key={`liked-${item.id.videoId}-${index}`}
                item={item}
                index={index}
                isCurrent={currentTrackId === item.id.videoId}
                isPlaying={isPlaying}
                onSelect={(track) => onSelectTrack(track, likedTracks)}
                onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                onSelectChannel={onSelectChannel}
                onToggleLike={onToggleLike}
                isLiked={true}
                isOffline={isOffline}
                onDownload={onAddToOffline}
                variant="row"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

