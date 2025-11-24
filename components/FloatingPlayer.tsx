import React, { useState, useEffect, useRef } from 'react';
import type { VideoItem } from '../types';

interface FloatingPlayerProps {
  track: VideoItem;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ track, isPlaying, setIsPlaying, onNext, onPrev, onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 180 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the image
    if ((e.target as HTMLElement).closest('.drag-handle')) {
        isDragging.current = true;
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        playerRef.current?.classList.add('cursor-grabbing');
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    playerRef.current?.classList.remove('cursor-grabbing');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      let newX = e.clientX - dragStartPos.current.x;
      let newY = e.clientY - dragStartPos.current.y;

      // Constrain to viewport
      const playerWidth = playerRef.current?.offsetWidth || 300;
      const playerHeight = playerRef.current?.offsetHeight || 88;
      
      if (newX < 16) newX = 16;
      if (newY < 16) newY = 16;
      if (newX + playerWidth > window.innerWidth - 16) newX = window.innerWidth - playerWidth - 16;
      if (newY + playerHeight > window.innerHeight - 16) newY = window.innerHeight - playerHeight - 16;


      setPosition({ x: newX, y: newY });
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={playerRef}
      className="fixed z-50 w-72 p-3 bg-dark-surface/90 backdrop-blur-md rounded-xl shadow-black/50 shadow-2xl flex items-center space-x-3 border border-white/5"
      style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={track.snippet.thumbnails.default.url}
        alt={track.snippet.title}
        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 pointer-events-none drag-handle cursor-grab border border-white/10"
      />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-bold text-white truncate pointer-events-none">{track.snippet.title}</p>
        <div className="flex items-center space-x-3 mt-2">
          <button onClick={onPrev} className="text-dark-subtext hover:text-white transition-colors">
            <i className="fas fa-step-backward"></i>
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 flex items-center justify-center bg-brand-red text-white rounded-full shadow-md hover:bg-red-700">
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button onClick={onNext} className="text-dark-subtext hover:text-white transition-colors">
            <i className="fas fa-step-forward"></i>
          </button>
        </div>
      </div>
       <button 
            onClick={onClose} 
            className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded-full text-dark-subtext hover:bg-dark-card hover:text-white transition-colors"
            title="Perluas Pemutar"
            aria-label="Perluas pemutar"
        >
            <i className="fas fa-expand-alt text-xs"></i>
        </button>
    </div>
  );
};