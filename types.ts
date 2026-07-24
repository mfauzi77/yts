
export interface VideoItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
    thumbnailData?: string; // Base64 encoded thumbnail for offline use
  };
}

export interface Playlist {
  id: string;
  name: string;
  tracks: VideoItem[];
}

export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: VideoItem['snippet']['thumbnails'];
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    itemCount: number;
  };
}
