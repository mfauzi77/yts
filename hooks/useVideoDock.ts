import { useEffect, useCallback } from 'react';
import type { MainView, VideoItem } from '../types';

interface UseVideoDockProps {
  isVideoMode: boolean;
  activeView: MainView;
  isNowPlayingViewOpen: boolean;
  currentTrack: VideoItem | null;
}

/**
 * useVideoDock
 * Keeps the persistent #player-container in DOM without re-parenting (which would reload the iframe),
 * and dynamically docks it over the active video viewport (YouTubeWatchView, NowPlaying modal, or PiP miniplayer)
 * with pixel-perfect alignment.
 */
export const useVideoDock = ({
  isVideoMode,
  activeView,
  isNowPlayingViewOpen,
  currentTrack,
}: UseVideoDockProps) => {

  const updatePosition = useCallback(() => {
    const container = document.getElementById('player-container');
    if (!container) return;

    // If currently in Fullscreen, preserve fullscreen dimensions and do not reposition
    const isFs = container.classList.contains('video-fullscreen') || !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
    const hotspotBtn = document.getElementById('yt-video-fullscreen-btn');

    if (isFs) {
      if (hotspotBtn) {
        hotspotBtn.style.display = 'flex';
        hotspotBtn.style.top = `${window.innerHeight - 56}px`;
        hotspotBtn.style.left = `${window.innerWidth - 60}px`;
        hotspotBtn.style.zIndex = '100000';
        hotspotBtn.innerHTML = '<i class="fas fa-compress"></i>';
        hotspotBtn.title = 'Keluar Layar Penuh';
      }
      return;
    }

    // 1. Mode Audio / Beranda biasa / tanpa track aktif -> Sembunyikan off-screen sepenuhnya tanpa pernah muncul di pojok
    if (!isVideoMode || !currentTrack || (activeView !== 'video' && !isNowPlayingViewOpen)) {
      container.className = 'audio-mode';
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.visibility = 'hidden';
      container.style.zIndex = '-999';
      if (hotspotBtn) {
        hotspotBtn.style.display = 'none';
      }
      return;
    }

    // 2. Mode Video aktif: Hanya tempelkan di slot video utama atau modal layar penuh
    let targetSlot: HTMLElement | null = null;
    let modeClass = 'video-docked';

    if (isNowPlayingViewOpen) {
      targetSlot = document.getElementById('yt-modal-video-slot');
      modeClass = 'video-modal-docked';
    } else if (activeView === 'video') {
      targetSlot = document.getElementById('yt-main-video-slot');
      modeClass = 'video-docked';
    }

    if (targetSlot) {
      const rect = targetSlot.getBoundingClientRect();
      
      // Ensure element is visible on screen
      if (rect.width > 20 && rect.height > 20) {
        container.className = modeClass;
        container.style.position = 'fixed';
        container.style.top = `${Math.round(rect.top)}px`;
        container.style.left = `${Math.round(rect.left)}px`;
        container.style.width = `${Math.round(rect.width)}px`;
        container.style.height = `${Math.round(rect.height)}px`;
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
        container.style.visibility = 'visible';
        container.style.borderRadius = window.getComputedStyle(targetSlot).borderRadius || '16px';
        container.style.overflow = 'hidden';
        container.style.zIndex = isNowPlayingViewOpen ? '60' : (activeView === 'video' ? '30' : '45');

        // Posisikan tombol layar penuh persis di sudut kanan bawah video player (tepat di atas tombol fullscreen YouTube)
        if (hotspotBtn) {
          if (isVideoMode && activeView === 'video' && targetSlot.id === 'yt-main-video-slot') {
            hotspotBtn.style.display = 'flex';
            hotspotBtn.style.top = `${Math.round(rect.bottom - 50)}px`;
            hotspotBtn.style.left = `${Math.round(rect.right - 54)}px`;
            hotspotBtn.style.width = '52px';
            hotspotBtn.style.height = '48px';
            hotspotBtn.style.zIndex = '35'; // Lebih tinggi dari player-container (30)
            hotspotBtn.innerHTML = '<i class="fas fa-expand"></i>';
            hotspotBtn.title = 'Layar Penuh';
          } else {
            hotspotBtn.style.display = 'none';
          }
        }

        return;
      }
    }

    // Fallback: If in video mode but slot not rendered yet, hide momentarily
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    if (hotspotBtn) {
      hotspotBtn.style.display = 'none';
    }
  }, [isVideoMode, activeView, isNowPlayingViewOpen, currentTrack]);

  useEffect(() => {
    updatePosition();

    // High performance tracking on scroll and resize
    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };

    const handleResize = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', handleResize);

    // Also observe DOM changes / layout shifts
    const interval = setInterval(updatePosition, 300);

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as any);
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [updatePosition]);

  return { updatePosition };
};
