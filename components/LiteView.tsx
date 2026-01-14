
import React, { useState } from 'react';
import { searchVideos } from '../services/youtubeService';
import type { VideoItem } from '../types';

interface LiteViewProps {
  onSelectTrack: (track: VideoItem, contextList: VideoItem[]) => void;
  onOpenAddToPlaylistModal: (track: VideoItem) => void;
  onAddToOffline: (track: VideoItem) => void;
  offlineItems: VideoItem[];
  currentTrackId?: string | null;
}

export const LiteView: React.FC<LiteViewProps> = ({ 
  onSelectTrack, 
  onOpenAddToPlaylistModal, 
  onAddToOffline, 
  offlineItems, 
  currentTrackId 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await searchVideos(query);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isOffline = (id: string) => offlineItems.some(o => o.id.videoId === id);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '10px', color: '#fff' }}>
      {/* Simple Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari..."
          style={{ 
            flex: 1, 
            padding: '8px', 
            background: '#222', 
            color: '#fff', 
            border: '1px solid #444', 
            borderRadius: '4px' 
          }}
        />
        <button 
          type="submit"
          style={{ 
            padding: '8px 16px', 
            background: '#FF0000', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '...' : 'Cari'}
        </button>
      </form>

      {/* Results List - Plain HTML Structure */}
      <div style={{ borderTop: '1px solid #333' }}>
        {results.length === 0 && !isLoading && (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            Ketik sesuatu untuk mencari musik dalam mode hemat daya.
          </p>
        )}
        
        {results.map((item) => (
          <div 
            key={item.id.videoId} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '10px 5px',
              borderBottom: '1px solid #333',
              background: currentTrackId === item.id.videoId ? '#1a1a1a' : 'transparent'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div 
                onClick={() => onSelectTrack(item, results)}
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: currentTrackId === item.id.videoId ? '#FF0000' : '#fff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.snippet.title}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                {item.snippet.channelTitle}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
              <button 
                onClick={() => onSelectTrack(item, results)}
                style={{ background: 'none', border: '1px solid #555', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
              >
                Play
              </button>
              <button 
                onClick={() => onAddToOffline(item)}
                style={{ 
                  background: 'none', 
                  border: '1px solid #555', 
                  color: isOffline(item.id.videoId) ? '#4caf50' : '#fff', 
                  borderRadius: '4px', 
                  padding: '4px 8px', 
                  fontSize: '12px' 
                }}
              >
                {isOffline(item.id.videoId) ? '✓' : 'Save'}
              </button>
              <button 
                onClick={() => onOpenAddToPlaylistModal(item)}
                style={{ background: 'none', border: '1px solid #555', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
