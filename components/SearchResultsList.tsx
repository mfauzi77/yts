import React from 'react';
import type { VideoItem } from '../types';

interface SearchResultListProps {
  results: VideoItem[];
  isLoading: boolean;
  onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
  onAddToPlaylist: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  playlist: VideoItem[];
  viewType: 'search' | 'recommendations';
  onGenerateDiscoveryMix: () => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
}

const SearchResultItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList?: VideoItem[]) => void;
    onAddToPlaylist: (track: VideoItem) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isInPlaylist: boolean;
    isOffline: boolean;
    onAddToOffline: (track: VideoItem) => void;
    isPlaying: boolean;
    contextList: VideoItem[];
}> = ({ item, onSelectTrack, onAddToPlaylist, onSelectChannel, isInPlaylist, isOffline, onAddToOffline, isPlaying, contextList }) => (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="relative w-12 h-12">
            <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-full h-full rounded-md object-cover"
            />
             <button
                onClick={() => onSelectTrack(item, contextList)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                aria-label={`Putar ${item.snippet.title}`}
            >
                <i className="fas fa-play text-white text-lg"></i>
            </button>
        </div>
        <div className="min-w-0">
            <p 
                onClick={() => onSelectTrack(item, contextList)}
                className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`}>
                {item.snippet.title}
            </p>
            <p 
                className="text-xs text-dark-subtext cursor-pointer hover:underline"
                onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
            >
                {item.snippet.channelTitle}
            </p>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => onAddToOffline(item)}
                disabled={isOffline}
                className={`p-2 w-10 rounded-full transition-colors duration-200 ${
                    isOffline ? 'text-green-500' : 'text-dark-subtext hover:text-white'
                }`}
                title={isOffline ? "Disimpan offline" : "Simpan untuk offline"}
            >
                <i className={`fas ${isOffline ? 'fa-check-circle' : 'fa-cloud-download-alt'}`}></i>
            </button>
            <button
                onClick={() => onAddToPlaylist(item)}
                disabled={isInPlaylist}
                className={`p-2 w-10 rounded-full transition-colors duration-200 ${
                    isInPlaylist ? 'text-green-500' : 'text-dark-subtext hover:text-white'
                }`}
                title={isInPlaylist ? "Ditambahkan ke playlist" : "Tambahkan ke playlist"}
            >
                <i className={`fas ${isInPlaylist ? 'fa-check' : 'fa-plus'}`}></i>
            </button>
        </div>
    </div>
);


export const SearchResultList: React.FC<SearchResultListProps> = ({ results, isLoading, onSelectTrack, onAddToPlaylist, onSelectChannel, playlist, viewType, onGenerateDiscoveryMix, offlineItems, onAddToOffline, currentTrackId }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const discoveryMixButton = (
    <div className="mb-6">
        <button 
            onClick={onGenerateDiscoveryMix}
            disabled={isLoading}
            className="px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
        >
            <i className="fas fa-magic mr-2"></i>
            Buat Campuran Penemuan Saya
        </button>
    </div>
  );
  
  if (results.length === 0 && !isLoading) {
    return (
        <div className="text-center py-10 text-dark-subtext">
            {viewType === 'recommendations' && discoveryMixButton}
            <i className={`fas ${viewType === 'search' ? 'fa-search' : 'fa-music'} text-4xl mb-4 mt-6`}></i>
            <p>{viewType === 'search' ? 'Tidak ada hasil yang ditemukan.' : 'Rekomendasi pribadi Anda akan muncul di sini.'}</p>
            <p className="text-sm">{viewType === 'search' ? 'Coba kata kunci pencarian yang lain.' : 'Dengarkan beberapa lagu untuk memulai.'}</p>
        </div>
    );
  }

  return (
    <div className="space-y-2">
      {viewType === 'recommendations' && (
        <div className="flex justify-start items-center mb-4">
          {discoveryMixButton}
        </div>
      )}
      {results.map(item => (
            <SearchResultItem
                key={item.id.videoId}
                item={item}
                onSelectTrack={onSelectTrack}
                onAddToPlaylist={onAddToPlaylist}
                onSelectChannel={onSelectChannel}
                isInPlaylist={playlist.some(p => p.id.videoId === item.id.videoId)}
                isOffline={offlineItems.some(o => o.id.videoId === item.id.videoId)}
                onAddToOffline={onAddToOffline}
                isPlaying={currentTrackId === item.id.videoId}
                contextList={results}
            />
        )
      )}
    </div>
  );
};