import React from 'react';
import { ChevronLeft, ChevronRight, Moon, Settings, Search, X, Terminal } from 'lucide-react';
import { ApiStatusIndicator } from './ApiStatusIndicator';

interface AppHeaderProps {
  onBack?: () => void;
  canGoBack?: boolean;
  onForward?: () => void;
  canGoForward?: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  sleepTimerRemaining?: number | null;
  onOpenSettings?: () => void;
  onOpenDiagnostic?: () => void;
  apiStatus?: 'idle' | 'success' | 'error';
  showSearchBar?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onBack,
  canGoBack = false,
  onForward,
  canGoForward = false,
  searchQuery,
  onSearch,
  isLoading: _isLoading = false,
  sleepTimerRemaining,
  onOpenSettings,
  onOpenDiagnostic,
  apiStatus = 'idle',
  showSearchBar = true,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur-xl border-b border-[#282828] px-4 md:px-6 py-3 transition-colors select-none">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Navigation History Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBack}
            disabled={!canGoBack}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] hover:bg-[#282828] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-95 border border-[#282828]"
            title="Kembali"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onForward}
            disabled={!canGoForward}
            className="hidden md:flex w-8 h-8 rounded-full bg-[#1c1c1c] hover:bg-[#282828] disabled:opacity-40 disabled:cursor-not-allowed items-center justify-center text-white transition-all active:scale-95 border border-[#282828]"
            title="Maju"
            aria-label="Maju"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar (Spotify pill style) */}
        {showSearchBar ? (
          <div className="flex-1 max-w-md relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Apa yang ingin kamu dengarkan?"
                className="w-full bg-[#1c1c1c] hover:bg-[#242424] focus:bg-[#242424] text-white text-xs md:text-sm pl-10 pr-9 py-2 rounded-full border border-[#282828] focus:border-emerald-500/50 outline-none transition-all placeholder:text-[#6b7280]"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearch('')}
                  className="absolute right-3 p-0.5 rounded-full hover:bg-white/10 text-[#6b7280] hover:text-white"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Diagnostic Logs Trigger Button */}
          {onOpenDiagnostic && (
            <button
              onClick={onOpenDiagnostic}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold transition-colors"
              title="Buka Diagnostic Logs (Ctrl+L / Cmd+L)"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logs</span>
            </button>
          )}

          {/* Sleep Timer Indicator */}
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              title="Timer Tidur Aktif"
            >
              <Moon className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-mono text-[11px]">
                {Math.floor(sleepTimerRemaining / 60)}m
              </span>
            </button>
          )}

          {/* API Status Indicator */}
          <div className="hidden sm:flex items-center">
            <ApiStatusIndicator status={apiStatus} />
          </div>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-[#1c1c1c] hover:bg-[#282828] text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors border border-[#282828]"
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

