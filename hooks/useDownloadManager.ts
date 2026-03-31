import { useState, useCallback, useEffect } from 'react';
import { downloadTrackAudio, isTrackOffline, removeTrackOffline } from '../services/offlineService';
import type { VideoItem } from '../types';

export type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

export interface TrackDownloadState {
  status: DownloadStatus;
  progress: number; // 0-100
  error?: string;
}

export const useDownloadManager = () => {
  const [downloads, setDownloads] = useState<Record<string, TrackDownloadState>>({});
  // Set of videoIds that are confirmed saved in IndexedDB
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  /**
   * Inisialisasi: cek semua lagu di IndexedDB (panggil sekali setelah mount)
   * Mengisi savedIds dari DB agar UI bisa langsung tahu mana yang sudah ada.
   */
  const refreshSavedIds = useCallback(async (videoIds: string[]) => {
    const checks = await Promise.all(
      videoIds.map(async (id) => ({ id, saved: await isTrackOffline(id) }))
    );
    setSavedIds(new Set(checks.filter((c) => c.saved).map((c) => c.id)));
  }, []);

  const markSaved = useCallback((videoId: string) => {
    setSavedIds((prev) => new Set([...prev, videoId]));
  }, []);

  const unmarkSaved = useCallback((videoId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(videoId);
      return next;
    });
  }, []);

  /**
   * Mulai mengunduh satu lagu.
   */
  const downloadTrack = useCallback(async (track: VideoItem) => {
    const videoId = track.id.videoId;

    // Jangan unduh ulang jika sudah ada
    if (savedIds.has(videoId)) return;
    if (downloads[videoId]?.status === 'downloading') return;

    setDownloads((prev) => ({
      ...prev,
      [videoId]: { status: 'downloading', progress: 0 },
    }));

    try {
      await downloadTrackAudio(track, (percent) => {
        setDownloads((prev) => ({
          ...prev,
          [videoId]: { status: 'downloading', progress: percent },
        }));
      });

      setDownloads((prev) => ({
        ...prev,
        [videoId]: { status: 'done', progress: 100 },
      }));
      markSaved(videoId);
    } catch (err: any) {
      setDownloads((prev) => ({
        ...prev,
        [videoId]: {
          status: 'error',
          progress: 0,
          error: err?.message || 'Gagal mengunduh',
        },
      }));
    }
  }, [downloads, savedIds, markSaved]);

  /**
   * Hapus lagu yang sudah tersimpan.
   */
  const deleteOfflineTrack = useCallback(async (videoId: string) => {
    await removeTrackOffline(videoId);
    unmarkSaved(videoId);
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });
  }, [unmarkSaved]);

  const getDownloadState = useCallback(
    (videoId: string): TrackDownloadState => {
      if (savedIds.has(videoId)) return { status: 'done', progress: 100 };
      return downloads[videoId] ?? { status: 'idle', progress: 0 };
    },
    [downloads, savedIds]
  );

  return {
    downloadTrack,
    deleteOfflineTrack,
    getDownloadState,
    savedIds,
    refreshSavedIds,
  };
};
