import { useState, useCallback } from 'react';
import type { VideoItem } from '../types';

export type DownloadState = 'idle' | 'downloading' | 'completed' | 'error';

export const useDownloadManager = () => {
    const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});

    const downloadTrack = useCallback(async (track: VideoItem) => {
        const id = track.id.videoId;
        setDownloadStates(prev => ({ ...prev, [id]: 'downloading' }));
        try {
            setDownloadStates(prev => ({ ...prev, [id]: 'completed' }));
        } catch {
            setDownloadStates(prev => ({ ...prev, [id]: 'error' }));
        }
    }, []);

    const deleteOfflineTrack = useCallback(async (videoId: string) => {
        setDownloadStates(prev => ({ ...prev, [videoId]: 'idle' }));
    }, []);

    const getDownloadState = useCallback((videoId: string): DownloadState => {
        return downloadStates[videoId] || 'idle';
    }, [downloadStates]);

    const refreshSavedIds = useCallback((ids: string[]) => {
        setDownloadStates(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                if (!next[id]) next[id] = 'completed';
            });
            return next;
        });
    }, []);

    return {
        downloadTrack,
        deleteOfflineTrack,
        getDownloadState,
        refreshSavedIds,
    };
};
