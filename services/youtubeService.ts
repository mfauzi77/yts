
import type { VideoItem, YouTubePlaylist } from '../types';

const BASE_URL = '/api/youtube';

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
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
        const contentType = response.headers.get("content-type");
        
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response from server:', text.substring(0, 200));
            throw new Error('Server mengembalikan format yang tidak valid (HTML). Pastikan API berjalan dengan benar.');
        }

        if (response.ok) {
            return data;
        }

        // Handle errors from our proxy
        const errorMessage = data.error?.message || data.message || 'Unknown error';

        // Handle quota exhaustion (passed through from server)
        if (response.status === 403 || errorMessage.includes('kuota harian')) {
            throw new Error('Semua kunci API yang tersedia telah melebihi kuota harian. Silakan coba lagi besok.');
        }

        // Handle configuration error
        if (errorMessage.includes('not configured')) {
            throw new Error('Kunci API YouTube belum dikonfigurasi di server. Silakan hubungi admin.');
        }

        // Gracefully handle invalid argument errors (e.g., for deleted videos or non-existent channels)
        if (response.status === 400 && (data.error?.status === 'INVALID_ARGUMENT' || errorMessage.includes('INVALID_ARGUMENT'))) {
            console.warn(`API returned 400 INVALID_ARGUMENT for endpoint ${endpoint}. Suppressing error and returning empty result.`);
            return { items: [] };
        }

        // Only log actual unhandled errors to the console
        console.error('YouTube Proxy Error:', JSON.stringify(data, null, 2));

        throw new Error(`Permintaan API YouTube gagal (${response.status}): ${errorMessage}`);

    } catch (error) {
        console.error("Gagal melakukan fetch:", error);
        if (error instanceof Error) {
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
