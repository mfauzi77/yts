import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  isExiting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting }) => {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text font-sans transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center">
        <i className="fab fa-youtube text-brand-red text-8xl md:text-9xl animate-pulse"></i>

        <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          YTS
        </h1>
        
        <p className="mt-2 text-lg text-gray-500 dark:text-dark-subtext">
          Your Music, Uninterrupted.
        </p>

        <button
          onClick={onEnter}
          className="mt-10 px-8 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          aria-label="Start Listening"
        >
          Start Listening
        </button>
      </div>
    </div>
  );
};