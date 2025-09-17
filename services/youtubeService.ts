import type { VideoItem } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

const API_KEYS = [
    'AIzaSyBujGAkfUSWrRBzKBg9QADZgMDRc2YdS2w', // Kunci utama
    'AIzaSyC7vsUuSEwOw1KFuWTpIHAn4WPI5F4EAa0'  // Kunci cadangan
];
let currentApiKeyIndex = 0;

const fetchFromApi = async (params: URLSearchParams): Promise<VideoItem[]> => {
    const apiKey = API_KEYS[currentApiKeyIndex];

    if (!apiKey) {
        currentApiKeyIndex = 0; // Reset index untuk permintaan berikutnya
        throw new Error('Semua kunci API yang tersedia telah melebihi kuota harian. Silakan coba lagi besok.');
    }

    params.set('key', apiKey);

    try {
        const response = await fetch(`${BASE_URL}?${params.toString()}`);

        if (response.ok) {
            const data = await response.json();
            return data.items;
        }

        const errorData = await response.json();
        console.error('YouTube API Error:', errorData);

        // Jika kuota habis atau kunci tidak valid, coba kunci berikutnya
        if (response.status === 403 || (response.status === 400 && errorData?.error?.message.includes('API key not valid'))) {
            const reason = response.status === 403 ? "kuota habis" : "tidak valid";
            console.warn(`Kunci API ke-${currentApiKeyIndex + 1} gagal (${reason}). Mencoba kunci berikutnya...`);
            
            currentApiKeyIndex++;
            params.delete('key'); // Hapus kunci lama sebelum mencoba lagi
            return fetchFromApi(params); // Panggilan rekursif untuk mencoba kunci berikutnya
        }

        // Untuk galat API spesifik lainnya
        throw new Error(`Permintaan API YouTube gagal dengan status ${response.status}: ${errorData.error.message}`);

    } catch (error) {
        console.error("Gagal melakukan fetch:", error);
        // Jika ini adalah salah satu galat spesifik kita, lempar kembali. Jika tidak, lempar galat jaringan umum.
        if (error instanceof Error && (error.message.startsWith('Permintaan API') || error.message.startsWith('Semua kunci API'))) {
            throw error;
        }
        throw new Error("Tidak dapat terhubung ke layanan YouTube. Periksa koneksi internet Anda.");
    }
};


export const searchVideos = async (query: string): Promise<VideoItem[]> => {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '25',
  });
  return fetchFromApi(params);
};

export const getRelatedVideos = async (videoId: string): Promise<VideoItem[]> => {
    const params = new URLSearchParams({
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults: '25',
    });
    return fetchFromApi(params);
};

export const getChannelVideos = async (channelId: string): Promise<VideoItem[]> => {
    const params = new URLSearchParams({
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: '50',
    });
    return fetchFromApi(params);
};