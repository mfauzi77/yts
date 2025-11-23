

import React from 'react';

type MainView = 'home' | 'playlists' | 'playlistDetail' | 'history' | 'offline' | 'channel' | 'video';

interface SidebarProps {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
}

const NavLink: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-4 px-6 py-2 w-full text-left rounded-md transition-colors duration-200 ${
            isActive
                ? 'bg-dark-highlight text-white'
                : 'text-dark-subtext hover:text-white'
        }`}
    >
        <i className={`fas ${icon} w-5 text-center text-lg`}></i>
        <span className="font-semibold">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
    return (
        <aside className="hidden md:flex bg-black/80 p-4 flex-col space-y-8">
            <div className="flex items-center space-x-3 px-4">
                <i className="fab fa-youtube text-brand-red text-4xl"></i>
                <h1 className="text-2xl font-bold text-white tracking-tight">YTS</h1>
            </div>

            <nav className="flex flex-col space-y-2">
                <NavLink 
                    icon="fa-home" 
                    label="Beranda" 
                    isActive={activeView === 'home'} 
                    onClick={() => setActiveView('home')} 
                />
                <NavLink 
                    icon="fa-play-circle" 
                    label="Video" 
                    isActive={activeView === 'video'} 
                    onClick={() => setActiveView('video')} 
                />
                <NavLink 
                    icon="fa-list-ul" 
                    label="Playlist" 
                    isActive={activeView === 'playlists' || activeView === 'playlistDetail'} 
                    onClick={() => setActiveView('playlists')} 
                />
                 <NavLink 
                    icon="fa-history" 
                    label="Riwayat" 
                    isActive={activeView === 'history'} 
                    onClick={() => setActiveView('history')} 
                />
                 <NavLink 
                    icon="fa-cloud-download-alt" 
                    label="Koleksi Offline" 
                    isActive={activeView === 'offline'} 
                    onClick={() => setActiveView('offline')} 
                />
            </nav>
        </aside>
    );
};
