import React, { useState, useEffect, useCallback } from 'react';
import type { VideoItem, Playlist } from '../types';
import {
  Moon,
  Trash2,
  HardDrive,
  Radio,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  history: VideoItem[];
  setHistory: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  searchHistory: string[];
  setSearchHistory: React.Dispatch<React.SetStateAction<string[]>>;
  offlineItems: VideoItem[];
  setOfflineItems: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  playlists: Playlist[];

  // Auto Cleanup Configuration
  historyLimit: number;
  setHistoryLimit: (limit: number) => void;
  historyMaxAgeDays: number;
  setHistoryMaxAgeDays: (days: number) => void;
  autoCleanupEnabled: boolean;
  setAutoCleanupEnabled: (enabled: boolean) => void;
  autoClearCacheOnStartup: boolean;
  setAutoClearCacheOnStartup: (enabled: boolean) => void;

  // Sleep Timer
  sleepTimerRemaining: number | null;
  onSetSleepTimer: (minutes: number | null) => void;

  // Actions
  onBack?: () => void;
}

interface StorageStats {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  localStorageSizeKB: number;
  cachesCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  history,
  setHistory,
  searchHistory,
  setSearchHistory,
  offlineItems,
  setOfflineItems,
  playlists,
  historyLimit,
  setHistoryLimit,
  autoCleanupEnabled,
  setAutoCleanupEnabled,
  sleepTimerRemaining,
  onSetSleepTimer,
}) => {
  const [stats, setStats] = useState<StorageStats>({
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    localStorageSizeKB: 0,
    cachesCount: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  const formatTimerSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const calculateStorageStats = useCallback(async () => {
    let totalLSBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalLSBytes += key.length + value.length;
        }
      }
    } catch (e) {
      // ignore
    }

    let usageMB = 0;
    let quotaMB = 0;
    let percentUsed = 0;
    let cachesCount = 0;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        usageMB = parseFloat((usage / (1024 * 1024)).toFixed(2));
        quotaMB = parseFloat((quota / (1024 * 1024)).toFixed(0));
        percentUsed = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(2)) : 0;
      } catch (e) {
        // ignore
      }
    }

    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        cachesCount = keys.length;
      } catch (e) {
        // ignore
      }
    }

    setStats({
      usageMB,
      quotaMB,
      percentUsed,
      localStorageSizeKB: parseFloat((totalLSBytes / 1024).toFixed(1)),
      cachesCount,
    });
  }, []);

  useEffect(() => {
    calculateStorageStats();
  }, [calculateStorageStats, history, searchHistory, offlineItems, playlists]);

  const handleClearHistory = () => {
    if (confirm('Hapus seluruh riwayat putar lagu?')) {
      setHistory([]);
      localStorage.removeItem('play_history');
      showToast('Riwayat putar berhasil dibersihkan');
    }
  };

  const handleClearSearchHistory = () => {
    if (confirm('Hapus seluruh riwayat pencarian?')) {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
      showToast('Riwayat pencarian berhasil dibersihkan');
    }
  };

  const handleClearCache = async () => {
    if (confirm('Bersihkan seluruh cache lagu offline?')) {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      setOfflineItems([]);
      localStorage.removeItem('offline_tracks');
      calculateStorageStats();
      showToast('Cache media offline berhasil dibersihkan');
    }
  };

  const timerPresets = [15, 30, 45, 60, 90];

  return (
    <div className="space-y-6 max-w-4xl pb-16 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Pengaturan</h1>
        <p className="text-xs md:text-sm text-[#9ca3af] mt-0.5">
          Kelola waktu tidur, penyimpanan lokal, dan preferensi aplikasi
        </p>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 1: Sleep Timer */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#181818] border border-[#282828] space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pengatur Waktu Tidur</h3>
              <p className="text-xs text-[#9ca3af]">Hentikan musik secara otomatis saat tertidur</p>
            </div>
          </div>

          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold">
              Sisa: {formatTimerSeconds(sleepTimerRemaining)}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
          {timerPresets.map((mins) => (
            <button
              key={mins}
              onClick={() => onSetSleepTimer(mins)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                sleepTimerRemaining !== null &&
                Math.round(sleepTimerRemaining / 60) === mins
                  ? 'bg-emerald-500 text-black shadow-md scale-105'
                  : 'bg-[#1c1c1c] hover:bg-[#242424] text-[#9ca3af] hover:text-white border border-[#282828]'
              }`}
            >
              {mins} Menit
            </button>
          ))}
          <button
            onClick={() => onSetSleepTimer(null)}
            className="py-2 px-3 rounded-xl text-xs font-bold bg-[#1c1c1c] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 border border-[#282828] transition-colors"
          >
            Matikan
          </button>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            min="1"
            max="300"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Atur menit kustom..."
            className="flex-1 max-w-xs px-3 py-2 text-xs rounded-xl bg-[#1c1c1c] border border-[#282828] text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => {
              const val = parseInt(customMinutes, 10);
              if (val > 0) {
                onSetSleepTimer(val);
                setCustomMinutes('');
              }
            }}
            disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Section 2: Storage & Cache Management */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#181818] border border-[#282828] space-y-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Penyimpanan & Cache Media</h3>
            <p className="text-xs text-[#9ca3af]">Kelola penggunaan memori lokal aplikasi</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#282828]">
            <span className="text-[11px] text-[#6b7280] block">Cache Media</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {stats.usageMB} MB
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#282828]">
            <span className="text-[11px] text-[#6b7280] block">Data Metadata</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {stats.localStorageSizeKB} KB
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#282828]">
            <span className="text-[11px] text-[#6b7280] block">Lagu Tersimpan</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {offlineItems.length} Lagu
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#282828]">
            <span className="text-[11px] text-[#6b7280] block">Riwayat Putar</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {history.length} Lagu
            </span>
          </div>
        </div>

        {/* Storage Bar */}
        {stats.quotaMB > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#9ca3af]">
              <span>Penggunaan Kuota Browser</span>
              <span className="font-mono">
                {stats.usageMB} MB / {stats.quotaMB} MB ({stats.percentUsed}%)
              </span>
            </div>
            <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden border border-[#282828]">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(2, stats.percentUsed))}%` }}
              />
            </div>
          </div>
        )}

        {/* Cleanup Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1c] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 border border-[#282828] text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Riwayat Putar</span>
          </button>

          <button
            onClick={handleClearSearchHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1c] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 border border-[#282828] text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Riwayat Cari</span>
          </button>

          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1c] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 border border-[#282828] text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Semua Cache</span>
          </button>
        </div>
      </div>

      {/* Section 3: History & Data Saver Preferences */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#181818] border border-[#282828] space-y-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Preferensi & Batas Data</h3>
            <p className="text-xs text-[#9ca3af]">Konfigurasi otomatisasi dan batas data lokal</p>
          </div>
        </div>

        <div className="space-y-4 pt-2 divide-y divide-[#282828]">
          {/* History limit slider */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <span className="text-sm font-semibold text-white block">Batas Maksimal Riwayat</span>
              <span className="text-xs text-[#9ca3af]">
                Jumlah lagu yang disimpan dalam riwayat
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="200"
                step="10"
                value={historyLimit}
                onChange={(e) => setHistoryLimit(Number(e.target.value))}
                className="w-28 accent-emerald-500"
              />
              <span className="text-xs font-mono font-bold text-white w-8 text-right">
                {historyLimit}
              </span>
            </div>
          </div>

          {/* Auto cleanup toggle */}
          <div className="flex items-center justify-between gap-4 pt-3">
            <div>
              <span className="text-sm font-semibold text-white block">Pembersihan Otomatis</span>
              <span className="text-xs text-[#9ca3af]">
                Hapus riwayat lama melebihi batas secara otomatis
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoCleanupEnabled}
                onChange={(e) => setAutoCleanupEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1c1c1c] border border-[#282828] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

