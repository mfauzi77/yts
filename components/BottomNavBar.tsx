import React from 'react';

type MainView = 'home' | 'playlist' | 'history' | 'offline' | 'channel';

interface BottomNavBarProps {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
}

const NavItem: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-brand-red' : 'text-dark-subtext'
        }`}
    >
        <i className={`fas ${icon} text-xl`}></i>
        <span className="text-xs mt-1">{label}</span>
    </button>
);

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-dark-surface border-t border-dark-card/50">
            <NavItem
                icon="fa-home"
                label="Beranda"
                isActive={activeView === 'home'}
                onClick={() => setActiveView('home')}
            />
            <NavItem
                icon="fa-list-ul"
                label="Playlist"
                isActive={activeView === 'playlist'}
                onClick={() => setActiveView('playlist')}
            />
            <NavItem
                icon="fa-history"
                label="Riwayat"
                isActive={activeView === 'history'}
                onClick={() => setActiveView('history')}
            />
            <NavItem
                icon="fa-cloud-download-alt"
                label="Offline"
                isActive={activeView === 'offline'}
                onClick={() => setActiveView('offline')}
            />
        </nav>
    );
};