import React from 'react';
import type { VideoItem } from '../types';

interface OfflineListProps {
  offlinePlaylist: VideoItem[];
  syncedOfflineIds: string[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onRemoveFromOfflinePlaylist: (trackId: string) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  currentTrackId?: string | null;
  isSyncing: boolean;
  onStartSync: () => void;
  syncingTrackProgress: number;
}

const OfflineItem: React.FC<{
    item: VideoItem;
    index: number;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onRemoveFromOfflinePlaylist: (trackId: string) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isPlaying: boolean;
    isSynced: boolean;
    isSyncing: boolean;
    offlinePlaylist: VideoItem[];
    syncingTrackProgress: number;
}> = ({ item, index, onSelectTrack, onRemoveFromOfflinePlaylist, onSelectChannel, isPlaying, isSynced, isSyncing, offlinePlaylist, syncingTrackProgress }) => {
    
    let statusDisplay;
    
    if (isPlaying && isSyncing) {
        const radius = 9;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (syncingTrackProgress / 100) * circumference;

        statusDisplay = (
            <div className="relative w-6 h-6 flex items-center justify-center" title="Menyinkronkan...">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r={radius} fill="none" stroke="#272727" strokeWidth="2" />
                    <circle 
                        cx="12" cy="12" r={radius} 
                        fill="none" 
                        stroke="#FF0000" 
                        strokeWidth="2" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[6px] font-bold text-white">{Math.round(syncingTrackProgress)}%</span>
                </div>
            </div>
        );
    } else if (isSynced) {
        statusDisplay = <i className="fas fa-check-circle text-green-500" title="Tersedia offline"></i>;
    } else {
        statusDisplay = <i className="fas fa-cloud text-dark-subtext" title="Menunggu sinkronisasi"></i>;
    }

    return (
        <div className="grid grid-cols-[20px_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
            <div className="flex items-center justify-center text-dark-subtext">
                <span className="group-hover:hidden">{index + 1}</span>
                <button onClick={() => onSelectTrack(item, offlinePlaylist)} className="hidden group-hover:block" aria-label={`Putar ${item.snippet.title}`}>
                    <i className="fas fa-play text-white"></i>
                </button>
            </div>
            <div className="flex items-center gap-4">
                <img
                    src={item.snippet.thumbnails.default.url}
                    alt={item.snippet.title}
                    className="w-10 h-10 rounded-md object-cover"
                />
                <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'}`} onClick={() => onSelectTrack(item, offlinePlaylist)}>
                        {item.snippet.title}
                    </p>
                    <p 
                        className="text-xs text-dark-subtext cursor-pointer hover:underline"
                        onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
                    >
                        {item.snippet.channelTitle}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="w-6 flex justify-center">
                    {statusDisplay}
                </div>
                <button 
                    onClick={() => onRemoveFromOfflinePlaylist(item.id.videoId)} 
                    className="p-2 w-8 h-8 flex items-center justify-center rounded-full text-dark-subtext hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus dari Offline"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    );
};

export const OfflineList: React.FC<OfflineListProps> = ({ 
    offlinePlaylist, 
    syncedOfflineIds,
    onSelectTrack, 
    onRemoveFromOfflinePlaylist, 
    onSelectChannel, 
    currentTrackId,
    isSyncing,
    onStartSync,
    syncingTrackProgress
}) => {
  
  const unsyncedCount = offlinePlaylist.filter(item => !syncedOfflineIds.includes(item.id.videoId)).length;
  
  if (offlinePlaylist.length === 0) {
    return (
      <div className="text-center py-10 text-dark-subtext">
        <i className="fas fa-cloud-download-alt text-4xl mb-4"></i>
        <p>Anda tidak memiliki lagu yang disimpan untuk akses offline.</p>
        <p className="text-sm">Klik ikon awan pada lagu untuk menyimpannya di sini.</p>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6 p-4 bg-dark-card rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold">Sinkronisasi Offline</h2>
                    <p className="text-sm text-dark-subtext">
                        {isSyncing ? "Proses sinkronisasi sedang berjalan..." : `${unsyncedCount} dari ${offlinePlaylist.length} lagu perlu disinkronkan.`}
                    </p>
                </div>
                <button
                    onClick={onStartSync}
                    disabled={isSyncing || unsyncedCount === 0}
                    className="px-5 py-2.5 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md disabled:bg-dark-surface"
                >
                    {isSyncing ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Menyinkronkan...
                        </>
                    ) : (
                       <>
                            <i className="fas fa-sync-alt mr-2"></i>
                            Sinkronkan Semua
                       </>
                    )}
                </button>
            </div>
             <p className="text-xs text-dark-subtext mt-3 pt-3 border-t border-dark-surface/50">
                Fitur ini akan memutar lagu Anda satu per satu untuk menyimpannya di perangkat Anda untuk pemutaran offline. Pastikan koneksi internet Anda stabil.
            </p>
        </div>

        <div className="space-y-1">
            {offlinePlaylist.map((item, index) => (
                <OfflineItem 
                    key={item.id.videoId} 
                    item={item}
                    index={index}
                    onSelectTrack={onSelectTrack}
                    onRemoveFromOfflinePlaylist={onRemoveFromOfflinePlaylist}
                    onSelectChannel={onSelectChannel}
                    isPlaying={currentTrackId === item.id.videoId}
                    isSynced={syncedOfflineIds.includes(item.id.videoId)}
                    isSyncing={isSyncing}
                    offlinePlaylist={offlinePlaylist}
                    syncingTrackProgress={syncingTrackProgress}
                />
            ))}
        </div>
    </div>
  );
};