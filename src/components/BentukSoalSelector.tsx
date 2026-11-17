import { QUESTION_COUNT_OPTIONS } from '../data/curriculumData';
import { QuestionCountOption } from '../types/assessment';

interface BentukSoalSelectorProps {
  options: string[];
  selected: Record<string, QuestionCountOption>;
  onChange: (next: Record<string, QuestionCountOption>) => void;
}

const SHAPE_ACTIVE_STYLES = [
  'border-sky-500 bg-sky-50/85 dark:bg-sky-950/40 dark:border-sky-500 text-sky-900 dark:text-sky-100',
  'border-indigo-500 bg-indigo-50/85 dark:bg-indigo-950/40 dark:border-indigo-500 text-indigo-900 dark:text-indigo-100',
  'border-emerald-500 bg-emerald-50/85 dark:bg-emerald-950/40 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100',
  'border-amber-500 bg-amber-50/85 dark:bg-amber-950/40 dark:border-amber-500 text-amber-900 dark:text-amber-100',
  'border-rose-500 bg-rose-50/85 dark:bg-rose-950/40 dark:border-rose-500 text-rose-900 dark:text-rose-100',
  'border-teal-500 bg-teal-50/85 dark:bg-teal-950/40 dark:border-teal-500 text-teal-900 dark:text-teal-100',
  'border-violet-500 bg-violet-50/85 dark:bg-violet-950/40 dark:border-violet-500 text-violet-900 dark:text-violet-100',
];

const CHECKBOX_ACCENTS = [
  'accent-sky-600',
  'accent-indigo-600',
  'accent-emerald-600',
  'accent-amber-600',
  'accent-rose-600',
  'accent-teal-600',
  'accent-violet-600',
];

export function BentukSoalSelector({
  options,
  selected,
  onChange,
}: BentukSoalSelectorProps) {
  const toggleShape = (shape: string) => {
    const next = { ...selected };
    if (next[shape]) {
      delete next[shape];
    } else {
      next[shape] = 5;
    }
    onChange(next);
  };

  const updateCount = (shape: string, count: QuestionCountOption) => {
    onChange({
      ...selected,
      [shape]: count,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {options.map((shape, index) => {
        const isChecked = Boolean(selected[shape]);
        const currentCount = selected[shape] || 5;
        const activeClass =
          SHAPE_ACTIVE_STYLES[index % SHAPE_ACTIVE_STYLES.length];
        const accentClass = CHECKBOX_ACCENTS[index % CHECKBOX_ACCENTS.length];

        return (
          <div
            key={shape}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-all duration-150 ${
              isChecked
                ? activeClass
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleShape(shape)}
                className={`w-4 h-4 rounded border-slate-300 shrink-0 cursor-pointer ${accentClass}`}
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
                {shape}
              </span>
            </label>

            {isChecked && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Jumlah:
                </span>
                <select
                  aria-label={`Jumlah soal untuk ${shape}`}
                  value={currentCount}
                  onChange={(e) =>
                    updateCount(shape, Number(e.target.value) as QuestionCountOption)
                  }
                  className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                >
                  {QUESTION_COUNT_OPTIONS.map((num) => (
                    <option key={num} value={num}>
                      {num} Soal
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
