
import React from 'react';
import type { VideoItem } from '../types';
import { DownloadButton } from './DownloadButton';
import type { TrackDownloadState } from '../hooks/useDownloadManager';

interface HistoryListProps {
  history: VideoItem[];
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onSelectChannel: (channelId: string, channelTitle: string) => void;
  offlineItems: VideoItem[];
  onAddToOffline: (track: VideoItem) => void;
  currentTrackId?: string | null;
  getDownloadState: (videoId: string) => TrackDownloadState;
  onDownloadTrack: (track: VideoItem) => void;
  onDeleteDownload: (videoId: string) => void;
}

const HistoryItem: React.FC<{
    item: VideoItem;
    onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
    onOpenAddToPlaylistModal: (track: VideoItem) => void;
    onSelectChannel: (channelId: string, channelTitle: string) => void;
    isPlaying: boolean;
    history: VideoItem[];
    downloadState: TrackDownloadState;
    onDownload: () => void;
    onDeleteDownload: () => void;
}> = ({ item, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel, isPlaying, history, downloadState, onDownload, onDeleteDownload }) => (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-dark-highlight transition-colors duration-200 group">
        <div className="relative w-12 h-12">
            <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-full h-full rounded-md object-cover"
            />
             <button
                onClick={() => onSelectTrack(item, history)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                aria-label={`Putar ${item.snippet.title}`}
            >
                <i className="fas fa-play text-white text-lg"></i>
            </button>
        </div>
        <div className="min-w-0">
            <p className={`text-sm font-semibold cursor-pointer ${isPlaying ? 'text-brand-red' : 'text-white'} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden`} onClick={() => onSelectTrack(item, history)}>
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
            <DownloadButton
                state={downloadState}
                onDownload={onDownload}
                onDelete={onDeleteDownload}
            />
            <button
                onClick={() => onOpenAddToPlaylistModal(item)}
                className="p-2 w-8 h-8 flex items-center justify-center rounded-full text-dark-subtext hover:text-white transition-colors duration-200"
                title="Tambahkan ke playlist"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
    </div>
);

export const HistoryList: React.FC<HistoryListProps> = ({
  history, onSelectTrack, onOpenAddToPlaylistModal, onSelectChannel,
  offlineItems, onAddToOffline, currentTrackId,
  getDownloadState, onDownloadTrack, onDeleteDownload
}) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-dark-subtext">
        <i className="fas fa-history text-4xl mb-4"></i>
        <p>Riwayat mendengarkan Anda kosong.</p>
        <p className="text-sm">Lagu yang Anda putar akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {history.map((item) => (
          <HistoryItem
              key={item.id.videoId}
              item={item}
              onSelectTrack={onSelectTrack}
              onOpenAddToPlaylistModal={onOpenAddToPlaylistModal}
              onSelectChannel={onSelectChannel}
              isPlaying={currentTrackId === item.id.videoId}
              history={history}
              downloadState={getDownloadState(item.id.videoId)}
              onDownload={() => onDownloadTrack(item)}
              onDeleteDownload={() => onDeleteDownload(item.id.videoId)}
          />
      ))}
    </div>
  );
};
