import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'Terjadi kesalahan aplikasi yang tidak terduga.';
    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed?.error) {
        message = `Kendala akses database (${parsed.operationType || 'read'} pada ${parsed.path || '-'}): ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 app-colorful-canvas text-slate-900 dark:text-slate-100">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Terjadi Kendala Sistem
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aplikasi mendeteksi gangguan sinkronisasi data.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
              {this.state.errorMessage}
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl theme-btn-primary text-sm font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Portal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
