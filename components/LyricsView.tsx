import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { VideoItem } from '../types';

interface LyricsViewProps {
  track: VideoItem;
}

export const LyricsView: React.FC<LyricsViewProps> = ({ track }) => {
    const [lyricsStore, setLyricsStore] = useLocalStorage<{ [key: string]: string }>('ytas-lyrics', {});
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');

    const currentLyrics = lyricsStore[track.id.videoId] || '';

    useEffect(() => {
        // When track changes, exit edit mode
        setIsEditing(false);
    }, [track.id.videoId]);

    const handleEdit = () => {
        setEditText(currentLyrics);
        setIsEditing(true);
    };

    const handleSave = () => {
        setLyricsStore(prev => ({
            ...prev,
            [track.id.videoId]: editText.trim()
        }));
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="w-full h-full flex flex-col p-4 bg-dark-card/50 rounded-lg">
                <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Tempel atau ketik lirik di sini..."
                    className="w-full h-full bg-transparent text-white placeholder-dark-subtext border-none focus:ring-0 resize-none text-center"
                    autoFocus
                />
                <div className="flex justify-center space-x-4 mt-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 transition-colors">Simpan</button>
                    <button onClick={handleCancel} className="px-4 py-2 bg-dark-surface text-white font-semibold rounded-full hover:bg-dark-highlight transition-colors">Batal</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-dark-card/50 rounded-lg text-center">
            {currentLyrics ? (
                <>
                    <pre className="whitespace-pre-wrap text-white/90 font-sans overflow-y-auto h-full w-full">
                        {currentLyrics}
                    </pre>
                    <button onClick={handleEdit} className="mt-4 px-4 py-2 bg-dark-surface text-white font-semibold rounded-full hover:bg-dark-highlight transition-colors text-sm">
                        <i className="fas fa-pencil-alt mr-2"></i>
                        Ubah Lirik
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <i className="fas fa-microphone-alt-slash text-4xl text-dark-subtext mb-4"></i>
                    <p className="text-dark-subtext">Lirik tidak tersedia.</p>
                    <button onClick={handleEdit} className="mt-4 px-4 py-2 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 transition-colors">
                         <i className="fas fa-plus mr-2"></i>
                        Tambahkan Lirik
                    </button>
                </div>
            )}
        </div>
    );
};
