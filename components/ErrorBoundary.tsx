import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center bg-dark-surface/50 border border-white/10 rounded-2xl mx-auto my-8 max-w-lg shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-brand-red"></i>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Terjadi Kendala Memuat Tampilan'}
          </h2>
          <p className="text-xs text-dark-subtext mb-5 max-w-md">
            {this.state.error?.message || 'Konten tidak dapat ditampilkan dengan benar saat ini.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2 rounded-full bg-brand-red hover:bg-red-700 text-white font-semibold text-sm transition-all transform active:scale-95 shadow-md flex items-center gap-2"
            >
              <i className="fas fa-redo-alt text-xs"></i>
              <span>Coba Lagi</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  window.location.reload();
                }
              }}
              className="px-5 py-2 rounded-full bg-dark-card hover:bg-dark-highlight text-white text-sm font-semibold transition-all border border-white/5"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
