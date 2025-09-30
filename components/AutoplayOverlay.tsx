import React from 'react';
import type { VideoItem } from '../types';

interface AutoplayOverlayProps {
  track: VideoItem;
  onForcePlay: () => void;
}

export const AutoplayOverlay: React.FC<AutoplayOverlayProps> = ({ track, onForcePlay }) => {
  const imageUrl = track.snippet.thumbnails.high?.url || track.snippet.thumbnails.default.url;

  return (
    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
      <div className="w-32 h-32 md:w-40 md:h-40 mb-6">
        <img 
          src={imageUrl} 
          alt={track.snippet.title} 
          className="w-full h-full object-cover rounded-lg shadow-2xl"
        />
      </div>
      
      <h2 className="text-lg font-bold text-white">Lagu Berikutnya</h2>
      <p className="text-white/80 max-w-md">{track.snippet.title}</p>
      
      <button
        onClick={onForcePlay}
        className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
        aria-label="Lanjutkan pemutaran"
      >
        <i className="fas fa-play mr-2"></i>
        Ketuk untuk Melanjutkan
      </button>

      <p className="mt-4 text-xs text-white/50 max-w-xs">
        Browser Anda menghentikan putar otomatis. Ketuk untuk memutar lagu berikutnya.
      </p>
    </div>
  );
};