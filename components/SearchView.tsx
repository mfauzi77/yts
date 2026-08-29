import React, { useState } from 'react';
import type { VideoItem } from '../types';
import { TrackCard } from './TrackCard';
import { Music, Play } from 'lucide-react';

interface SearchViewProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: VideoItem[];
  isLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  currentTrackId?: string | null;
  isPlaying: boolean;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  likedTrackIds?: string[];
  onToggleLike?: (track: VideoItem) => void;
}

const GENRES = [
  { id: 'pop', name: 'Pop Indonesia', color: 'from-pink-600 to-rose-900', query: 'lagu pop indonesia terbaru' },
  { id: 'rock', name: 'Rock & Alternatif', color: 'from-red-600 to-amber-900', query: 'lagu rock indonesia' },
  { id: 'dangdut', name: 'Dangdut Koplo', color: 'from-amber-500 to-orange-800', query: 'lagu dangdut koplo terbaru' },
  { id: 'indie', name: 'Indie Lokal', color: 'from-emerald-600 to-teal-900', query: 'lagu indie indonesia terbaik' },
  { id: 'akustik', name: 'Akustik Santai', color: 'from-blue-600 to-indigo-900', query: 'lagu akustik cafe santai' },
  { id: 'lofi', name: 'Lofi Chill Vibes', color: 'from-purple-600 to-violet-950', query: 'lofi hip hop chill beats' },
  { id: 'kpop', name: 'K-Pop Hits', color: 'from-fuchsia-600 to-pink-900', query: 'kpop hits' },
  { id: 'remix', name: 'DJ Remix Jedag Jedug', color: 'from-cyan-600 to-blue-900', query: 'dj remix viral jedag jedug' },
  { id: 'jazz', name: 'Jazz & Soul', color: 'from-amber-700 to-yellow-950', query: 'jazz cafe lounge' },
  { id: 'religi', name: 'Religi & Sholawat', color: 'from-emerald-700 to-teal-950', query: 'sholawat merdu penyejuk hati' },
  { id: 'anime', name: 'Anime OST & J-Pop', color: 'from-rose-500 to-red-800', query: 'anime ost popular' },
  { id: 'viral', name: 'Viral TikTok 2025', color: 'from-violet-600 to-purple-900', query: 'lagu viral tiktok terbaru' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  onSelectTrack,
  currentTrackId,
  isPlaying,
  onOpenAddToPlaylistModal,
  onSelectChannel,
  offlineItems,
  onAddToOffline,
  likedTrackIds = [],
  onToggleLike,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'tracks'>('all');

  const topResult = searchResults[0];
  const otherResults = searchResults.slice(1);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Search Prompt Header */}
      {!searchQuery && (
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Jelajahi Semua
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {GENRES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => onSearch(genre.query)}
                className={`relative h-28 md:h-32 rounded-xl p-3 md:p-4 bg-gradient-to-br ${genre.color} cursor-pointer overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md`}
              >
                <span className="text-base md:text-lg font-black text-white leading-snug break-words pr-8 block">
                  {genre.name}
                </span>

                <div className="absolute right-[-10px] bottom-[-10px] rotate-[25deg] shadow-2xl opacity-80 group-hover:scale-110 group-hover:rotate-[20deg] transition-all">
                  <div className="w-16 h-16 rounded-md bg-black/30 flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#9ca3af]">Mencari lagu & artis...</p>
        </div>
      )}

      {/* Search Results Display */}
      {searchQuery && !isLoading && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveFilter('tracks')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeFilter === 'tracks'
                  ? 'bg-white text-black'
                  : 'bg-[#1c1c1c] text-white hover:bg-[#242424] border border-[#282828]'
              }`}
            >
              Lagu
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base font-bold text-white mb-1">
                Tidak ada hasil untuk "{searchQuery}"
              </p>
              <p className="text-xs text-[#9ca3af]">
                Coba periksa ejaan atau gunakan kata kunci artis/judul lain.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Result + Top Songs Layout */}
              {activeFilter === 'all' && topResult && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Top Result Box (2 cols on lg) */}
                  <div className="lg:col-span-2 space-y-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Hasil Teratas</h3>
                    <div
                      onClick={() => onSelectTrack(topResult, searchResults)}
                      className="group relative p-3.5 sm:p-4 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#282828] cursor-pointer transition-all flex flex-col justify-between min-h-[170px] sm:h-[190px] select-none shadow-md"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#242424] shadow-md">
                        <img
                          src={
                            topResult.snippet.thumbnailData ||
                            topResult.snippet.thumbnails.medium?.url ||
                            topResult.snippet.thumbnails.default.url
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 pr-12 sm:pr-14">
                        <h4 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                          {topResult.snippet.title}
                        </h4>
                        <p className="text-xs text-[#9ca3af] truncate mt-1">
                          Lagu • {topResult.snippet.channelTitle}
                        </p>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrack(topResult, searchResults);
                        }}
                        className="absolute right-3.5 bottom-3.5 sm:right-4 sm:bottom-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition-transform"
                        aria-label="Putar"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-black ml-0.5" />
                      </button>
                    </div>
                  </div>

                  {/* Top 4 songs next to it (3 cols on lg) */}
                  <div className="lg:col-span-3 space-y-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Lagu Terpopuler</h3>
                    <div className="space-y-1">
                      {searchResults.slice(0, 4).map((item, index) => {
                        const isOffline = offlineItems.some(
                          (o) => o.id.videoId === item.id.videoId
                        );
                        const isLiked = likedTrackIds.includes(item.id.videoId);
                        return (
                          <TrackCard
                            key={item.id.videoId + index}
                            item={item}
                            index={index}
                            isCurrent={currentTrackId === item.id.videoId}
                            isPlaying={isPlaying}
                            onSelect={(track) => onSelectTrack(track, searchResults)}
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
                </div>
              )}

              {/* Full Results List */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {activeFilter === 'all' ? 'Hasil Lainnya' : 'Semua Lagu'}
                </h3>
                <div className="space-y-1">
                  {(activeFilter === 'all' ? otherResults : searchResults).map((item, index) => {
                    const isOffline = offlineItems.some(
                      (o) => o.id.videoId === item.id.videoId
                    );
                    const isLiked = likedTrackIds.includes(item.id.videoId);
                    return (
                      <TrackCard
                        key={item.id.videoId + index}
                        item={item}
                        index={index + (activeFilter === 'all' ? 1 : 0)}
                        isCurrent={currentTrackId === item.id.videoId}
                        isPlaying={isPlaying}
                        onSelect={(track) => onSelectTrack(track, searchResults)}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

