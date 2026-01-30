
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
}> = ({ item, index, onSelectTrack, onRemoveFromOfflinePlaylist, onSelectChannel, isPlaying, isSynced, isSyncing, offlinePlaylist }) => {
    
    return (
        <div className="grid grid-cols-[20px_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
            <div className="flex items-center justify-center text-dark-subtext">
                <span className="group-hover:hidden">{index + 1}</span>
                <button onClick={() => onSelectTrack(item, offlinePlaylist)} className="hidden group-hover:block" aria-label={`Putar ${item.snippet.title}`}>
                    <i className="fas fa-play text-white"></i>
                </button>
            </div>
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                    <img
                        src={item.snippet.thumbnails.default.url}
                        alt={item.snippet.title}
                        className="w-10 h-10 rounded-md object-cover"
                    />
                    {isSynced && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-dark-bg">
                            <i className="fas fa-check text-[8px] text-white"></i>
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'}`} onClick={() => onSelectTrack(item, offlinePlaylist)}>
                        {item.snippet.title}
                    </p>
                    <p 
                        className="text-xs text-dark-subtext cursor-pointer hover:underline truncate"
                        onClick={() => onSelectChannel(item.snippet.channelId, item.snippet.channelTitle)}
                    >
                        {item.snippet.channelTitle}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="w-6 flex justify-center">
                    {isSyncing && !isSynced ? (
                         <i className="fas fa-spinner fa-spin text-brand-red text-xs"></i>
                    ) : isSynced ? (
                        <i className="fas fa-check-circle text-green-500 text-xs" title="Tersedia offline"></i>
                    ) : (
                        <i className="fas fa-cloud text-dark-subtext text-xs" title="Menunggu sinkronisasi"></i>
                    )}
                </div>
                <button 
                    onClick={() => onRemoveFromOfflinePlaylist(item.id.videoId)} 
                    className="p-2 w-8 h-8 flex items-center justify-center rounded-full text-dark-subtext hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus dari Offline"
                >
                    <i className="fas fa-trash-alt text-sm"></i>
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
        <p>Koleksi offline Anda kosong.</p>
        <p className="text-sm">Klik ikon simpan pada lagu apa pun untuk mendengarkan tanpa koneksi.</p>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6 p-5 bg-dark-card rounded-xl border border-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <i className="fas fa-cloud-download-alt mr-3 text-brand-red"></i>
                        Mode Offline
                    </h2>
                    <p className="text-sm text-dark-subtext mt-1">
                        {isSyncing 
                            ? `Menyinkronkan... ${Math.round(syncingTrackProgress)}%` 
                            : `${offlinePlaylist.length - unsyncedCount} dari ${offlinePlaylist.length} lagu siap diputar offline.`}
                    </p>
                </div>
                <button
                    onClick={onStartSync}
                    disabled={isSyncing || unsyncedCount === 0}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-red text-white font-bold rounded-full hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-red-900/20"
                >
                    {isSyncing ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Sinkron...
                        </>
                    ) : unsyncedCount === 0 ? (
                        <>
                            <i className="fas fa-check mr-2"></i>
                            Sudah Sinkron
                        </>
                    ) : (
                       <>
                            <i className="fas fa-sync-alt mr-2"></i>
                            Sinkronkan {unsyncedCount} Lagu
                       </>
                    )}
                </button>
            </div>
            
            {isSyncing && (
                <div className="w-full bg-dark-bg h-1.5 rounded-full mt-6 overflow-hidden">
                    <div 
                        className="bg-brand-red h-full transition-all duration-500 ease-out"
                        style={{ width: `${syncingTrackProgress}%` }}
                    ></div>
                </div>
            )}
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
                />
            ))}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-dark-subtext leading-relaxed">
            <p className="flex items-start">
                <i className="fas fa-info-circle mr-2 mt-0.5 text-blue-400"></i>
                <span>
                    <strong>Catatan Offline:</strong> Fitur ini menyimpan metadata dan gambar sampul agar aplikasi tetap bisa dibuka tanpa internet. 
                    Stream audio memerlukan data yang telah di-cache oleh browser saat lagu diputar sebelumnya. Pastikan untuk "Sinkronkan" saat Anda memiliki jaringan yang stabil.
                </span>
            </p>
        </div>
    </div>
  );
};
