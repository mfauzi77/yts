
import type { VideoItem, YouTubePlaylist } from '../types';

const BASE_URL = '/api/youtube';

let appPin: string | null = null;

export const setAppPin = (pin: string) => {
  appPin = pin;
};

export const verifyPinOnServer = async (pin: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-pin': pin
      }
    });
    return response.ok;
  } catch (error) {
    console.error('PIN verification failed:', error);
    return false;
  }
};

interface ApiResponse {
    items: VideoItem[];
    nextPageToken?: string;
}

interface PlaylistApiResponse {
    items: PlaylistItem[];
    nextPageToken?: string;
}

interface PlaylistItem {
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: VideoItem['snippet']['thumbnails'];
    channelTitle: string;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

const fetchFromApiCore = async (endpoint: string, params: URLSearchParams): Promise<any> => {
    try {
        const headers: HeadersInit = {};
        if (appPin) {
            headers['x-app-pin'] = appPin;
        }

        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`, {
            headers
        });

        if (response.ok) {
            return await response.json();
        }

        const errorData = await response.json();

        // Gracefully handle invalid argument errors (e.g., for deleted videos or non-existent channels)
        if (response.status === 400 && errorData?.error?.status === 'INVALID_ARGUMENT') {
            console.warn(`API returned 400 INVALID_ARGUMENT for endpoint ${endpoint}. Suppressing error and returning empty result.`);
            return { items: [] };
        }

        // Handle quota exhaustion (passed through from server)
        if (response.status === 403) {
            throw new Error('Semua kunci API yang tersedia telah melebihi kuota harian. Silakan coba lagi besok.');
        }

        // Handle invalid PIN
        if (response.status === 401) {
            throw new Error('PIN Akses tidak valid. Silakan muat ulang halaman dan coba lagi.');
        }

        // Only log actual unhandled errors to the console
        console.error('YouTube Proxy Error:', JSON.stringify(errorData, null, 2));

        const errorMessage = errorData.error?.message || 'Unknown Proxy error';
        throw new Error(`Permintaan API YouTube gagal dengan status ${response.status}: ${errorMessage}`);

    } catch (error) {
        console.error("Gagal melakukan fetch:", error);
        if (error instanceof Error && (error.message.startsWith('Permintaan API') || error.message.startsWith('Semua kunci API'))) {
            throw error;
        }
        throw new Error("Tidak dapat terhubung ke layanan YouTube. Periksa koneksi internet Anda.");
    }
};

export const searchVideos = async (query: string): Promise<VideoItem[]> => {
  if (typeof query !== 'string' || !query.trim()) {
    console.warn('searchVideos called with an invalid query:', query);
    return [];
  }
  const params = new URLSearchParams({
    part: 'snippet',
    q: query.trim(),
    type: 'video',
    maxResults: '25',
  });
  const data = await fetchFromApiCore('/search', params);
  const items = (data.items && Array.isArray(data.items))
      ? data.items.filter(item => item.id && typeof item.id.videoId === 'string' && item.id.videoId)
      : [];
  return items;
};

export const getRelatedVideos = async (videoId: string): Promise<VideoItem[]> => {
    if (typeof videoId !== 'string' || !videoId.trim()) {
        console.warn('getRelatedVideos called with an invalid videoId:', videoId);
        return [];
    }
    const params = new URLSearchParams({
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults: '25',
    });
    const data = await fetchFromApiCore('/search', params);
    const items = (data.items && Array.isArray(data.items))
        ? data.items.filter(item => item.id && typeof item.id.videoId === 'string' && item.id.videoId)
        : [];
    return items;
};

const getChannelUploadsPlaylistId = async (channelId: string): Promise<string | null> => {
    const params = new URLSearchParams({
        part: 'contentDetails',
        id: channelId,
    });
    const data = await fetchFromApiCore('/channels', params);
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
};

export const getPlaylistItems = async (playlistId: string, maxResults = 50, pageToken?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: String(maxResults),
    });
    if (pageToken) {
        params.set('pageToken', pageToken);
    }
    const data: PlaylistApiResponse = await fetchFromApiCore('/playlistItems', params);
    
    // Transform PlaylistItem to VideoItem structure
    const items: VideoItem[] = (data.items || [])
        .filter(item => item.snippet?.resourceId?.videoId)
        .map(item => ({
            kind: 'youtube#searchResult',
            etag: '',
            id: {
                kind: 'youtube#video',
                videoId: item.snippet.resourceId.videoId,
            },
            snippet: {
                publishedAt: item.snippet.publishedAt || new Date().toISOString(),
                channelId: item.snippet.channelId || '',
                title: item.snippet.title || 'Unknown Title',
                description: item.snippet.description || '',
                thumbnails: item.snippet.thumbnails || {
                    default: { url: 'https://picsum.photos/seed/music/200/200', width: 120, height: 90 },
                    medium: { url: 'https://picsum.photos/seed/music/200/200', width: 320, height: 180 },
                    high: { url: 'https://picsum.photos/seed/music/200/200', width: 480, height: 360 }
                },
                channelTitle: item.snippet.channelTitle || 'Unknown Channel',
                liveBroadcastContent: 'none',
                publishTime: item.snippet.publishedAt || new Date().toISOString(),
            }
        }));

    return { items, nextPageToken: data.nextPageToken };
};

export const getChannelPlaylists = async (channelId: string, maxResults = 50, pageToken?: string): Promise<{ items: YouTubePlaylist[], nextPageToken?: string }> => {
    if (typeof channelId !== 'string' || !channelId.trim()) {
        console.warn('getChannelPlaylists called with an invalid channelId:', channelId);
        return { items: [], nextPageToken: undefined };
    }

    const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        channelId: channelId,
        maxResults: String(maxResults),
    });
    if (pageToken) {
        params.set('pageToken', pageToken);
    }
    const data = await fetchFromApiCore('/playlists', params);
    return { 
        items: data.items || [], 
        nextPageToken: data.nextPageToken 
    };
};

export const getChannelVideos = async (channelId: string, _order: 'date' | 'viewCount' = 'date', maxResults = 50, pageToken?: string): Promise<ApiResponse> => {
    if (typeof channelId !== 'string' || !channelId.trim()) {
        console.warn('getChannelVideos called with an invalid channelId:', channelId);
        return { items: [], nextPageToken: undefined };
    }

    // The first request for a channel (no pageToken) should get the playlist ID.
    // Subsequent requests will pass the pageToken but we need the playlist ID again.
    // A better implementation might cache the playlistId, but this is more straightforward.
    const uploadsPlaylistId = await getChannelUploadsPlaylistId(channelId);

    if (!uploadsPlaylistId) {
        throw new Error("Tidak dapat menemukan playlist unggahan untuk channel ini.");
    }
    
    return getPlaylistItems(uploadsPlaylistId, maxResults, pageToken);
};
