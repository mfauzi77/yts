import React from 'react';
import { X, ListMusic, Trash2, Play, Pause, Music } from 'lucide-react';
import type { VideoItem } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: VideoItem | null;
  queue: VideoItem[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromQueue?: (index: number) => void;
  onClearQueue?: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  queue,
  currentIndex,
  isPlaying,
  onSelectTrack,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const upNextList = queue.slice(currentIndex + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#121212] border-l border-[#282828] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#161616] border-b border-[#282828] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Antrean Pemutaran</h2>
              <p className="text-xs text-[#9ca3af]">
                {queue.length > 0 ? `${queue.length} lagu dalam daftar` : 'Antrean kosong'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {upNextList.length > 0 && onClearQueue && (
              <button
                onClick={onClearQueue}
                className="px-2.5 py-1 text-xs font-semibold text-[#9ca3af] hover:text-white hover:bg-[#242424] rounded-md transition-colors"
                title="Hapus sisa antrean"
              >
                Bersihkan
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#242424] text-[#9ca3af] hover:text-white transition-colors"
              title="Tutup Antrean"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section 1: Now Playing */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider block">
              Sedang Diputar
            </span>

            {currentTrack ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18271e] border border-emerald-500/30 text-white shadow-sm">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#242424] flex-shrink-0">
                  <img
                    src={
                      currentTrack.snippet.thumbnailData ||
                      currentTrack.snippet.thumbnails.medium?.url ||
                      currentTrack.snippet.thumbnails.default.url
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
                        <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-2" />
                        <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
                        <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-4" />
                      </div>
                    ) : (
                      <Pause className="w-4 h-4 text-emerald-400 fill-current" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-emerald-400 truncate">
                    {currentTrack.snippet.title}
                  </h4>
                  <p className="text-xs text-[#9ca3af] truncate mt-0.5">
                    {currentTrack.snippet.channelTitle}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#181818] border border-[#282828] text-center text-xs text-[#9ca3af]">
                Tidak ada lagu yang sedang diputar
              </div>
            )}
          </div>

          {/* Section 2: Next in Queue */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider block">
              Berikutnya dari Antrean ({upNextList.length})
            </span>

            {upNextList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6b7280]">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Tidak ada lagu berikutnya dalam antrean.</p>
                <p className="mt-1">Pilih lagu dari Beranda atau Cari untuk menambahkan.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upNextList.map((item, relIndex) => {
                  const absoluteIndex = currentIndex + 1 + relIndex;
                  const imageUrl =
                    item.snippet.thumbnailData ||
                    item.snippet.thumbnails.medium?.url ||
                    item.snippet.thumbnails.default.url;

                  return (
                    <div
                      key={`${item.id.videoId}-${absoluteIndex}`}
                      onClick={() => onSelectTrack(item, queue)}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#1f1f1f] text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="w-5 text-center text-xs font-mono text-[#6b7280] group-hover:hidden">
                        {relIndex + 1}
                      </div>
                      <div className="hidden group-hover:flex w-5 items-center justify-center text-white">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>

                      <div className="relative w-10 h-10 rounded overflow-hidden bg-[#242424] flex-shrink-0">
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.snippet.title}</p>
                        <p className="text-[11px] text-[#6b7280] truncate mt-0.5">
                          {item.snippet.channelTitle}
                        </p>
                      </div>

                      {onRemoveFromQueue && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromQueue(absoluteIndex);
                          }}
                          className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-all"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
