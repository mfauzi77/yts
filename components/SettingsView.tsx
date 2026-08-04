import React, { useState, useEffect, useCallback } from 'react';
import type { VideoItem, Playlist } from '../types';

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
    historyMaxAgeDays,
    setHistoryMaxAgeDays,
    autoCleanupEnabled,
    setAutoCleanupEnabled,
    autoClearCacheOnStartup,
    setAutoClearCacheOnStartup,
    sleepTimerRemaining,
    onSetSleepTimer,
    onBack,
}) => {
    const [stats, setStats] = useState<StorageStats>({
        usageMB: 0,
        quotaMB: 0,
        percentUsed: 0,
        localStorageSizeKB: 0,
        cachesCount: 0,
    });
    
    const [isCleaning, setIsCleaning] = useState(false);
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
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Calculate Storage Stats
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
            console.warn('Could not calculate LocalStorage size', e);
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
                console.warn('Could not estimate navigator.storage', e);
            }
        }

        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                cachesCount = keys.length;
            } catch (e) {
                console.warn('Could not access caches keys', e);
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

    // Cleanup Old History Tracks
    const handleTrimHistory = () => {
        const initialCount = history.length;
        let updated = [...history];

        // Filter by age if configured (> 0)
        if (historyMaxAgeDays > 0) {
            const cutoffTime = Date.now() - historyMaxAgeDays * 24 * 60 * 60 * 1000;
            updated = updated.filter(item => {
                const playedAt = (item as any)._playedAt;
                if (!playedAt) return true; // Keep if no timestamp recorded
                return playedAt >= cutoffTime;
            });
        }

        // Limit by count
        if (updated.length > historyLimit) {
            updated = updated.slice(0, historyLimit);
        }

        setHistory(updated);
        const removed = initialCount - updated.length;
        showToast(removed > 0 ? `Berhasil memangkas ${removed} lagu lama dari riwayat.` : 'Riwayat sudah optimal.');
    };

    // Clear All History
    const handleClearAllHistory = () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pemutaran?')) {
            const count = history.length;
            setHistory([]);
            showToast(`Berhasil menghapus ${count} lagu dari riwayat.`);
        }
    };

    // Clear Search History
    const handleClearSearchHistory = () => {
        const count = searchHistory.length;
        setSearchHistory([]);
        showToast(`Berhasil menghapus ${count} kata kunci pencarian.`);
    };

    // Clear Browser Caches
    const handleClearCacheStorage = async () => {
        setIsCleaning(true);
        let deletedCaches = 0;
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                for (const name of cacheNames) {
                    await caches.delete(name);
                    deletedCaches++;
                }
            } catch (e) {
                console.error('Error clearing caches:', e);
            }
        }
        await calculateStorageStats();
        setIsCleaning(false);
        showToast(deletedCaches > 0 ? `Berhasil membersihkan ${deletedCaches} cache penyimpanan browser.` : 'Cache browser sudah bersih.');
    };

    // Clear Offline Metadata
    const handleClearOfflineMetadata = () => {
        if (window.confirm('Apakah Anda yakin ingin mengosongkan daftar koleksi offline?')) {
            const count = offlineItems.length;
            setOfflineItems([]);
            showToast(`Berhasil menghapus ${count} item dari koleksi offline.`);
        }
    };

    // Run Full Optimization
    const handleRunFullOptimization = async () => {
        setIsCleaning(true);
        let freedKB = 0;

        // 1. Trim history based on limits & age
        let updatedHistory = [...history];
        if (historyMaxAgeDays > 0) {
            const cutoffTime = Date.now() - historyMaxAgeDays * 24 * 60 * 60 * 1000;
            updatedHistory = updatedHistory.filter(item => {
                const playedAt = (item as any)._playedAt;
                return !playedAt || playedAt >= cutoffTime;
            });
        }
        if (updatedHistory.length > historyLimit) {
            updatedHistory = updatedHistory.slice(0, historyLimit);
        }
        setHistory(updatedHistory);

        // 2. Clear expired caches
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                for (const name of cacheNames) {
                    if (name.includes('data') || name.includes('image')) {
                        await caches.delete(name);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        await calculateStorageStats();
        setIsCleaning(false);
        showToast('Pembersihan & optimasi penyimpanan selesai!');
    };

    return (
        <div className="space-y-6 pb-24 text-white max-w-4xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-neutral-800 text-gray-300 hover:text-white transition-colors"
                        >
                            <i className="fas fa-arrow-left text-lg"></i>
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <i className="fas fa-cog text-brand-red"></i> Pengaturan & Optimasi Penyimpanan
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            Kelola pembersihan riwayat otomatis, cache browser, dan optimasi memori lokal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="p-3 bg-brand-red/20 border border-brand-red/50 text-white text-sm rounded-lg flex items-center justify-between animate-fade-in">
                    <span className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-brand-red"></i> {toastMessage}
                    </span>
                    <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            {/* Sleep Timer Card */}
            <div className="bg-dark-card border border-neutral-800 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
                    <div>
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <i className="fas fa-moon text-indigo-400"></i> Pengatur Waktu Tidur (Sleep Timer)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Otomatis menghentikan pemutaran musik setelah durasi waktu yang Anda tentukan, dilengkapi transisi halus (Volume Fade-Out 10 detik terakhir).
                        </p>
                    </div>
                    {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            <span>{formatTimerSeconds(sleepTimerRemaining)}</span>
                        </div>
                    )}
                </div>

                {sleepTimerRemaining !== null && sleepTimerRemaining > 0 ? (
                    <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                <i className="fas fa-bed text-lg"></i>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-200">Timer Aktif: {formatTimerSeconds(sleepTimerRemaining)} tersisa</p>
                                <p className="text-xs text-indigo-300/80">Pemutaran musik akan otomatis dihentikan secara halus dengan fade-out 10 detik terakhir.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                onSetSleepTimer(null);
                                showToast('Pengatur waktu tidur dibatalkan.');
                            }}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors border border-neutral-700 flex-shrink-0"
                        >
                            <i className="fas fa-stop-circle mr-1.5"></i> Batalkan Timer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-gray-300">Pilih durasi pengatur waktu tidur:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[15, 30, 45, 60, 90].map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => {
                                        onSetSleepTimer(mins);
                                        showToast(`Pengatur waktu tidur diatur ke ${mins} menit.`);
                                    }}
                                    className="py-2.5 px-3 bg-dark-surface hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-500/50 text-xs font-semibold rounded-xl text-white transition-all flex flex-col items-center justify-center gap-1 group"
                                >
                                    <i className="fas fa-clock text-indigo-400 group-hover:scale-110 transition-transform"></i>
                                    <span>{mins} Menit</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap">Atau masukan menit khusus:</span>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="number"
                                    min="1"
                                    max="600"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    placeholder="Contoh: 20"
                                    className="bg-neutral-800 text-white text-xs rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-indigo-500 w-full sm:w-32"
                                />
                                <button
                                    onClick={() => {
                                        const mins = parseInt(customMinutes, 10);
                                        if (!isNaN(mins) && mins > 0) {
                                            onSetSleepTimer(mins);
                                            showToast(`Pengatur waktu tidur diatur ke ${mins} menit.`);
                                            setCustomMinutes('');
                                        }
                                    }}
                                    disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Set Timer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Storage Usage Dashboard Card */}
            <div className="bg-dark-card border border-neutral-800 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <i className="fas fa-hdd text-yellow-500"></i> Ringkasan Penggunaan Penyimpanan
                    </h3>
                    <button
                        onClick={calculateStorageStats}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-dark-surface p-3 rounded-lg border border-neutral-800/80">
                        <p className="text-xs text-gray-400">Penyimpanan Browser (Estimasi)</p>
                        <p className="text-xl font-bold text-white mt-1">
                            {stats.usageMB > 0 ? `${stats.usageMB} MB` : `${stats.localStorageSizeKB} KB`}
                        </p>
                        {stats.quotaMB > 0 && (
                            <p className="text-[10px] text-gray-500 mt-0.5">dari {stats.quotaMB} MB kuota</p>
                        )}
                    </div>
                    <div className="bg-dark-surface p-3 rounded-lg border border-neutral-800/80">
                        <p className="text-xs text-gray-400">Total Riwayat Putar</p>
                        <p className="text-xl font-bold text-white mt-1">{history.length} lagu</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Maks. batas: {historyLimit}</p>
                    </div>
                    <div className="bg-dark-surface p-3 rounded-lg border border-neutral-800/80">
                        <p className="text-xs text-gray-400">Cache & Koleksi Offline</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.cachesCount} cache storage</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{offlineItems.length} track offline</p>
                    </div>
                </div>

                {stats.usageMB > 0 && (
                    <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Penggunaan Memori Web</span>
                            <span>{stats.percentUsed}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-brand-red transition-all duration-500"
                                style={{ width: `${Math.min(Math.max(stats.percentUsed, 2), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Auto-Cleanup Settings Section */}
            <div className="bg-dark-card border border-neutral-800 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div>
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <i className="fas fa-magic text-purple-400"></i> Pembersihan Otomatis (Auto Storage Cleanup)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Otomatis memangkas trek lama dan membersihkan cache saat aplikasi digunakan.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoCleanupEnabled}
                            onChange={(e) => setAutoCleanupEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                </div>

                <div className={`space-y-4 transition-opacity ${autoCleanupEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {/* History Item Limit */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-dark-surface rounded-lg border border-neutral-800">
                        <div>
                            <p className="text-sm font-medium">Batas Maksimal Lagu di Riwayat</p>
                            <p className="text-xs text-gray-400">Lagu lama di luar jumlah ini akan dihapus otomatis.</p>
                        </div>
                        <select
                            value={historyLimit}
                            onChange={(e) => setHistoryLimit(Number(e.target.value))}
                            className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:outline-none focus:border-brand-red"
                        >
                            <option value={15}>15 Lagu</option>
                            <option value={25}>25 Lagu (Rekomendasi)</option>
                            <option value={50}>50 Lagu</option>
                            <option value={100}>100 Lagu</option>
                        </select>
                    </div>

                    {/* History Max Age Days */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-dark-surface rounded-lg border border-neutral-800">
                        <div>
                            <p className="text-sm font-medium">Hapus Riwayat berdasarkan Usia</p>
                            <p className="text-xs text-gray-400">Otomatis hapus trek riwayat yang lebih tua dari batas ini.</p>
                        </div>
                        <select
                            value={historyMaxAgeDays}
                            onChange={(e) => setHistoryMaxAgeDays(Number(e.target.value))}
                            className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:outline-none focus:border-brand-red"
                        >
                            <option value={7}>Lebih dari 7 Hari</option>
                            <option value={14}>Lebih dari 14 Hari</option>
                            <option value={30}>Lebih dari 30 Hari (Rekomendasi)</option>
                            <option value={0}>Jangan Hapus berdasarkan Usia</option>
                        </select>
                    </div>

                    {/* Auto Clear Cache on Startup */}
                    <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg border border-neutral-800">
                        <div>
                            <p className="text-sm font-medium">Bersihkan Cache API saat Aplikasi Dibuka</p>
                            <p className="text-xs text-gray-400">Memastikan data pencarian dan rekomendasi selalu segar.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoClearCacheOnStartup}
                            onChange={(e) => setAutoClearCacheOnStartup(e.target.checked)}
                            className="w-4 h-4 accent-brand-red rounded cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Manual Storage Tools Section */}
            <div className="bg-dark-card border border-neutral-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                    <i className="fas fa-broom text-blue-400"></i> Alat Pembersihan Manual
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Trim History */}
                    <div className="p-3 bg-dark-surface rounded-lg border border-neutral-800 flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Pangkas Riwayat Pemutaran</p>
                                <span className="text-xs text-gray-400">{history.length} lagu</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Hapus trek tua sesuai batas ({historyLimit} lagu / {historyMaxAgeDays > 0 ? `${historyMaxAgeDays} hari` : 'tanpa batas hari'}).
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleTrimHistory}
                                className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg text-white transition-colors"
                            >
                                <i className="fas fa-[#ff0000] text-brand-red mr-1"></i> Pangkas Tua
                            </button>
                            <button
                                onClick={handleClearAllHistory}
                                className="py-1.5 px-3 bg-red-900/30 hover:bg-red-800/50 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                            >
                                Kosongkan
                            </button>
                        </div>
                    </div>

                    {/* Clear Search History */}
                    <div className="p-3 bg-dark-surface rounded-lg border border-neutral-800 flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Riwayat Pencarian</p>
                                <span className="text-xs text-gray-400">{searchHistory.length} kata kunci</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Hapus saran kata kunci pencarian yang tersimpan lokal.
                            </p>
                        </div>
                        <button
                            onClick={handleClearSearchHistory}
                            disabled={searchHistory.length === 0}
                            className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-colors"
                        >
                            Hapus Riwayat Cari
                        </button>
                    </div>

                    {/* Clear Cache Storage */}
                    <div className="p-3 bg-dark-surface rounded-lg border border-neutral-800 flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Cache Browser & Thumbnail</p>
                                <span className="text-xs text-gray-400">{stats.cachesCount} lokasi cache</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Hapus gambar thumbnail YouTube dan cache API yang tersimpan sementara.
                            </p>
                        </div>
                        <button
                            onClick={handleClearCacheStorage}
                            disabled={isCleaning}
                            className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-colors"
                        >
                            {isCleaning ? 'Membersihkan...' : 'Bersihkan CacheStorage'}
                        </button>
                    </div>

                    {/* Clear Offline Items */}
                    <div className="p-3 bg-dark-surface rounded-lg border border-neutral-800 flex flex-col justify-between space-y-3">
                        <div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Metadata Koleksi Offline</p>
                                <span className="text-xs text-gray-400">{offlineItems.length} item</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Reset daftar koleksi offline lokal jika terdapat data kadaluarsa.
                            </p>
                        </div>
                        <button
                            onClick={handleClearOfflineMetadata}
                            disabled={offlineItems.length === 0}
                            className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-colors"
                        >
                            Kosongkan Metadata Offline
                        </button>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                    <button
                        onClick={handleRunFullOptimization}
                        disabled={isCleaning}
                        className="w-full py-3 px-4 bg-brand-red hover:bg-red-700 disabled:opacity-50 text-sm font-bold rounded-xl text-white shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <i className={`fas ${isCleaning ? 'fa-spinner fa-spin' : 'fa-rocket'}`}></i>
                        {isCleaning ? 'Jalankan Optimasi...' : 'Jalankan Optimasi Penyimpanan Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
};
