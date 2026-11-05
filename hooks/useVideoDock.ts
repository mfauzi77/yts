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
    if (isFs) {
      return;
    }

    // 1. Audio mode or no active track -> Hide off-screen
    if (!isVideoMode || !currentTrack) {
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
      return;
    }

    // 2. Video mode active: Find target viewport slot in DOM
    let targetSlot: HTMLElement | null = null;
    let modeClass = 'video-docked';

    if (isNowPlayingViewOpen) {
      targetSlot = document.getElementById('yt-modal-video-slot');
      modeClass = 'video-modal-docked';
    } else if (activeView === 'video') {
      targetSlot = document.getElementById('yt-main-video-slot') || document.getElementById('yt-pip-video-slot');
      modeClass = targetSlot?.id === 'yt-main-video-slot' ? 'video-docked' : 'video-pip-docked';
    } else {
      // User is on another page (home, playlists, channel, etc.) while Video Mode is active:
      // Dock into Picture-in-Picture floating slot
      targetSlot = document.getElementById('yt-pip-video-slot');
      modeClass = 'video-pip-docked';
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
        return;
      }
    }

    // Fallback: If in video mode but slot not rendered yet, hide momentarily
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
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
