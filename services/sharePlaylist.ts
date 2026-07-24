import type { Playlist, VideoItem } from '../types';

const BASE_URL = 'https://yts-lovat.vercel.app';
const SHARE_PARAM = 'share';

// Versi minimal VideoItem yang disimpan di URL (kurangi ukuran)
// th (thumbnail) TIDAK disimpan — direkonstruksi dari videoId
interface MiniTrack {
  v: string;   // videoId
  t: string;   // title
  c: string;   // channelTitle
  ci: string;  // channelId
}

interface SharePayload {
  n: string;         // playlist name
  t: MiniTrack[];    // tracks
}

function toMini(track: VideoItem): MiniTrack {
  return {
    v: track.id.videoId,
    t: track.snippet.title,
    c: track.snippet.channelTitle,
    ci: track.snippet.channelId,
  };
}

function fromMini(mini: MiniTrack): VideoItem {
  const thumbUrl = `https://i.ytimg.com/vi/${mini.v}/default.jpg`;
  const mediumUrl = `https://i.ytimg.com/vi/${mini.v}/mqdefault.jpg`;
  return {
    kind: 'youtube#searchResult',
    etag: '',
    id: { kind: 'youtube#video', videoId: mini.v },
    snippet: {
      publishedAt: '',
      channelId: mini.ci,
      title: mini.t,
      description: '',
      thumbnails: {
        default: { url: thumbUrl, width: 120, height: 90 },
        medium: { url: mediumUrl, width: 320, height: 180 },
        high: { url: mediumUrl, width: 480, height: 360 },
      },
      channelTitle: mini.c,
      liveBroadcastContent: 'none',
      publishTime: '',
    },
  };
}

export function encodePlaylistToUrl(playlist: Playlist): string {
  const payload: SharePayload = {
    n: playlist.name,
    t: playlist.tracks.map(toMini),
  };
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `${BASE_URL}/?${SHARE_PARAM}=${encoded}`;
}

export function decodePlaylistFromUrl(encoded: string): Playlist | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload: SharePayload = JSON.parse(json);
    if (!payload.n || !Array.isArray(payload.t)) return null;
    return {
      id: `shared-${Date.now()}`,
      name: payload.n,
      tracks: payload.t.map(fromMini),
    };
  } catch {
    return null;
  }
}

export function getSharedPlaylistFromCurrentUrl(): Playlist | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(SHARE_PARAM);
  if (!encoded) return null;
  return decodePlaylistFromUrl(encoded);
}

export function clearShareParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState({}, '', url.toString());
}
