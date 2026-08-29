export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'EVENT';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class DiagnosticLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.logInfo('System', 'Diagnostic logging system initialized.');
  }

  private addEntry(level: LogLevel, source: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      data: data !== undefined ? (typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data) : undefined,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notify();
  }

  public logInfo(source: string, message: string, data?: any) {
    this.addEntry('INFO', source, message, data);
  }

  public logWarn(source: string, message: string, data?: any) {
    this.addEntry('WARN', source, message, data);
  }

  public logError(source: string, message: string, data?: any) {
    this.addEntry('ERROR', source, message, data);
  }

  public logEvent(source: string, message: string, data?: any) {
    this.addEntry('EVENT', source, message, data);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.logInfo('System', 'Log buffer cleared by user.');
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const logsCopy = this.getLogs();
    this.listeners.forEach((listener) => {
      try {
        listener(logsCopy);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });
  }

  public exportLogsAsText(): string {
    return this.logs
      .map((entry) => {
        const time = new Date(entry.timestamp).toISOString();
        const dataStr = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : '';
        return `[${time}] [${entry.level}] [${entry.source}] ${entry.message}${dataStr}`;
      })
      .join('\n\n');
  }
}

export const logger = new DiagnosticLogger();
