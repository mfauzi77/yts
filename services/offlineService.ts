import { get, set, del, createStore } from 'idb-keyval';
import type { VideoItem } from '../types';

// Custom store for audio blobs (large data)
const audioStore = createStore('yts-audio-db', 'audio-blobs');
// Custom store for track metadata
const metaStore = createStore('yts-audio-db', 'audio-meta');

export interface OfflineTrackMeta extends VideoItem {
  downloadedAt: number;
  size: number;        // bytes
  mimeType: string;
}

/**
 * Simpan audio blob dan metadata ke IndexedDB.
 */
export const saveTrackOffline = async (
  track: VideoItem,
  blob: Blob
): Promise<void> => {
  const videoId = track.id.videoId;
  const meta: OfflineTrackMeta = {
    ...track,
    downloadedAt: Date.now(),
    size: blob.size,
    mimeType: blob.type,
  };
  await set(videoId, blob, audioStore);
  await set(videoId, meta, metaStore);
};

/**
 * Ambil audio blob dari IndexedDB. Return null jika belum ada.
 */
export const getTrackAudioBlob = async (videoId: string): Promise<Blob | null> => {
  const blob = await get<Blob>(videoId, audioStore);
  return blob ?? null;
};

/**
 * Ambil URL blob siap pakai untuk elemen <audio>.
 * Caller bertanggung jawab memanggil URL.revokeObjectURL() setelah selesai.
 */
export const getTrackBlobUrl = async (videoId: string): Promise<string | null> => {
  const blob = await getTrackAudioBlob(videoId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

/**
 * Ambil metadata semua lagu yang sudah didownload.
 */
export const getAllOfflineMetadata = async (): Promise<OfflineTrackMeta[]> => {
  // idb-keyval doesn't have a built-in getAll with custom store,
  // so we iterate using the entries() approach.
  const { entries } = await import('idb-keyval');
  const all = await entries<string, OfflineTrackMeta>(metaStore);
  return all.map(([, v]) => v).sort((a, b) => b.downloadedAt - a.downloadedAt);
};

/**
 * Cek apakah sebuah video sudah tersimpan offline.
 */
export const isTrackOffline = async (videoId: string): Promise<boolean> => {
  const blob = await get<Blob>(videoId, audioStore);
  return !!blob;
};

/**
 * Hapus audio blob dan metadata dari IndexedDB.
 */
export const removeTrackOffline = async (videoId: string): Promise<void> => {
  await del(videoId, audioStore);
  await del(videoId, metaStore);
};

/**
 * Download audio dari server, simpan ke IndexedDB, dan kembalikan blob.
 * Callback onProgress dipanggil dengan nilai 0-100.
 */
export const downloadTrackAudio = async (
  track: VideoItem,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const videoId = track.id.videoId;
  const response = await fetch(`/api/audio/${videoId}`);

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData?.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength) : 0;
  const reader = response.body!.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0 && onProgress) {
      onProgress(Math.min(99, Math.round((received / total) * 100)));
    }
  }

  const mimeType = response.headers.get('Content-Type') || 'audio/webm';
  const blob = new Blob(chunks, { type: mimeType });
  await saveTrackOffline(track, blob);
  onProgress?.(100);
};
