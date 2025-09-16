import type { VideoItem } from '../types';

const API_KEY = 'AIzaSyC7vsUuSEwOw1KFuWTpIHAn4WPI5F4EAa0';
const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

export const searchVideos = async (query: string): Promise<VideoItem[]> => {
  if (!API_KEY) {
    throw new Error("YouTube API key is not configured.");
  }
  
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '25',
    key: API_KEY,
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('YouTube API Error:', errorData);
    throw new Error(`API request failed with status ${response.status}: ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.items;
};
