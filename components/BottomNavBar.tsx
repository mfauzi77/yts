import React from 'react';
import { Home, Search, Library, Settings } from 'lucide-react';
import type { MainView } from './Sidebar';

interface BottomNavBarProps {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
  onFocusSearch?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  setActiveView,
  onFocusSearch,
}) => {
  const items = [
    {
      id: 'home' as MainView,
      label: 'Beranda',
      icon: Home,
      action: () => setActiveView('home'),
    },
    {
      id: 'search' as MainView,
      label: 'Cari',
      icon: Search,
      action: () => {
        setActiveView('search');
        if (onFocusSearch) onFocusSearch();
      },
    },
    {
      id: 'library' as MainView,
      label: 'Koleksi',
      icon: Library,
      action: () => setActiveView('library'),
    },
    {
      id: 'settings' as MainView,
      label: 'Pengaturan',
      icon: Settings,
      action: () => setActiveView('settings'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-[#282828] select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="grid grid-cols-4 items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isItemActive =
            activeView === item.id ||
            (item.id === 'library' &&
              ['playlists', 'playlistDetail', 'liked', 'offline', 'history'].includes(
                activeView
              ));

          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isItemActive ? 'text-white font-bold' : 'text-[#9ca3af] active:text-white'
              }`}
              style={{ minHeight: '44px' }}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isItemActive ? 'text-emerald-400 scale-110' : ''
                }`}
              />
              <span
                className={`text-[11px] tracking-tight mt-1 transition-all ${
                  isItemActive ? 'text-white font-bold' : 'text-[#9ca3af]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

