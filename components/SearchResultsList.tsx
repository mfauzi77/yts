import React, { useMemo } from 'react';
import type { VideoItem, Playlist } from '../types';
import { TrackCard } from './TrackCard';
import { HorizontalShelf } from './HorizontalShelf';
import { Sparkles, Play, Flame, Music, Radio, Disc3, Heart, Headphones } from 'lucide-react';

interface SearchResultsListProps {
  items: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  onDeleteOffline?: (videoId: string) => void;
  currentTrackId?: string | null;
  isPlaying?: boolean;
  onToggleLike?: (track: VideoItem) => void;
  likedTrackIds?: string[];
  historyTracks?: VideoItem[];
  onNavigateToSearch?: (query: string) => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  items,
  onSelectTrack,
  onOpenAddToPlaylistModal,
  onSelectChannel,
  offlineItems,
  onAddToOffline,
  onDeleteOffline,
  currentTrackId,
  isPlaying = false,
  onToggleLike,
  likedTrackIds = [],
  historyTracks = [],
  onNavigateToSearch,
}) => {
  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Quick picks (up to 6 tracks for the top grid)
  const quickPicks = useMemo(() => {
    if (historyTracks.length > 0) {
      return historyTracks.slice(0, 6);
    }
    return items.slice(0, 6);
  }, [historyTracks, items]);

  // Partition items into thematic shelves
  const shelf1 = items.slice(0, 8); // Rekomendasi Utama
  const shelf2 = items.slice(8, 16); // Populer & Trending
  const shelf3 = items.slice(16, 24); // Lagu Pilihan

  const GENRE_SHORTCUTS = [
    { name: 'Pop Indonesia', color: 'from-pink-600 to-rose-900', query: 'lagu pop indonesia terbaru' },
    { name: 'Dangdut Koplo', color: 'from-amber-600 to-orange-900', query: 'lagu dangdut koplo terbaru' },
    { name: 'Indie & Akustik', color: 'from-emerald-600 to-teal-900', query: 'lagu indie indonesia santai' },
    { name: 'Lofi Chill', color: 'from-purple-600 to-indigo-950', query: 'lofi hip hop chill beats' },
    { name: 'DJ Remix Viral', color: 'from-cyan-600 to-blue-900', query: 'dj remix viral jedag jedug' },
    { name: 'K-Pop Hits', color: 'from-fuchsia-600 to-rose-950', query: 'kpop hits' },
  ];

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* =========================================================================
          GREETING & QUICK PICKS (Spotify 6-card compact grid)
      ========================================================================== */}
      <section className="space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          {greeting}
        </h1>

        {quickPicks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
            {quickPicks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id.videoId;
              const img =
                track.snippet.thumbnailData ||
                track.snippet.thumbnails.medium?.url ||
                track.snippet.thumbnails.default.url;

              return (
                <div
                  key={track.id.videoId + idx}
                  onClick={() => onSelectTrack(track, quickPicks)}
                  className={`group relative flex items-center rounded-lg bg-[#1f1f1f] hover:bg-[#2e2e2e] transition-all duration-200 cursor-pointer overflow-hidden shadow-sm ${
                    isCurrent ? 'bg-[#2a2a2a]' : ''
                  }`}
                >
                  {/* Small Square Artwork */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0 bg-[#282828]">
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Track Title */}
                  <div className="flex-1 min-w-0 px-2 sm:px-3 py-1">
                    <p
                      className={`text-[11px] sm:text-xs md:text-sm font-semibold truncate ${
                        isCurrent ? 'text-brand' : 'text-white'
                      }`}
                      title={track.snippet.title}
                    >
                      {track.snippet.title}
                    </p>
                  </div>

                  {/* Floating Play Button */}
                  <div className="pr-2 sm:pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          SHELF 1: Baru Saja Diputar / Riwayat (If history exists)
      ========================================================================== */}
      {historyTracks.length > 0 && (
        <HorizontalShelf title="Baru Saja Diputar" subtitle="Lanjutkan mendengarkan lagu Anda">
          {historyTracks.slice(0, 10).map((track, idx) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === track.id.videoId);
            const isLiked = likedTrackIds.includes(track.id.videoId);

            return (
              <div key={track.id.videoId + idx} className="w-36 md:w-44 flex-shrink-0">
                <TrackCard
                  item={track}
                  isCurrent={currentTrackId === track.id.videoId}
                  isPlaying={isPlaying}
                  onSelect={(t) => onSelectTrack(t, historyTracks)}
                  onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                  onSelectChannel={onSelectChannel}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={isOffline}
                  onDownload={onAddToOffline}
                  onDeleteDownload={onDeleteOffline}
                  variant="card"
                />
              </div>
            );
          })}
        </HorizontalShelf>
      )}

      {/* =========================================================================
          SHELF 2: Dibuat Untuk Kamu (Personalized / Top recommendations)
      ========================================================================== */}
      {shelf1.length > 0 && (
        <HorizontalShelf
          title="Dibuat Untuk Kamu"
          subtitle="Daftar lagu pilihan spesial yang cocok untuk harimu"
        >
          {shelf1.map((track, idx) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === track.id.videoId);
            const isLiked = likedTrackIds.includes(track.id.videoId);

            return (
              <div key={track.id.videoId + idx} className="w-36 md:w-44 flex-shrink-0">
                <TrackCard
                  item={track}
                  isCurrent={currentTrackId === track.id.videoId}
                  isPlaying={isPlaying}
                  onSelect={(t) => onSelectTrack(t, items)}
                  onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                  onSelectChannel={onSelectChannel}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={isOffline}
                  onDownload={onAddToOffline}
                  onDeleteDownload={onDeleteOffline}
                  variant="card"
                />
              </div>
            );
          })}
        </HorizontalShelf>
      )}

      {/* =========================================================================
          EXPLORE GENRES SHORTCUTS
      ========================================================================== */}
      {onNavigateToSearch && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Jelajahi Genre Populer
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {GENRE_SHORTCUTS.map((genre) => (
              <div
                key={genre.name}
                onClick={() => onNavigateToSearch(genre.query)}
                className={`relative h-20 rounded-xl p-3 bg-gradient-to-br ${genre.color} cursor-pointer overflow-hidden group hover:scale-[1.03] active:scale-[0.97] transition-all shadow-md flex items-end`}
              >
                <span className="text-xs md:text-sm font-black text-white leading-tight">
                  {genre.name}
                </span>
                <Music className="w-5 h-5 text-white/40 absolute top-2 right-2 group-hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SHELF 3: Trending & Populer
      ========================================================================== */}
      {shelf2.length > 0 && (
        <HorizontalShelf
          title="Trending & Populer"
          subtitle="Lagu-lagu yang sedang banyak diputar saat ini"
        >
          {shelf2.map((track, idx) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === track.id.videoId);
            const isLiked = likedTrackIds.includes(track.id.videoId);

            return (
              <div key={track.id.videoId + idx} className="w-36 md:w-44 flex-shrink-0">
                <TrackCard
                  item={track}
                  isCurrent={currentTrackId === track.id.videoId}
                  isPlaying={isPlaying}
                  onSelect={(t) => onSelectTrack(t, items)}
                  onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                  onSelectChannel={onSelectChannel}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={isOffline}
                  onDownload={onAddToOffline}
                  onDeleteDownload={onDeleteOffline}
                  variant="card"
                />
              </div>
            );
          })}
        </HorizontalShelf>
      )}

      {/* =========================================================================
          SHELF 4: Lagu Pilihan Lainnya (If available)
      ========================================================================== */}
      {shelf3.length > 0 && (
        <HorizontalShelf title="Rekomendasi Lainnya" subtitle="Temukan musik baru favorit Anda">
          {shelf3.map((track, idx) => {
            const isOffline = offlineItems.some((o) => o.id.videoId === track.id.videoId);
            const isLiked = likedTrackIds.includes(track.id.videoId);

            return (
              <div key={track.id.videoId + idx} className="w-36 md:w-44 flex-shrink-0">
                <TrackCard
                  item={track}
                  isCurrent={currentTrackId === track.id.videoId}
                  isPlaying={isPlaying}
                  onSelect={(t) => onSelectTrack(t, items)}
                  onOpenAddToPlaylist={onOpenAddToPlaylistModal}
                  onSelectChannel={onSelectChannel}
                  onToggleLike={onToggleLike}
                  isLiked={isLiked}
                  isOffline={isOffline}
                  onDownload={onAddToOffline}
                  onDeleteDownload={onDeleteOffline}
                  variant="card"
                />
              </div>
            );
          })}
        </HorizontalShelf>
      )}
    </div>
  );
};
