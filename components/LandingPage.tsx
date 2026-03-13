import React, { useState } from 'react';

interface LandingPageProps {
  onEnter: (pin: string) => void;
  isExiting: boolean;
  error?: string | null;
  isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting, error, isLoading }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() && !isLoading) {
      onEnter(pin);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg text-dark-text font-sans transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center w-full max-w-md px-6">
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

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN Akses"
              disabled={isLoading}
              className={`w-full px-6 py-4 bg-dark-surface border ${error ? 'border-brand-red' : 'border-white/10'} rounded-2xl text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all placeholder:text-dark-subtext/50 placeholder:tracking-normal disabled:opacity-50`}
              required
            />
            {error && (
              <p className="mt-2 text-brand-red text-sm font-medium animate-shake">
                {error}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-4 bg-brand-red text-white font-semibold rounded-2xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all duration-200 ease-in-out shadow-lg hover:shadow-red-900/50 transform hover:-translate-y-1 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Mulai Mendengarkan"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Mulai Mendengarkan'
            )}
          </button>
        </form>
        
        <p className="mt-6 text-xs text-dark-subtext/40 uppercase tracking-widest">
          Akses Terbatas • Masukkan PIN untuk Melanjutkan
        </p>
      </div>
    </div>
  );
};
