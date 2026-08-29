import React, { useState } from 'react';
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Download,
  History,
  Moon,
  Disc3,
  ListMusic,
  ChevronRight,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import type { Playlist } from '../types';

export type MainView =
  | 'home'
  | 'search'
  | 'library'
  | 'playlists'
  | 'playlistDetail'
  | 'history'
  | 'offline'
  | 'liked'
  | 'channel'
  | 'youtubePlaylistDetail'
  | 'settings';

interface SidebarProps {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
  playlists?: Playlist[];
  onSelectPlaylist?: (playlist: Playlist) => void;
  onCreatePlaylist?: () => void;
  sleepTimerRemaining?: number | null;
  likedCount?: number;
  offlineCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  playlists = [],
  onSelectPlaylist,
  onCreatePlaylist,
  sleepTimerRemaining,
  likedCount = 0,
  offlineCount = 0,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'playlists' | 'offline'>('all');

  const filteredPlaylists = playlists;

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-[#000000] text-white select-none transition-all duration-300 gap-2 p-2 ${
        isCollapsed ? 'w-[74px]' : 'w-[260px] lg:w-[280px]'
      }`}
    >
      {/* =========================================================================
          TOP BOX: Logo & Main Navigation (Home, Search)
      ========================================================================== */}
      <div className="bg-[#121212] rounded-xl p-3.5 flex flex-col gap-1.5 flex-shrink-0">
        {/* Brand Header */}
        <div
          onClick={() => setActiveView('home')}
          className={`flex items-center gap-3 cursor-pointer px-2 py-1.5 mb-1 group ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand to-brand-hover flex items-center justify-center shadow-glow flex-shrink-0 group-hover:scale-105 transition-transform">
            <Disc3 className="w-5 h-5 text-white animate-spin [animation-duration:9s]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                REMIX <span className="text-brand">MUSIC</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            activeView === 'home'
              ? 'text-white font-black bg-[#242424]'
              : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
          }`}
          title="Beranda"
        >
          <Home className={`w-5 h-5 flex-shrink-0 ${activeView === 'home' ? 'text-brand' : ''}`} />
          {!isCollapsed && <span>Beranda</span>}
        </button>

        <button
          onClick={() => setActiveView('search')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            activeView === 'search'
              ? 'text-white font-black bg-[#242424]'
              : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
          }`}
          title="Cari Musik"
        >
          <Search className={`w-5 h-5 flex-shrink-0 ${activeView === 'search' ? 'text-brand' : ''}`} />
          {!isCollapsed && <span>Cari</span>}
        </button>
      </div>

      {/* =========================================================================
          BOTTOM BOX: Your Library, Liked Songs, Downloads & Playlists
      ========================================================================== */}
      <div className="bg-[#121212] rounded-xl p-3.5 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 flex-shrink-0">
          <button
            onClick={() => setActiveView('library')}
            className={`flex items-center gap-3 text-sm font-bold transition-colors ${
              activeView === 'library' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title="Koleksi Kamu"
          >
            <Library className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Koleksi Kamu</span>}
          </button>

          {!isCollapsed && onCreatePlaylist && (
            <div className="flex items-center gap-1">
              <button
                onClick={onCreatePlaylist}
                className="w-8 h-8 rounded-full text-[#B3B3B3] hover:text-white hover:bg-[#282828] flex items-center justify-center transition-colors"
                title="Buat Playlist Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed view items */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              onClick={() => setActiveView('liked')}
              className={`p-2.5 rounded-lg transition-colors ${
                activeView === 'liked' ? 'bg-[#242424] text-brand' : 'text-[#B3B3B3] hover:text-white'
              }`}
              title="Lagu yang Disukai"
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setActiveView('offline')}
              className={`p-2.5 rounded-lg transition-colors ${
                activeView === 'offline' ? 'bg-[#242424] text-brand' : 'text-[#B3B3B3] hover:text-white'
              }`}
              title="Koleksi Offline"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`p-2.5 rounded-lg transition-colors ${
                activeView === 'history' ? 'bg-[#242424] text-brand' : 'text-[#B3B3B3] hover:text-white'
              }`}
              title="Riwayat Putar"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Library List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 mt-1">
              {/* Liked Songs Special Row */}
              <div
                onClick={() => setActiveView('liked')}
                className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'liked'
                    ? 'bg-[#242424] text-white'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Heart className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white">Lagu yang Disukai</p>
                  <p className="text-xs text-[#888888] truncate flex items-center gap-1">
                    <span>Pin</span> • {likedCount} lagu
                  </p>
                </div>
              </div>

              {/* Offline / Downloaded Row */}
              <div
                onClick={() => setActiveView('offline')}
                className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'offline'
                    ? 'bg-[#242424] text-white'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white">Koleksi Offline</p>
                  <p className="text-xs text-[#888888] truncate">
                    {offlineCount} lagu terunduh
                  </p>
                </div>
              </div>

              {/* History Row */}
              <div
                onClick={() => setActiveView('history')}
                className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'history'
                    ? 'bg-[#242424] text-white'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <div className="w-10 h-10 rounded-md bg-[#282828] flex items-center justify-center flex-shrink-0 text-[#B3B3B3] group-hover:text-white">
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white">Riwayat Putar</p>
                  <p className="text-xs text-[#888888] truncate">Baru saja didengar</p>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-white/5 my-2" />

              {/* User Custom Playlists */}
              {filteredPlaylists.map((pl) => {
                const isSelected =
                  activeView === 'playlistDetail' && pl.id === pl.id; // checked in parent
                return (
                  <div
                    key={pl.id}
                    onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                    className="group flex items-center gap-3 p-2 rounded-lg cursor-pointer text-[#B3B3B3] hover:text-white hover:bg-[#181818] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-[#242424] flex items-center justify-center flex-shrink-0 text-[#888888] group-hover:text-white">
                      <ListMusic className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-white group-hover:text-white">
                        {pl.name}
                      </p>
                      <p className="text-xs text-[#888888] truncate">
                        Playlist • {pl.tracks.length} lagu
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer / Sleep Timer / Settings */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-shrink-0 text-xs text-[#888888]">
            <button
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>

            {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
              <div
                onClick={() => setActiveView('settings')}
                className="flex items-center gap-1 text-brand font-mono cursor-pointer"
                title="Timer Tidur Aktif"
              >
                <Moon className="w-3 h-3 animate-pulse" />
                <span>{Math.floor(sleepTimerRemaining / 60)}m</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
