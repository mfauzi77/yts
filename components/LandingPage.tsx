
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  isExiting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting }) => {
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-bg transition-opacity duration-500 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center space-y-6 px-4">
        <div className="w-24 h-24 bg-brand-red rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-brand-red/20 animate-pulse">
          <i className="fas fa-play text-white text-4xl ml-1"></i>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-tighter">YTS</h1>
          <p className="text-dark-text/60 text-lg font-medium">YouTube Audio Streamer</p>
        </div>
        <button 
          onClick={onEnter}
          className="px-10 py-4 bg-brand-red hover:bg-red-600 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-brand-red/20"
        >
          Masuk Sekarang
        </button>
      </div>
      <div className="absolute bottom-8 text-dark-text/30 text-sm font-medium">
        v0.0.0 • Built for Speed
      </div>
    </div>
  );
};
