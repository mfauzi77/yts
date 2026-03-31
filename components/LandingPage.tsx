import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  isExiting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting }) => {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg text-dark-text font-sans transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center">
        <div className="relative inline-block">
            <i className="fab fa-youtube text-brand-red text-8xl md:text-9xl animate-pulse drop-shadow-2xl"></i>
            <div className="absolute inset-0 bg-brand-red blur-3xl opacity-20 rounded-full"></div>
        </div>

        <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-white">
          YTS
        </h1>
        
        <p className="mt-2 text-lg text-dark-subtext">
          Musikmu, Tanpa Gangguan.
        </p>

        <button
          onClick={onEnter}
          className="mt-10 px-8 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all duration-200 ease-in-out shadow-lg hover:shadow-red-900/50 transform hover:-translate-y-1 border border-white/5"
          aria-label="Mulai Mendengarkan"
        >
          Mulai Mendengarkan
        </button>
      </div>
    </div>
  );
};