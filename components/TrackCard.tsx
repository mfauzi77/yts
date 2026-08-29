import React from 'react';
import type { VideoItem } from '../types';
import { Play, Pause, Plus, Heart, Download, Check } from 'lucide-react';

interface TrackCardProps {
  item: VideoItem;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onSelect: (item: VideoItem) => void;
  onOpenAddToPlaylist?: (item: VideoItem) => void;
  onSelectChannel?: (channelId: string, channelTitle: string) => void;
  isLiked?: boolean;
  onToggleLike?: (item: VideoItem) => void;
  isOffline?: boolean;
  onDownload?: (item: VideoItem) => void;
  onDeleteDownload?: (videoId: string) => void;
  downloadState?: { status: 'idle' | 'downloading' | 'saved' | 'error'; progress?: number };
  variant?: 'card' | 'row' | 'compact';
  index?: number;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  item,
  isPlaying = false,
  isCurrent = false,
  onSelect,
  onOpenAddToPlaylist,
  onSelectChannel,
  isLiked = false,
  onToggleLike,
  isOffline: _isOffline = false,
  onDownload,
  onDeleteDownload,
  downloadState,
  variant = 'card',
  index,
}) => {
  const imageUrl =
    item.snippet.thumbnailData ||
    item.snippet.thumbnails.medium?.url ||
    item.snippet.thumbnails.default.url;

  // =========================================================================
  // ROW VARIANT (Spotify-style track list row)
  // =========================================================================
  if (variant === 'row') {
    return (
      <div
        className={`group relative flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer select-none ${
          isCurrent
            ? 'bg-[#18271e] text-emerald-400 border border-emerald-500/20'
            : 'text-[#9ca3af] hover:text-white hover:bg-[#181818]'
        }`}
        onClick={() => onSelect(item)}
      >
        {/* Index or Equalizer / Play Button */}
        <div className="w-4 sm:w-6 flex items-center justify-center flex-shrink-0 text-[11px] sm:text-xs font-semibold text-[#6b7280]">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-2" />
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
              <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-4" />
            </div>
          ) : (
            <>
              <span className="group-hover:hidden text-[#6b7280]">
                {index !== undefined ? index + 1 : '•'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item);
                }}
                className="hidden group-hover:flex items-center justify-center text-white"
                aria-label={`Putar ${item.snippet.title}`}
              >
                <Play className="w-3.5 h-3.5 fill-current text-white" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-md overflow-hidden flex-shrink-0 bg-[#242424]">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>

        {/* Title & Channel */}
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <p
            className={`text-xs sm:text-sm font-medium sm:font-semibold truncate ${
              isCurrent ? 'text-emerald-400 font-bold' : 'text-white'
            }`}
            title={item.snippet.title}
          >
            {item.snippet.title}
          </p>
          <p
            className="text-[10px] sm:text-xs text-[#9ca3af] hover:text-white hover:underline truncate cursor-pointer mt-0.5 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectChannel) {
                onSelectChannel(item.snippet.channelId, item.snippet.channelTitle);
              }
            }}
          >
            {item.snippet.channelTitle}
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {onToggleLike && (
            <button
              onClick={() => onToggleLike(item)}
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                isLiked
                  ? 'text-emerald-400'
                  : 'text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100'
              }`}
              title={isLiked ? 'Batal Suka' : 'Suka'}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          )}

          {onOpenAddToPlaylist && (
            <button
              onClick={() => onOpenAddToPlaylist(item)}
              className="p-1 sm:p-1.5 rounded-full text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100 transition-colors"
              title="Tambah ke Playlist"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {onDownload && (
            <button
              onClick={() => {
                if (downloadState?.status === 'saved' && onDeleteDownload) {
                  onDeleteDownload(item.id.videoId);
                } else {
                  onDownload(item);
                }
              }}
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                downloadState?.status === 'saved'
                  ? 'text-emerald-400'
                  : downloadState?.status === 'downloading'
                  ? 'text-emerald-400 animate-spin'
                  : 'text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100'
              }`}
              title={downloadState?.status === 'saved' ? 'Tersimpan Offline' : 'Unduh'}
            >
              {downloadState?.status === 'saved' ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CARD VARIANT (Spotify-style Catalog Card with Circular Hover Play Button)
  // =========================================================================
  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col p-2.5 sm:p-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-transparent hover:border-[#282828] transition-all duration-300 cursor-pointer select-none shadow-sm"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-2 sm:mb-3 shadow-md">
        <img
          src={imageUrl}
          alt={item.snippet.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Circular Floating Play Button */}
        <div className="absolute right-2 bottom-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 shadow-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            aria-label={`Putar ${item.snippet.title}`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 fill-current text-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Playing Animated Indicator */}
        {isCurrent && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-emerald-400 text-[10px] font-bold tracking-wider flex items-center gap-1.5 uppercase border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isPlaying ? 'Putar' : 'Jeda'}
          </div>
        )}
      </div>

      {/* Song Title & Artist */}
      <div className="flex flex-col flex-1 min-w-0">
        <h4
          className={`text-xs sm:text-sm font-semibold sm:font-bold line-clamp-2 leading-snug mb-0.5 ${
            isCurrent ? 'text-emerald-400' : 'text-white'
          }`}
          title={item.snippet.title}
        >
          {item.snippet.title}
        </h4>
        <p
          className="text-[11px] sm:text-xs text-[#9ca3af] hover:text-white hover:underline truncate cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectChannel) {
              onSelectChannel(item.snippet.channelId, item.snippet.channelTitle);
            }
          }}
        >
          {item.snippet.channelTitle}
        </p>
      </div>
    </div>
  );
};

