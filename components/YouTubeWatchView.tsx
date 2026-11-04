import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { VideoItem } from '../types';
import { getRelatedVideos, searchVideos } from '../services/youtubeService';
import { LyricsView } from './LyricsView';

interface YouTubeWatchViewProps {
  currentTrack: VideoItem | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  playbackList: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onToggleLike: (track: VideoItem) => void;
  isLiked: boolean;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isVideoMode: boolean;
  onToggleVideoMode: (enabled?: boolean) => void;
  currentTime: number;
  duration: number;
  seekTo: (seconds: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  onDownloadTrack: (track: VideoItem) => void;
  onDeleteDownload: (videoId: string) => void;
  getDownloadState: (videoId: string) => any;
  recommendations?: VideoItem[];
  isLocalMode?: boolean;
  videoSubView?: 'feed' | 'watch';
  onSubViewChange?: (subView: 'feed' | 'watch') => void;
  onBack?: () => void;
}

export const YouTubeWatchView: React.FC<YouTubeWatchViewProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  playbackList,
  onSelectTrack,
  onSelectChannel,
  onOpenAddToPlaylistModal,
  onToggleLike,
  isLiked,
  isAutoplayEnabled,
  onToggleAutoplay,
  isShuffle,
  onToggleShuffle,
  isVideoMode,
  onToggleVideoMode,
  currentTime,
  duration,
  seekTo,
  offlineItems,
  onDownloadTrack,
  getDownloadState,
  recommendations = [],
  isLocalMode = false,
  videoSubView: externalSubView,
  onSubViewChange,
  onBack,
}) => {
  // SubView: 'feed' (Beranda Video) or 'watch' (Sedang Menonton Video)
  const [internalSubView, setInternalSubView] = useState<'feed' | 'watch'>(externalSubView || 'feed');

  useEffect(() => {
    if (externalSubView !== undefined) {
      setInternalSubView(externalSubView);
    }
  }, [externalSubView]);

  const setSubView = useCallback((next: 'feed' | 'watch') => {
    setInternalSubView(next);
    if (onSubViewChange) {
      onSubViewChange(next);
    }
  }, [onSubViewChange]);

  // Feed State: Beranda Video + Search
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>(recommendations);
  const [isFeedLoading, setIsFeedLoading] = useState<boolean>(false);

  // Watch View State
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics' | 'related'>('queue');
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const scrollToTop = useCallback(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      const slot = document.getElementById('yt-main-video-slot');
      if (slot) {
        slot.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    });
  }, []);

  // Otomatis scroll ke atas (posisi video player) saat masuk ke watch view atau ganti video (khususnya di tampilan HP)
  useEffect(() => {
    if (internalSubView === 'watch') {
      scrollToTop();
      const t1 = setTimeout(scrollToTop, 50);
      const t2 = setTimeout(scrollToTop, 150);
      const t3 = setTimeout(scrollToTop, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [internalSubView, currentTrack?.id.videoId, scrollToTop]);

  // Sync recommendations into feed if query is empty
  useEffect(() => {
    if (!videoSearchQuery.trim() && recommendations.length > 0) {
      if (feedVideos.length === 0) {
        setFeedVideos(recommendations);
      }
    }
  }, [recommendations, videoSearchQuery, feedVideos.length]);

  // Video Search debounce
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVideoSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVideoSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setFeedVideos(recommendations);
      setIsFeedLoading(false);
      return;
    }

    setIsFeedLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchVideos(val.trim());
        setFeedVideos(results || []);
      } catch (err) {
        console.warn('Gagal mencari video:', err);
      } finally {
        setIsFeedLoading(false);
      }
    }, 400);
  };

  // Fetch related videos when track changes in watch view
  useEffect(() => {
    if (!currentTrack || internalSubView !== 'watch') return;
    let isMounted = true;
    setIsLoadingRelated(true);

    getRelatedVideos(currentTrack.id.videoId, currentTrack.snippet.title)
      .then(items => {
        if (isMounted) {
          setRelatedVideos(items || []);
          setIsLoadingRelated(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingRelated(false);
      });

    return () => { isMounted = false; };
  }, [currentTrack?.id.videoId, currentTrack?.snippet.title, internalSubView]);

  const handleShare = () => {
    if (!currentTrack) return;
    const url = `https://www.youtube.com/watch?v=${currentTrack.id.videoId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const fallbackThumb = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&auto=format&fit=crop&q=60';
  const thumbUrl = currentTrack?.snippet?.thumbnails?.high?.url 
    || currentTrack?.snippet?.thumbnails?.medium?.url 
    || currentTrack?.snippet?.thumbnails?.default?.url 
    || fallbackThumb;

  // --- SUBVIEW 1: BERANDA VIDEO + SEARCH ---
  if (internalSubView === 'feed') {
    return (
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 text-white">
        {/* Header: Beranda Video */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <i className="fab fa-youtube text-brand-red text-3xl"></i>
            <h1 className="text-2xl font-bold text-white tracking-tight">Beranda Video</h1>
          </div>
        </div>

        {/* Search Input Langsung di Bawahnya */}
        <div className="relative mb-6">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-dark-subtext text-base"></i>
          <input
            type="text"
            value={videoSearchQuery}
            onChange={handleVideoSearchChange}
            placeholder="Cari video di YouTube..."
            autoFocus
            className="w-full bg-dark-card border border-white/10 focus:border-brand-red text-white rounded-full py-3 pl-12 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all placeholder:text-dark-subtext"
          />
          {videoSearchQuery && (
            <button
              onClick={() => {
                setVideoSearchQuery('');
                setFeedVideos(recommendations);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-subtext hover:text-white p-1"
              title="Hapus pencarian"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          )}
        </div>

        {/* Video Results / Catalog */}
        <div>
          {isFeedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="w-full aspect-video bg-dark-card rounded-xl"></div>
                  <div className="h-4 bg-dark-card rounded w-3/4"></div>
                  <div className="h-3 bg-dark-card rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : feedVideos.length === 0 ? (
            <div className="text-center py-16 text-dark-subtext">
              <i className="fas fa-search text-4xl mb-3 text-brand-red/60"></i>
              <p className="font-semibold text-white">
                {videoSearchQuery ? `Tidak ada video untuk "${videoSearchQuery}"` : 'Ketik untuk mencari video'}
              </p>
              <p className="text-xs mt-1">Coba gunakan kata kunci artis, judul lagu, atau video lainnya.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {feedVideos.map((video) => {
                const isCurrent = currentTrack?.id.videoId === video.id.videoId;
                const vThumb = video.snippet?.thumbnails?.high?.url 
                  || video.snippet?.thumbnails?.medium?.url 
                  || video.snippet?.thumbnails?.default?.url 
                  || fallbackThumb;

                return (
                  <div
                    key={video.id.videoId}
                    onClick={() => {
                      onSelectTrack(video, feedVideos);
                      onToggleVideoMode(true);
                      setSubView('watch');
                      scrollToTop();
                    }}
                    className={`bg-dark-card/60 hover:bg-dark-highlight rounded-2xl p-2.5 cursor-pointer transition-all border border-white/5 group flex flex-col ${
                      isCurrent ? 'ring-2 ring-brand-red shadow-lg shadow-red-900/20' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-black mb-2.5">
                      <img
                        src={vThumb}
                        alt={video.snippet.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Play Button Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-11 h-11 rounded-full bg-brand-red flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <i className="fas fa-play text-sm ml-0.5"></i>
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        HD
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-dark-surface border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-dark-subtext">
                        <i className="fas fa-user text-xs"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
                          {video.snippet.title}
                        </p>
                        <p className="text-[11px] text-dark-subtext mt-1 truncate">
                          {video.snippet.channelTitle}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- SUBVIEW 2: WATCH VIEW (SEDANG MENONTON VIDEO) ---
  if (!currentTrack) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-white">
        <div className="w-20 h-20 bg-brand-red/10 border border-brand-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-red">
          <i className="fab fa-youtube text-4xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pilih Video untuk Menonton</h2>
        <p className="text-dark-subtext text-sm max-w-md mx-auto mb-6">
          Belum ada video yang dipilih. Kembali ke Beranda Video untuk mencari tayangan.
        </p>
        <button
          onClick={() => setSubView('feed')}
          className="px-6 py-2.5 rounded-full bg-brand-red hover:bg-red-700 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2"
        >
          <i className="fas fa-arrow-left text-xs"></i>
          <span>Kembali ke Beranda Video</span>
        </button>
      </div>
    );
  }

  const downloadState = getDownloadState(currentTrack.id.videoId);
  const isDownloaded = downloadState?.isDownloaded || offlineItems.some(o => o.id.videoId === currentTrack.id.videoId);

  const handleBackToFeed = () => {
    // Hentikan video saat klik back dari mode tonton video
    if (isPlaying) {
      onTogglePlay();
    }
    if (onBack) {
      onBack();
    } else {
      setSubView('feed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 text-white">
      {/* Top Bar with Back to Feed Button & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Tombol Back: Menghentikan video dan kembali ke Beranda Video */}
          <button
            onClick={handleBackToFeed}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-card hover:bg-dark-highlight text-white text-xs font-semibold border border-white/10 transition-colors shadow"
            title="Kembali ke Beranda Video"
          >
            <i className="fas fa-arrow-left text-sm text-brand-red"></i>
            <span>Beranda Video</span>
          </button>
          
          <div className="flex items-center gap-2">
            <i className="fab fa-youtube text-brand-red text-2xl"></i>
            <span className="font-bold text-white text-base hidden sm:inline">Pemutar Video</span>
          </div>
        </div>

        {/* Central Switch Pill (YouTube Music style: Lagu | Video) */}
        <div className="inline-flex p-1 bg-dark-card border border-white/10 rounded-full shadow-lg items-center">
          <button
            onClick={() => onToggleVideoMode(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              !isVideoMode
                ? 'bg-white text-black shadow-md'
                : 'text-dark-subtext hover:text-white'
            }`}
            title="Beralih ke mode audio untuk menghemat kuota data"
          >
            <i className={`fas fa-music ${!isVideoMode ? 'text-brand-red' : ''}`}></i>
            <span>Lagu (Audio)</span>
          </button>
          <button
            onClick={() => onToggleVideoMode(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              isVideoMode
                ? 'bg-brand-red text-white shadow-md'
                : 'text-dark-subtext hover:text-white'
            }`}
            title="Tampilkan video klip resmi YouTube"
          >
            <i className="fab fa-youtube"></i>
            <span>Video (YouTube)</span>
          </button>
        </div>

        {/* Right Status & Theater toggle */}
        <div className="flex items-center gap-2">
          {isVideoMode ? (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Video HD
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 font-semibold">
              <i className="fas fa-leaf text-[10px]"></i>
              Hemat Kuota
            </span>
          )}

          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`p-2 rounded-lg text-dark-subtext hover:text-white hover:bg-dark-surface transition-colors hidden md:block ${isTheaterMode ? 'text-brand-red bg-dark-surface' : ''}`}
            title={isTheaterMode ? "Tampilan Standar" : "Mode Bioskop (Lebar)"}
          >
            <i className="fas fa-expand text-sm"></i>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stage (Video/Details) + Right Sidebar (Up Next/Related) */}
      <div className={`grid gap-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_380px]'}`}>
        
        {/* Left Stage */}
        <div className="space-y-4 min-w-0">
          
          {/* 16:9 Video Player Viewport */}
          <div className="relative group">
            <div 
              id="yt-main-video-slot"
              className={`w-full aspect-video bg-black rounded-2xl relative overflow-hidden shadow-2xl border border-white/10 transition-all ${
                isTheaterMode ? 'max-h-[75vh]' : 'max-h-[65vh]'
              }`}
            >
              {/* If Audio Mode is selected inside this view, show album stage */}
              {!isVideoMode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-dark-surface to-dark-bg text-center">
                  <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl mb-4 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={thumbUrl} 
                      alt={currentTrack.snippet.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold mb-3">
                    <i className="fas fa-leaf text-[10px]"></i>
                    <span>Mode Hemat Data (Audio Saja)</span>
                  </div>
                  <button
                    onClick={() => onToggleVideoMode(true)}
                    className="px-5 py-2 rounded-full bg-brand-red hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <i className="fab fa-youtube text-sm"></i>
                    <span>Tonton Video YouTube</span>
                  </button>
                </div>
              ) : isLocalMode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 text-center">
                  <i className="fas fa-wifi-slash text-4xl text-yellow-500 mb-3"></i>
                  <p className="font-bold text-white text-base">Sedang Memutar File Offline</p>
                  <p className="text-xs text-dark-subtext max-w-sm mt-1">
                    Lagu ini diputar dari penyimpanan offline lokal. Hubungkan ke internet untuk memutar streaming video YouTube.
                  </p>
                </div>
              ) : (
                /* Video Mode Active: #player-container is docked right over this slot by useVideoDock */
                <div className="w-full h-full bg-black flex items-center justify-center text-dark-subtext text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-brand-red border-t-transparent animate-spin"></span>
                    <span>Memuat Pemutar Video YouTube...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Title */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white leading-snug">
              {currentTrack.snippet.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-dark-subtext">
              <span>{currentTrack.snippet.publishedAt ? new Date(currentTrack.snippet.publishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
              <span>•</span>
              <span className="text-brand-red font-semibold">YTS Video Player</span>
            </div>
          </div>

          {/* Channel Bar & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-white/10">
            {/* Channel Info */}
            <div 
              onClick={() => onSelectChannel(currentTrack.snippet.channelId, currentTrack.snippet.channelTitle)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-dark-card border border-white/10 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                <i className="fas fa-user text-base text-dark-subtext"></i>
              </div>
              <div>
                <p className="font-bold text-sm text-white group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                  <span>{currentTrack.snippet.channelTitle}</span>
                  <i className="fas fa-check-circle text-[11px] text-dark-subtext"></i>
                </p>
                <p className="text-xs text-dark-subtext">Kunjungi Saluran</p>
              </div>
            </div>

            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Like Button */}
              <button
                onClick={() => onToggleLike(currentTrack)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isLiked
                    ? 'bg-brand-red text-white shadow-lg shadow-red-900/30'
                    : 'bg-dark-card hover:bg-dark-highlight text-white border border-white/10'
                }`}
                title={isLiked ? "Hapus dari Favorit" : "Sukai Video"}
              >
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
                <span>{isLiked ? 'Disukai' : 'Suka'}</span>
              </button>

              {/* Add to Playlist */}
              <button
                onClick={() => onOpenAddToPlaylistModal(currentTrack)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-card hover:bg-dark-highlight text-white text-xs font-semibold border border-white/10 transition-colors"
                title="Tambahkan ke Playlist"
              >
                <i className="fas fa-plus"></i>
                <span className="hidden sm:inline">Simpan</span>
              </button>

              {/* Download Offline */}
              <button
                onClick={() => onDownloadTrack(currentTrack)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isDownloaded 
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                    : 'bg-dark-card hover:bg-dark-highlight text-white border border-white/10'
                }`}
                title={isDownloaded ? "Tersimpan Offline" : "Download Audio"}
              >
                <i className={`fas ${isDownloaded ? 'fa-check' : 'fa-download'}`}></i>
                <span className="hidden sm:inline">{isDownloaded ? 'Tersimpan' : 'Unduh'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-card hover:bg-dark-highlight text-white text-xs font-semibold border border-white/10 transition-colors"
                title="Salin Link YouTube"
              >
                <i className={`fas ${copiedShare ? 'fa-check text-green-400' : 'fa-share'}`}></i>
                <span className="hidden sm:inline">{copiedShare ? 'Tersalin!' : 'Bagikan'}</span>
              </button>
            </div>
          </div>

          {/* Description Card */}
          {currentTrack.snippet.description && (
            <div className="bg-dark-card/60 border border-white/5 rounded-2xl p-4 text-xs">
              <p className={`text-dark-text leading-relaxed whitespace-pre-line ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                {currentTrack.snippet.description}
              </p>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-2 text-xs font-bold text-white hover:text-brand-red transition-colors inline-block"
              >
                {isDescriptionExpanded ? 'Tampilkan lebih sedikit' : '...lebih banyak'}
              </button>
            </div>
          )}

          {/* Tabs: Queue / Lyrics / Related Videos */}
          <div className="pt-2">
            <div className="flex items-center gap-4 border-b border-white/10 pb-2 mb-4">
              <button
                onClick={() => setActiveTab('queue')}
                className={`text-sm font-bold pb-2 transition-all relative ${
                  activeTab === 'queue' ? 'text-white' : 'text-dark-subtext hover:text-white'
                }`}
              >
                Berikutnya (Antrean)
                {activeTab === 'queue' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`text-sm font-bold pb-2 transition-all relative ${
                  activeTab === 'lyrics' ? 'text-white' : 'text-dark-subtext hover:text-white'
                }`}
              >
                Lirik Lagu
                {activeTab === 'lyrics' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('related')}
                className={`text-sm font-bold pb-2 transition-all relative ${
                  activeTab === 'related' ? 'text-white' : 'text-dark-subtext hover:text-white'
                }`}
              >
                Video Terkait
                {activeTab === 'related' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red rounded-full"></span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'queue' && (
              <div className="space-y-2">
                {playbackList.length > 0 ? (
                  playbackList.map((track, idx) => {
                    const isSelected = track.id.videoId === currentTrack.id.videoId;
                    return (
                      <div
                        key={`${track.id.videoId}-${idx}`}
                        onClick={() => {
                          onSelectTrack(track, playbackList);
                          scrollToTop();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-brand-red/15 border border-brand-red/30' 
                            : 'hover:bg-dark-highlight'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-xs font-mono w-4 text-center ${isSelected ? 'text-brand-red font-bold' : 'text-dark-subtext'}`}>
                            {idx + 1}
                          </span>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                            <img 
                              src={track.snippet?.thumbnails?.default?.url || fallbackThumb} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                            {isSelected && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-brand-red animate-ping"></span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-brand-red' : 'text-white'}`}>
                              {track.snippet.title}
                            </p>
                            <p className="text-[11px] text-dark-subtext truncate">
                              {track.snippet.channelTitle}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-brand-red px-2 py-0.5 rounded bg-brand-red/10 border border-brand-red/20">
                            Memutar
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-dark-subtext text-xs">
                    Antrean lagu kosong.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className="bg-dark-card/40 rounded-2xl p-4 border border-white/5">
                <LyricsView track={currentTrack} />
              </div>
            )}

            {activeTab === 'related' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isLoadingRelated ? (
                  <div className="col-span-full py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : relatedVideos.length > 0 ? (
                  relatedVideos.map((item) => (
                    <div
                      key={item.id.videoId}
                      onClick={() => {
                        onSelectTrack(item, relatedVideos);
                        scrollToTop();
                      }}
                      className="flex gap-2.5 p-2 rounded-xl hover:bg-dark-highlight cursor-pointer transition-colors group"
                    >
                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                        <img 
                          src={item.snippet?.thumbnails?.default?.url || fallbackThumb} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white line-clamp-2">
                          {item.snippet.title}
                        </p>
                        <p className="text-[11px] text-dark-subtext truncate mt-0.5">
                          {item.snippet.channelTitle}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full py-8 text-center text-dark-subtext text-xs">
                    Tidak ada video terkait yang ditemukan.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Up Next & Related Column (Desktop) */}
        {!isTheaterMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <i className="fas fa-play-circle text-brand-red"></i>
                <span>Berikutnya</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-subtext">Putar Otomatis</span>
                <button
                  onClick={onToggleAutoplay}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    isAutoplayEnabled ? 'bg-brand-red' : 'bg-dark-card'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isAutoplayEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* List of upcoming videos */}
            <div className="space-y-3">
              {(relatedVideos.length > 0 ? relatedVideos : recommendations).slice(0, 15).map((item) => {
                const isSelected = item.id.videoId === currentTrack.id.videoId;
                return (
                  <div
                    key={item.id.videoId}
                    onClick={() => {
                      onSelectTrack(item, relatedVideos.length > 0 ? relatedVideos : recommendations);
                      scrollToTop();
                    }}
                    className={`flex items-start gap-3 p-2 rounded-xl cursor-pointer group transition-all ${
                      isSelected ? 'bg-brand-red/15 border border-brand-red/30' : 'hover:bg-dark-highlight'
                    }`}
                  >
                    <div className="w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                      <img 
                        src={item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || fallbackThumb} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded">
                        HD
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isSelected ? 'text-brand-red' : 'text-white group-hover:text-brand-red'} transition-colors`}>
                        {item.snippet.title}
                      </p>
                      <p className="text-[11px] text-dark-subtext truncate mt-1">
                        {item.snippet.channelTitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
