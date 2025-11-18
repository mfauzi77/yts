
import type { VideoItem } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const API_KEYS = [
    'AIzaSyBujGAkfUSWrRBzKBg9QADZgMDRc2YdS2w', // Kunci utama
    'AIzaSyC7vsUuSEwOw1KFuWTpIHAn4WPI5F4EAa0'  // Kunci cadangan
];
let currentApiKeyIndex = 0;

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
    const apiKey = API_KEYS[currentApiKeyIndex];

    if (!apiKey) {
        currentApiKeyIndex = 0;
        throw new Error('Semua kunci API yang tersedia telah melebihi kuota harian. Silakan coba lagi besok.');
    }

    params.set('key', apiKey);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);

        if (response.ok) {
            return await response.json();
        }

        const errorData = await response.json();
        console.error('YouTube API Error:', JSON.stringify(errorData, null, 2));

        if (response.status === 403 || (response.status === 400 && errorData?.error?.message.includes('API key not valid'))) {
            const reason = response.status === 403 ? "kuota habis" : "tidak valid";
            console.warn(`Kunci API ke-${currentApiKeyIndex + 1} gagal (${reason}). Mencoba kunci berikutnya...`);
            
            currentApiKeyIndex++;
            params.delete('key');
            return fetchFromApiCore(endpoint, params);
        }

        // Gracefully handle invalid argument errors (e.g., for deleted videos or non-existent channels)
        if (response.status === 400 && errorData?.error?.status === 'INVALID_ARGUMENT') {
            console.warn('API returned 400 INVALID_ARGUMENT. Suppressing error and returning empty result.');
            return { items: [] };
        }

        const errorMessage = errorData.error?.message || 'Unknown API error';
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

const getPlaylistItems = async (playlistId: string, maxResults = 50, pageToken?: string): Promise<ApiResponse> => {
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
            kind: 'youtube#searchResult', // Mocking the structure
            etag: '', // Not provided in playlistItems
            id: {
                kind: 'youtube#video',
                videoId: item.snippet.resourceId.videoId,
            },
            snippet: {
                ...item.snippet,
                liveBroadcastContent: 'none', // Not provided, default to none
                publishTime: item.snippet.publishedAt,
            }
        }));

    return { items, nextPageToken: data.nextPageToken };
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
