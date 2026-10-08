// YTS YouTube Service - v1.0.1 (Fix: Deprecated relatedToVideoId)
import type { VideoItem, YouTubePlaylist } from '../types';

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
        const paramsObj = Object.fromEntries(params.entries());
        if (paramsObj.key) paramsObj.key = '***';
        console.log(`[YouTube API Call]: ${endpoint}`, paramsObj);

        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);


        if (response.ok) {
            return await response.json();
        }

        const errorData = await response.json();

        // Handle Key Rotation (403 or 400 with invalid key message)
        if (response.status === 403 || (response.status === 400 && errorData?.error?.message?.includes('API key not valid'))) {
            const reason = response.status === 403 ? "kuota habis" : "tidak valid";
            console.warn(`Kunci API ke-${currentApiKeyIndex + 1} gagal (${reason}). Mencoba kunci berikutnya...`);
            
            currentApiKeyIndex++;
            params.delete('key');
            return fetchFromApiCore(endpoint, params);
        }

        // Gracefully handle invalid argument errors (e.g., for deleted videos or non-existent channels)
        if (response.status === 400 && errorData?.error?.status === 'INVALID_ARGUMENT') {
            console.warn(`API returned 400 INVALID_ARGUMENT for endpoint ${endpoint}. Suppressing error and returning empty result.`);
            return { items: [] };
        }

        // Only log actual unhandled errors to the console
        console.error('YouTube API Error:', JSON.stringify(errorData, null, 2));

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

export const getRelatedVideos = async (videoId: string, fallbackTitle?: string): Promise<VideoItem[]> => {
    if (typeof videoId !== 'string' || !videoId.trim()) {
        console.warn('getRelatedVideos called with an invalid videoId:', videoId);
        return [];
    }
    
    // Note: relatedToVideoId has been deprecated by Google as of Aug 2023.
    // We now use the video title or video ID as a search query to find related content.
    const query = fallbackTitle || videoId;
    
    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '25',
    });
    
    // If it's a title, we might want to exclude the original video from results manually if possible,
    // though the search API usually handles relevance well.
    const data = await fetchFromApiCore('/search', params);
    const items = (data.items && Array.isArray(data.items))
        ? data.items.filter(item => item.id && typeof item.id.videoId === 'string' && item.id.videoId !== videoId)
        : [];
    return items;
};


const channelUploadsCache = new Map<string, string>();

const getChannelUploadsPlaylistId = async (channelId: string): Promise<string | null> => {
    if (channelUploadsCache.has(channelId)) {
        return channelUploadsCache.get(channelId)!;
    }
    const params = new URLSearchParams({
        part: 'contentDetails',
        id: channelId,
    });
    const data = await fetchFromApiCore('/channels', params);
    const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
    if (uploadsId) {
        channelUploadsCache.set(channelId, uploadsId);
    }
    return uploadsId;
};

export const getPlaylistItems = async (playlistId: string, maxResults = 50, pageToken?: string): Promise<ApiResponse> => {
    if (!playlistId || typeof playlistId !== 'string') {
        console.warn('getPlaylistItems called with invalid playlistId:', playlistId);
        return { items: [], nextPageToken: undefined };
    }

    const params = new URLSearchParams({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: String(maxResults),
    });
    if (pageToken) {
        params.set('pageToken', pageToken);
    }
    const data: PlaylistApiResponse = await fetchFromApiCore('/playlistItems', params);
    
    // Transform PlaylistItem to VideoItem structure and guard against deleted/private videos
    const fallbackImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=60';

    const items: VideoItem[] = (data.items || [])
        .filter(item => {
            const snip = item.snippet;
            if (!snip || !snip.resourceId || !snip.resourceId.videoId) return false;
            // Exclude private or deleted videos from playlist display
            const title = snip.title || '';
            if (title === 'Private video' || title === 'Deleted video') return false;
            return true;
        })
        .map(item => {
            const snip = item.snippet;
            const thumbUrl = snip.thumbnails?.default?.url 
                || snip.thumbnails?.medium?.url 
                || snip.thumbnails?.high?.url 
                || fallbackImage;

            return {
                kind: 'youtube#searchResult',
                etag: '',
                id: {
                    kind: 'youtube#video',
                    videoId: snip.resourceId.videoId,
                },
                snippet: {
                    publishedAt: snip.publishedAt || new Date().toISOString(),
                    channelId: snip.channelId || '',
                    title: snip.title || 'Lagu tanpa judul',
                    description: snip.description || '',
                    thumbnails: {
                        default: { url: thumbUrl, width: 120, height: 90 },
                        medium: snip.thumbnails?.medium || { url: thumbUrl, width: 320, height: 180 },
                        high: snip.thumbnails?.high || { url: thumbUrl, width: 480, height: 360 },
                    },
                    channelTitle: snip.channelTitle || 'Artis',
                    liveBroadcastContent: 'none',
                    publishTime: snip.publishedAt || new Date().toISOString(),
                }
            };
        });

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
    
    const fallbackImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=60';

    const items: YouTubePlaylist[] = (data.items || [])
        .filter((item: any) => item && item.id && item.snippet)
        .map((item: any) => {
            const snip = item.snippet;
            const thumbUrl = snip.thumbnails?.default?.url 
                || snip.thumbnails?.medium?.url 
                || snip.thumbnails?.high?.url 
                || fallbackImage;

            return {
                ...item,
                snippet: {
                    ...snip,
                    title: snip.title || 'Playlist',
                    thumbnails: {
                        default: { url: thumbUrl, width: 120, height: 90 },
                        medium: snip.thumbnails?.medium || { url: thumbUrl, width: 320, height: 180 },
                        high: snip.thumbnails?.high || { url: thumbUrl, width: 480, height: 360 },
                    }
                },
                contentDetails: {
                    itemCount: item.contentDetails?.itemCount ?? 0
                }
            };
        });

    return { 
        items, 
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
