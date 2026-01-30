import React, { useEffect, useState } from 'react';
import { searchVideos } from '../services/youtubeService';
import type { VideoItem } from '../types';

interface VideoFeedProps {
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
}

const MusicCard: React.FC<{
    item: VideoItem;
    onSelectTrack: () => void;
    onOpenAddToPlaylistModal: () => void;
    onSelectChannel: () => void;
    isOffline: boolean;
    onAddToOffline: () => void;
    isPlaying: boolean;
}> = ({ item, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, isOffline, onAddToOffline, isPlaying }) => (
    <div className="group relative bg-dark-card rounded-lg overflow-hidden hover:bg-dark-surface transition-all duration-300 hover:shadow-xl">
        <div className="aspect-square relative cursor-pointer" onClick={onSelectTrack}>
            <img
                src={item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <div className="w-12 h-12 bg-brand-red/90 rounded-full flex items-center justify-center shadow-lg">
                    <i className="fas fa-play text-white ml-1"></i>
                 </div>
            </div>
        </div>

        <div className="p-3">
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                    <h3 
                        className={`font-semibold text-sm line-clamp-2 cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'}`}
                        onClick={onSelectTrack}
                    >
                        {item.snippet.title}
                    </h3>
                    <p 
                        className="text-xs text-dark-subtext mt-1 cursor-pointer hover:text-white hover:underline"
                        onClick={onSelectChannel}
                    >
                        {item.snippet.channelTitle}
                    </p>
                </div>
                
                <div className="flex flex-col gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenAddToPlaylistModal(); }}
                        className="p-1.5 rounded-full text-dark-subtext hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                     <button
                        onClick={(e) => { e.stopPropagation(); onAddToOffline(); }}
                        className={`p-1.5 rounded-full transition-colors ${isOffline ? 'text-green-500' : 'text-dark-subtext hover:text-white hover:bg-white/10'}`}
                    >
                        <i className={`fas ${isOffline ? 'fa-check-circle' : 'fa-cloud-download-alt'}`}></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
    onSelectTrack, 
    onOpenAddToPlaylistModal, 
    onSelectChannel, 
    offlineItems, 
    onAddToOffline, 
    currentTrackId 
}) => {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            setIsLoading(true);
            try {
                const results = await searchVideos('official audio music');
                setVideos(results.sort(() => 0.5 - Math.random()));
            } catch (err) {
                console.error("Failed to fetch music feed", err);
                setError("Gagal memuat daftar musik.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-dark-subtext">
                <i className="fas fa-exclamation-circle text-4xl mb-4"></i>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex items-center gap-2 text-dark-subtext">
                <i className="fas fa-music text-brand-red"></i>
                <span className="font-semibold text-sm uppercase tracking-wider">Lagu Populer</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos.map(item => (
                    <MusicCard
                        key={item.id.videoId}
                        item={item}
                        onSelectTrack={() => onSelectTrack(item, videos)}
                        onOpenAddToPlaylistModal={() => onOpenAddToPlaylistModal(item)}
                        onSelectChannel={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
                        isOffline={offlineItems.some(o => o.id.videoId === item.id.videoId)}
                        onAddToOffline={() => onAddToOffline(item)}
                        isPlaying={currentTrackId === item.id.videoId}
                    />
                ))}
            </div>
        </div>
    );
};