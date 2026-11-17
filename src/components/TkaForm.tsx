import { GraduationCap, Play } from 'lucide-react';
import {
  ALL_KELAS_OPTIONS,
  DIFFICULTY_LEVELS,
  FASE_OPTIONS,
  KELAS_BY_FASE,
  LEARNING_EXPERIENCES,
  TKA_BENTUK_SOAL,
  TKA_JENIS_SOAL_OPTIONS,
  TKA_SUBDOMAIN_MAP,
} from '../data/curriculumData';
import {
  DifficultyLevel,
  LearningExperience,
  TkaFormState,
  TkaJenisSoal,
} from '../types/assessment';
import { BentukSoalSelector } from './BentukSoalSelector';

interface TkaFormProps {
  value: TkaFormState;
  onChange: (next: TkaFormState) => void;
  onSchoolNameChange: (name: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

const JENIS_SOAL_STYLE: Record<
  TkaJenisSoal,
  { cardActive: string; labelColor: string; checkbox: string }
> = {
  'Literasi Membaca': {
    cardActive:
      'border-sky-500 bg-sky-50/85 dark:bg-sky-950/40 dark:border-sky-500',
    labelColor: 'text-sky-700 dark:text-sky-300',
    checkbox: 'accent-sky-600',
  },
  Numerasi: {
    cardActive:
      'border-violet-500 bg-violet-50/85 dark:bg-violet-950/40 dark:border-violet-500',
    labelColor: 'text-violet-700 dark:text-violet-300',
    checkbox: 'accent-violet-600',
  },
  Sains: {
    cardActive:
      'border-emerald-500 bg-emerald-50/85 dark:bg-emerald-950/40 dark:border-emerald-500',
    labelColor: 'text-emerald-700 dark:text-emerald-300',
    checkbox: 'accent-emerald-600',
  },
};

const DIFFICULTY_STYLE: Record<
  DifficultyLevel,
  { active: string; text: string; checkbox: string }
> = {
  LOTS: {
    active:
      'border-emerald-500 bg-emerald-50/85 dark:bg-emerald-950/35 dark:border-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-300',
    checkbox: 'accent-emerald-600',
  },
  MOTS: {
    active:
      'border-amber-500 bg-amber-50/85 dark:bg-amber-950/35 dark:border-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    checkbox: 'accent-amber-600',
  },
  HOTS: {
    active:
      'border-rose-500 bg-rose-50/85 dark:bg-rose-950/35 dark:border-rose-500',
    text: 'text-rose-800 dark:text-rose-300',
    checkbox: 'accent-rose-600',
  },
};

const EXPERIENCE_STYLE: Record<
  LearningExperience,
  { active: string; text: string; checkbox: string }
> = {
  Memahami: {
    active:
      'border-sky-500 bg-sky-50/85 dark:bg-sky-950/35 dark:border-sky-500',
    text: 'text-sky-800 dark:text-sky-300',
    checkbox: 'accent-sky-600',
  },
  Mengaplikasi: {
    active:
      'border-indigo-500 bg-indigo-50/85 dark:bg-indigo-950/35 dark:border-indigo-500',
    text: 'text-indigo-800 dark:text-indigo-300',
    checkbox: 'accent-indigo-600',
  },
  Merefleksi: {
    active:
      'border-teal-500 bg-teal-50/85 dark:bg-teal-950/35 dark:border-teal-500',
    text: 'text-teal-800 dark:text-teal-300',
    checkbox: 'accent-teal-600',
  },
};

export function TkaForm({
  value,
  onChange,
  onSchoolNameChange,
  onSubmit,
  isGenerating,
}: TkaFormProps) {
  const totalQuestions = Object.values(value.bentukSoal).reduce(
    (sum, n) => sum + n,
    0
  );
  const totalBatches = Math.ceil(totalQuestions / 10);

  const handleFaseChange = (fase: string) => {
    const nextKelasList = KELAS_BY_FASE[fase] || ['Kelas X'];
    onChange({
      ...value,
      fase,
      kelas: nextKelasList.includes(value.kelas)
        ? value.kelas
        : nextKelasList[0],
    });
  };

  const toggleJenisSoal = (jenis: TkaJenisSoal) => {
    const exists = value.jenisSoal.includes(jenis);
    const nextJenis = exists
      ? value.jenisSoal.filter((j) => j !== jenis)
      : [...value.jenisSoal, jenis];

    const validSubdomains = new Set(
      nextJenis.flatMap((j) => TKA_SUBDOMAIN_MAP[j])
    );
    let nextSubdomains = value.subdomain.filter((s) => validSubdomains.has(s));

    if (!exists && TKA_SUBDOMAIN_MAP[jenis]?.[0]) {
      const firstNewSub = TKA_SUBDOMAIN_MAP[jenis][0];
      if (!nextSubdomains.includes(firstNewSub)) {
        nextSubdomains = [...nextSubdomains, firstNewSub];
      }
    }

    onChange({
      ...value,
      jenisSoal: nextJenis,
      subdomain: nextSubdomains,
    });
  };

  const toggleSubdomain = (sub: string) => {
    const exists = value.subdomain.includes(sub);
    const next = exists
      ? value.subdomain.filter((s) => s !== sub)
      : [...value.subdomain, sub];
    onChange({ ...value, subdomain: next });
  };

  const toggleDifficulty = (diff: DifficultyLevel) => {
    const exists = value.tingkatKesulitan.includes(diff);
    const next = exists
      ? value.tingkatKesulitan.filter((d) => d !== diff)
      : [...value.tingkatKesulitan, diff];
    onChange({ ...value, tingkatKesulitan: next });
  };

  const toggleExperience = (exp: LearningExperience) => {
    const exists = value.pengalamanBelajar.includes(exp);
    const next = exists
      ? value.pengalamanBelajar.filter((e) => e !== exp)
      : [...value.pengalamanBelajar, exp];
    onChange({ ...value, pengalamanBelajar: next });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden"
    >
      <div className="h-1 w-full theme-spectrum-bar" />

      <div className="p-5 sm:p-6 space-y-6">
        <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl theme-gradient-bg text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Generator Soal TKA &amp; Asesmen Nasional (AN)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Susun instrumen Literasi Membaca, Numerasi, dan Sains berbasis stimulus kontekstual dan kisi-kisi standar Pusmendik.
            </p>
          </div>
        </div>

        {/* 1, 2, 3: Satuan Pendidikan, Fase, Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="w-5 h-5 rounded-md bg-sky-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                1
              </span>
              <span>Nama Satuan Pendidikan</span>
            </label>
            <input
              type="text"
              required
              value={value.namaSatuanPendidikan}
              onChange={(e) => onSchoolNameChange(e.target.value)}
              placeholder="Contoh: SMA Negeri 1 Kudus"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="tka-fase"
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                2
              </span>
              <span>Fase</span>
            </label>
            <select
              id="tka-fase"
              value={value.fase}
              onChange={(e) => handleFaseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            >
              {FASE_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tka-kelas"
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              <span className="w-5 h-5 rounded-md bg-teal-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                3
              </span>
              <span>Kelas</span>
            </label>
            <select
              id="tka-kelas"
              value={value.kelas}
              onChange={(e) => onChange({ ...value, kelas: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            >
              {ALL_KELAS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4: Jenis Soal & Subdomain Multi-Select */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-5 h-5 rounded-md bg-violet-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                  4
                </span>
                <span>Jenis Soal Asesmen Nasional (Pilih satu atau lebih)</span>
              </label>
              <span className="text-xs font-semibold theme-accent-text tabular-nums">
                {value.jenisSoal.length} dipilih
              </span>
            </div>
            <div className="space-y-2">
              {TKA_JENIS_SOAL_OPTIONS.map((jenis) => {
                const active = value.jenisSoal.includes(jenis);
                const domainStyle = JENIS_SOAL_STYLE[jenis];
                return (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => toggleJenisSoal(jenis)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      active
                        ? domainStyle.cardActive
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className={`w-4 h-4 rounded border-slate-300 pointer-events-none ${domainStyle.checkbox}`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          active
                            ? domainStyle.labelColor
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {jenis}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {TKA_SUBDOMAIN_MAP[jenis].length} subdomain
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subdomain Spesifik (Pilih satu atau lebih)
              </label>
              <span className="text-xs font-semibold theme-accent-text tabular-nums">
                {value.subdomain.length} dipilih
              </span>
            </div>

            {value.jenisSoal.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                Pilih minimal satu Jenis Soal di sebelah kiri untuk menampilkan daftar Subdomain.
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {value.jenisSoal.map((jenis) => {
                  const domainStyle = JENIS_SOAL_STYLE[jenis];
                  return (
                    <div key={jenis} className="space-y-1.5">
                      <div
                        className={`text-[11px] font-bold ${domainStyle.labelColor}`}
                      >
                        {jenis}
                      </div>
                      <div className="space-y-1.5">
                        {TKA_SUBDOMAIN_MAP[jenis].map((sub) => {
                          const active = value.subdomain.includes(sub);
                          return (
                            <label
                              key={sub}
                              className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                                active
                                  ? domainStyle.cardActive
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggleSubdomain(sub)}
                                className={`mt-0.5 w-4 h-4 rounded border-slate-300 shrink-0 cursor-pointer ${domainStyle.checkbox}`}
                              />
                              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug">
                                {sub}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5: Bentuk Soal & Jumlah Soal Dinamis */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                5
              </span>
              <span>Bentuk Soal &amp; Jumlah Soal Dinamis (Pilih satu atau lebih)</span>
            </label>
            <span className="text-xs font-semibold theme-accent-text tabular-nums">
              {Object.keys(value.bentukSoal).length} bentuk dipilih
            </span>
          </div>
          <BentukSoalSelector
            options={TKA_BENTUK_SOAL}
            selected={value.bentukSoal}
            onChange={(bentukSoal) => onChange({ ...value, bentukSoal })}
          />
        </div>

        {/* 6: Tingkat Kesulitan */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
              6
            </span>
            <span>Tingkat Kesulitan (Multi-Select — dapat memilih ketiganya sekaligus)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DIFFICULTY_LEVELS.map((lvl) => {
              const active = value.tingkatKesulitan.includes(lvl.id);
              const style = DIFFICULTY_STYLE[lvl.id];
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => toggleDifficulty(lvl.id)}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    active
                      ? style.active
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={active}
                      readOnly
                      className={`w-4 h-4 rounded border-slate-300 pointer-events-none ${style.checkbox}`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        active
                          ? style.text
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {lvl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7: Pengalaman Belajar */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
              7
            </span>
            <span>Pengalaman Belajar yang Ditargetkan (Multi-Select)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {LEARNING_EXPERIENCES.map((exp) => {
              const active = value.pengalamanBelajar.includes(exp.id);
              const style = EXPERIENCE_STYLE[exp.id];
              return (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => toggleExperience(exp.id)}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    active
                      ? style.active
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={active}
                      readOnly
                      className={`w-4 h-4 rounded border-slate-300 pointer-events-none ${style.checkbox}`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        active
                          ? style.text
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {exp.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {exp.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Primary CTA */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
            <span className="font-bold theme-accent-text">
              Total: {totalQuestions} Butir Soal
            </span>
            <span className="mx-2 text-slate-400">·</span>
            <span>
              {totalBatches > 0
                ? `${totalBatches} Batch Sekuensial (maks. 10 soal/batch)`
                : 'Pilih minimal 1 bentuk soal'}
            </span>
          </div>

          <button
            type="submit"
            disabled={
              isGenerating ||
              totalQuestions === 0 ||
              value.jenisSoal.length === 0 ||
              value.subdomain.length === 0 ||
              value.tingkatKesulitan.length === 0 ||
              value.pengalamanBelajar.length === 0
            }
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg theme-btn-primary disabled:bg-none disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            <Play className="w-4 h-4" />
            <span>{isGenerating ? 'Sedang Memproses...' : 'Generate Soal'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
