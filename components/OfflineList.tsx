import React from 'react';
import type { VideoItem } from '../types';
import { DownloadCloud, CheckCircle2, RefreshCw, Trash2, Info } from 'lucide-react';
import { TrackCard } from './TrackCard';

interface OfflineListProps {
  offlinePlaylist: VideoItem[];
  syncedOfflineIds: string[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromOfflinePlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isSyncing: boolean;
  onStartSync: () => void;
  syncingTrackProgress: number;
  playbackProgress?: number | string;
  onToggleLike?: (track: VideoItem) => void;
  likedTrackIds?: string[];
}

export const OfflineList: React.FC<OfflineListProps> = ({
  offlinePlaylist,
  syncedOfflineIds,
  onSelectTrack,
  onRemoveFromOfflinePlaylist,
  onSelectChannel,
  currentTrackId,
  isSyncing,
  onStartSync,
  syncingTrackProgress,
  onToggleLike,
  likedTrackIds = [],
}) => {
  const unsyncedCount = offlinePlaylist.filter(
    (item) => !syncedOfflineIds.includes(item.id.videoId)
  ).length;

  if (offlinePlaylist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#282828] flex items-center justify-center mb-4 text-[#6b7280] shadow-lg">
          <DownloadCloud className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Koleksi Offline Kosong</h3>
        <p className="text-sm text-[#9ca3af] max-w-sm">
          Simpan lagu favorit Anda agar tetap dapat didengarkan kapan pun meski tanpa kuota internet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Offline Status & Sync Card */}
      <div className="p-5 md:p-6 bg-[#181818] rounded-2xl border border-[#282828] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Mode Offline & Unduhan</h2>
            </div>
            <p className="text-xs md:text-sm text-[#9ca3af]">
              {isSyncing
                ? `Menyinkronkan data lagu... ${Math.round(syncingTrackProgress)}%`
                : `${offlinePlaylist.length - unsyncedCount} dari ${offlinePlaylist.length} lagu siap diputar offline.`}
            </p>
          </div>

          <button
            onClick={onStartSync}
            disabled={isSyncing || unsyncedCount === 0}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl text-xs md:text-sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Menyinkronkan...</span>
              </>
            ) : unsyncedCount === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Semua Tersinkron</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Sinkronkan ({unsyncedCount} Lagu)</span>
              </>
            )}
          </button>
        </div>

        {isSyncing && (
          <div className="w-full bg-[#121212] h-2 rounded-full mt-4 overflow-hidden border border-[#282828]">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${syncingTrackProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Offline Track List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#282828]">
          <span>Daftar Unduhan ({offlinePlaylist.length})</span>
          <span>Status</span>
        </div>

        {offlinePlaylist.map((item, index) => {
          const isSynced = syncedOfflineIds.includes(item.id.videoId);
          const isLiked = likedTrackIds.includes(item.id.videoId);
          return (
            <div key={item.id.videoId} className="group relative flex items-center">
              <div className="flex-1 min-w-0">
                <TrackCard
                  item={item}
                  index={index}
                  isCurrent={currentTrackId === item.id.videoId}
                  onSelect={(track) => onSelectTrack(track, offlinePlaylist)}
                  onSelectChannel={onSelectChannel}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={true}
                  downloadState={{ status: isSynced ? 'saved' : 'idle' }}
                  variant="row"
                />
              </div>

              <button
                onClick={() => onRemoveFromOfflinePlaylist(item.id.videoId)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[#6b7280] hover:text-red-400 hover:bg-white/5 transition-all mr-2 flex-shrink-0"
                title="Hapus dari Penyimpanan Offline"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] text-xs text-[#9ca3af] flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Catatan Offline:</strong> Metadata dan sampul tersimpan di penyimpanan browser lokal. Lagu yang telah diputar sebelumnya akan di-cache secara otomatis untuk pemutaran tanpa kuota.
        </p>
      </div>
    </div>
  );
};

