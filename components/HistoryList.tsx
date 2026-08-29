import React from 'react';
import type { VideoItem } from '../types';
import { TrackCard } from './TrackCard';
import { History, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
  playbackProgress?: number | string;
  onClearHistory?: () => void;
  onToggleLike?: (track: VideoItem) => void;
  likedTrackIds?: string[];
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelectTrack,
  onOpenAddToPlaylistModal,
  onSelectChannel,
  offlineItems,
  onAddToOffline,
  currentTrackId,
  onClearHistory,
  onToggleLike,
  likedTrackIds = [],
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#282828] flex items-center justify-center mb-4 text-[#6b7280] shadow-lg">
          <History className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Riwayat Putar Kosong</h3>
        <p className="text-sm text-[#9ca3af] max-w-sm">
          Lagu yang Anda putar akan otomatis tercatat di sini agar mudah didengarkan kembali.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Riwayat Putar
          </h1>
          <p className="text-xs md:text-sm text-[#9ca3af] mt-0.5">
            {history.length} lagu terakhir yang Anda dengarkan
          </p>
        </div>

        {onClearHistory && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1c1c] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 border border-[#282828] text-xs font-semibold transition-colors"
            title="Bersihkan Semua Riwayat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        {history.map((item, index) => {
          const isOffline = offlineItems.some((o) => o.id.videoId === item.id.videoId);
          const isLiked = likedTrackIds.includes(item.id.videoId);
          return (
            <TrackCard
              key={`history-${item.id.videoId}-${index}`}
              item={item}
              index={index}
              isCurrent={currentTrackId === item.id.videoId}
              onSelect={(track) => onSelectTrack(track, history)}
              onOpenAddToPlaylist={onOpenAddToPlaylistModal}
              onSelectChannel={onSelectChannel}
              onToggleLike={onToggleLike}
              isLiked={isLiked}
              isOffline={isOffline}
              onDownload={onAddToOffline}
              variant="row"
            />
          );
        })}
      </div>
    </div>
  );
};

