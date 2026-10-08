import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
  isExiting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth entrance animation on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-bg text-white overflow-hidden transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-red/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Animated App Icon */}
        <div className="mb-8 relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-brand-red rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.35)] transition-transform duration-500 hover:scale-105 active:scale-95 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]">
            <i className="fas fa-play text-4xl md:text-5xl text-white ml-2 drop-shadow-md"></i>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-dark-bg">
            <i className="fas fa-music text-brand-red text-xs"></i>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 select-none">
          YTS<span className="text-brand-red">.</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-md mb-12 font-medium leading-relaxed">
          Stream musik YouTube dengan antarmuka modern, minimalis, dan tanpa gangguan.
        </p>

        {/* CTA Button */}
        <button
          onClick={onEnter}
          className="group relative px-10 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] cursor-pointer"
        >
          <span className="relative z-10 flex items-center text-base">
            Mulai Mendengarkan
            <i className="fas fa-arrow-right ml-3 transition-transform duration-300 group-hover:translate-x-1.5"></i>
          </span>
        </button>

        {/* Feature Badges */}
        <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16 opacity-50">
          <div className="flex flex-col items-center">
            <i className="fas fa-search mb-2 text-sm"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Search</span>
          </div>
          <div className="flex flex-col items-center">
            <i className="fas fa-list mb-2 text-sm"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Playlist</span>
          </div>
          <div className="flex flex-col items-center">
            <i className="fas fa-bolt mb-2 text-sm"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Fast</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold select-none">
        Built for Music Lovers
      </div>
    </div>
  );
};
