import React, { useState } from 'react';
import type { VideoItem, YouTubePlaylist } from '../types';
import { ChevronLeft, Play, ListMusic, User, ArrowDown, Loader2 } from 'lucide-react';
import { TrackCard } from './TrackCard';

interface ChannelViewProps {
  channelTitle: string;
  videos: VideoItem[];
  playlists: YouTubePlaylist[];
  isLoading: boolean;
  isMoreLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onSelectPlaylist: (playlist: YouTubePlaylist) => void;
  onBack: () => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onAddToOffline: (track: VideoItem) => void;
  offlineItems: VideoItem[];
  currentTrackId?: string | null;
  onLoadMore: () => void;
  hasNextPage: boolean;
  playbackProgress?: number | string;
  onToggleLike?: (track: VideoItem) => void;
  likedTrackIds?: string[];
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  channelTitle,
  videos,
  playlists,
  isLoading,
  isMoreLoading,
  onSelectTrack,
  onSelectPlaylist,
  onBack,
  onOpenAddToPlaylistModal,
  onAddToOffline,
  offlineItems,
  currentTrackId,
  onLoadMore,
  hasNextPage,
  onToggleLike,
  likedTrackIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');

  return (
    <div className="space-y-6 pb-12">
      {/* Artist Profile Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-dark-card via-dark-surface to-dark-bg p-5 md:p-8 border border-white/5 shadow-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-card/60 hover:bg-dark-elevated text-dark-subtext hover:text-white border border-white/5 text-xs font-semibold transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-dark-card border-2 border-brand shadow-glow flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-brand" />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand">
              Artis / Kreator
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white truncate leading-tight">
              {channelTitle}
            </h1>
            <p className="text-xs md:text-sm text-dark-subtext">
              {videos.length} lagu tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-border pb-2">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-full transition-all ${
            activeTab === 'videos'
              ? 'bg-brand text-white shadow-glow'
              : 'bg-dark-card text-dark-subtext hover:text-white'
          }`}
        >
          Daftar Video ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-full transition-all ${
            activeTab === 'playlists'
              ? 'bg-brand text-white shadow-glow'
              : 'bg-dark-card text-dark-subtext hover:text-white'
          }`}
        >
          Playlist Channel ({playlists.length})
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
        </div>
      ) : activeTab === 'videos' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            {videos.map((item, index) => {
              const isOffline = offlineItems.some((o) => o.id.videoId === item.id.videoId);
              const isLiked = likedTrackIds.includes(item.id.videoId);
              return (
                <TrackCard
                  key={item.id.videoId}
                  item={item}
                  index={index}
                  isCurrent={currentTrackId === item.id.videoId}
                  onSelect={(track) => onSelectTrack(track, videos)}
                  onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={isOffline}
                  onDownload={onAddToOffline}
                  variant="row"
                />
              );
            })}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <button
                onClick={onLoadMore}
                disabled={isMoreLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-dark-card hover:bg-dark-elevated text-white font-bold text-xs md:text-sm border border-white/10 active:scale-95 disabled:opacity-50 transition-all shadow-md"
              >
                {isMoreLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <span>Memuat lagu lainnya...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span>Muat Lebih Banyak</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Channel Playlists */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.length > 0 ? (
            playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-3 rounded-2xl bg-dark-card/60 hover:bg-dark-elevated/90 border border-white/5 hover:border-white/15 transition-all cursor-pointer shadow-card"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-dark-surface">
                  <img
                    src={pl.snippet.thumbnails.medium?.url || pl.snippet.thumbnails.default.url}
                    alt={pl.snippet.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{pl.snippet.title}</h4>
                <p className="text-xs text-dark-subtext mt-0.5">
                  {pl.contentDetails.itemCount} lagu
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-dark-subtext">
              <ListMusic className="w-12 h-12 text-dark-muted mx-auto mb-2" />
              <p>Channel ini tidak memiliki playlist publik.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
