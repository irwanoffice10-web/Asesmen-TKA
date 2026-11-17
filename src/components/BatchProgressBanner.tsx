import { AlertCircle, CheckCircle2, Loader2, Square } from 'lucide-react';
import { BatchProgressState } from '../types/assessment';

interface BatchProgressBannerProps {
  progress: BatchProgressState;
  onStop: () => void;
}

export function BatchProgressBanner({
  progress,
  onStop,
}: BatchProgressBannerProps) {
  if (progress.status === 'idle') return null;

  const percent =
    progress.totalRequested > 0
      ? Math.min(
          100,
          Math.round((progress.generatedCount / progress.totalRequested) * 100)
        )
      : 0;

  const isRunning = progress.status === 'running';
  const isError = progress.status === 'error';
  const isCompleted = progress.status === 'completed';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${
        isError
          ? 'border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30'
          : isCompleted
            ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30'
            : 'theme-soft-surface'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {isRunning ? (
            <Loader2 className="w-5 h-5 theme-accent-text animate-spin shrink-0 mt-0.5" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progress.message}{' '}
              <span className="theme-accent-text">
                {percent}%
              </span>
            </div>
            {progress.error && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Detail kesalahan: {progress.error}
              </p>
            )}
            {isRunning && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Soal dan tabel kisi-kisi ditampilkan secara bertahap setiap batch selesai.
              </p>
            )}
          </div>
        </div>

        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Hentikan Proses</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isError
              ? 'bg-rose-600'
              : isCompleted
                ? 'bg-emerald-600'
                : 'theme-gradient-bg'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
