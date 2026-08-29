import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Copy, Check, Trash2, Terminal, AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import { logger, type LogEntry, type LogLevel } from '../services/diagnosticLogger';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | LogLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.source.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(q));
      return matchesLevel && matchesQuery;
    });
  }, [logs, filterLevel, searchQuery]);

  const handleCopyLogs = () => {
    const text = logger.exportLogsAsText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClearLogs = () => {
    logger.clearLogs();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#121212] border border-[#282828] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#181818] border-b border-[#282828] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Diagnostic Logs</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#242424] text-[#9ca3af] font-mono">
                  {filteredLogs.length} / {logs.length}
                </span>
              </h2>
              <p className="text-xs text-[#9ca3af]">Sistem pemantauan status, engine playback, & diagnostik API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2c2c2c] text-white text-xs font-semibold transition-colors"
              title="Salin semua log ke clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin!' : 'Copy Logs'}</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 transition-colors"
              title="Bersihkan log"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2c2c2c] text-[#9ca3af] hover:text-white transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3 bg-[#161616] border-b border-[#282828] flex-shrink-0">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['ALL', 'ERROR', 'WARN', 'EVENT', 'INFO'] as const).map((lvl) => {
              const isActive = filterLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? lvl === 'ERROR'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : lvl === 'WARN'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : lvl === 'EVENT'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : lvl === 'INFO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white text-black'
                      : 'bg-[#202020] text-[#9ca3af] hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  {lvl === 'ERROR' && <AlertCircle className="w-3 h-3" />}
                  {lvl === 'WARN' && <AlertTriangle className="w-3 h-3" />}
                  {lvl === 'EVENT' && <Zap className="w-3 h-3" />}
                  {lvl === 'INFO' && <Info className="w-3 h-3" />}
                  <span>{lvl}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#6b7280] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari log atau payload..."
              className="w-full bg-[#1c1c1c] border border-[#282828] focus:border-white/20 text-white text-xs pl-8 pr-7 py-1.5 rounded-lg outline-none placeholder:text-[#6b7280] font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#6b7280] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Log Viewer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-[#0c0c0c] select-text">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6b7280] py-16">
              <Terminal className="w-10 h-10 mb-2 opacity-40" />
              <p className="font-semibold">Tidak ada data log yang cocok</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const levelColor =
                log.level === 'ERROR'
                  ? 'text-red-400 bg-red-950/40 border-red-500/30'
                  : log.level === 'WARN'
                  ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                  : log.level === 'EVENT'
                  ? 'text-orange-400 bg-orange-950/40 border-orange-500/30'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';

              return (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#6b7280]">{dateStr}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${levelColor}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-white font-semibold">[{log.source}]</span>
                    <span className="text-[#d1d5db] flex-1 break-all">{log.message}</span>
                  </div>

                  {log.data !== undefined && (
                    <pre className="mt-1.5 p-2 rounded bg-[#080808] border border-[#1a1a1a] text-[11px] text-[#9ca3af] overflow-x-auto whitespace-pre-wrap leading-tight max-h-48 overflow-y-auto">
                      {typeof log.data === 'object'
                        ? JSON.stringify(log.data, null, 2)
                        : String(log.data)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-[#141414] border-t border-[#282828] flex items-center justify-between text-xs text-[#6b7280] font-mono flex-shrink-0">
          <span>Pintasan: Ctrl+L / Cmd+L untuk membuka/menutup</span>
          <span>Buffer: {logs.length} / 500 entri</span>
        </div>
      </div>
    </div>
  );
};
