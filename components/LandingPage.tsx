
import React from 'react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
  isExiting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isExiting }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-bg text-white overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-red/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <div className="mb-8 relative">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 md:w-32 md:h-32 bg-brand-red rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.3)]"
          >
            <i className="fas fa-play text-4xl md:text-5xl text-white ml-2"></i>
          </motion.div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-music text-brand-red text-xs"></i>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
          YTS<span className="text-brand-red">.</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-md mb-12 font-medium leading-relaxed">
          Stream musik YouTube dengan antarmuka modern, minimalis, dan tanpa gangguan.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="group relative px-10 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        >
          <span className="relative z-10 flex items-center">
            Mulai Mendengarkan
            <i className="fas fa-arrow-right ml-3 transition-transform group-hover:translate-x-1"></i>
          </span>
        </motion.button>

        <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16 opacity-50">
          <div className="flex flex-col items-center">
            <i className="fas fa-search mb-2"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Search</span>
          </div>
          <div className="flex flex-col items-center">
            <i className="fas fa-list mb-2"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Playlist</span>
          </div>
          <div className="flex flex-col items-center">
            <i className="fas fa-bolt mb-2"></i>
            <span className="text-[10px] uppercase tracking-widest font-bold">Fast</span>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">
        Built for Music Lovers
      </div>
    </motion.div>
  );
};
