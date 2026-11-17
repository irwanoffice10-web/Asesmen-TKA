import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  RotateCcw,
} from 'lucide-react';
import {
  AssessmentMetadata,
  KopSuratConfig,
  QuestionItem,
} from '../types/assessment';
import { getQuestionDisplayImage } from '../utils/illustrationHelper';

interface CbtSimulationTabProps {
  questions: QuestionItem[];
  kop: KopSuratConfig;
  meta: AssessmentMetadata;
}

function parseMinutes(alokasi: string): number {
  const match = alokasi.match(/\d+/);
  if (match) {
    const mins = Number(match[0]);
    if (Number.isFinite(mins) && mins > 0) return mins;
  }
  return 90;
}

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function CbtSimulationTab({
  questions,
  kop,
  meta,
}: CbtSimulationTabProps) {
  const initialSeconds = useMemo(
    () => parseMinutes(kop.alokasiWaktu) * 60,
    [kop.alokasiWaktu]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Keep currentIndex within bounds if incremental questions change
  useEffect(() => {
    if (currentIndex >= questions.length && questions.length > 0) {
      setCurrentIndex(questions.length - 1);
    }
  }, [questions.length, currentIndex]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isComplexChoice =
    currentQ.bentuk_soal.toLowerCase().includes('kompleks') ||
    currentQ.bentuk_soal.toLowerCase().includes('benar');
  const hasOptions = currentQ.opsi_jawaban.length > 0;

  const handleSelectSingle = (opt: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.nomor]: opt }));
  };

  const handleToggleMulti = (opt: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const existing = Array.isArray(prev[currentQ.nomor])
        ? (prev[currentQ.nomor] as string[])
        : [];
      const next = existing.includes(opt)
        ? existing.filter((item) => item !== opt)
        : [...existing, opt];
      return { ...prev, [currentQ.nomor]: next };
    });
  };

  const handleTextAnswer = (text: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.nomor]: text }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [currentQ.nomor]: !prev[currentQ.nomor] }));
  };

  const handleResetSimulation = () => {
    setAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setSecondsLeft(initialSeconds);
    setIsSubmitted(false);
  };

  const isAnswered = (nomor: number) => {
    const val = answers[nomor];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'string' && val.trim().length > 0;
  };

  const answeredCount = questions.filter((q) => isAnswered(q.nomor)).length;
  const displayImg = getQuestionDisplayImage(currentQ);

  const fontClass =
    fontScale === 'sm'
      ? 'text-[14.5px]'
      : fontScale === 'lg'
        ? 'text-[17.5px]'
        : 'text-[16px]';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Pusmendik-style CBT Top Bar */}
      <div className="theme-gradient-bg text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/15">
        <div>
          <div className="text-xs text-white/80 font-medium">
            {kop.namaKegiatan || meta.judulAsesmen}
          </div>
          <div className="text-sm sm:text-base font-bold">
            {meta.subJudul} · {meta.kelas}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Font size switcher */}
          <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 text-xs">
            <span className="px-2 text-white/85 hidden sm:inline">
              Ukuran Teks:
            </span>
            {(['sm', 'md', 'lg'] as const).map((sz, i) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontScale(sz)}
                className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                  fontScale === sz
                    ? 'bg-white text-slate-900'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                {i === 0 ? 'A-' : i === 1 ? 'A' : 'A+'}
              </button>
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-black/25 px-3.5 py-1.5 rounded-lg font-mono-tabular text-sm font-semibold">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{formatSeconds(secondsLeft)}</span>
          </div>
        </div>
      </div>

      {/* Submitted Banner */}
      {isSubmitted && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Simulasi Ujian Selesai
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 tabular-nums">
                Anda menjawab {answeredCount} dari {questions.length} butir soal.
                Sekarang Anda dapat meninjau kunci jawaban dan pembahasan pada setiap nomor soal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetSimulation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ulangi Simulasi</span>
          </button>
        </div>
      )}

      {/* Main CBT Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Center: Active Question Stage */}
        <div className="lg:col-span-8 xl:col-span-9 p-5 sm:p-7 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          <div className="space-y-5">
            {/* Question Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                SOAL NO. {currentQ.nomor} dari {questions.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentQ.bentuk_soal}
              </div>
            </div>

            {/* Stimulus */}
            {currentQ.stimulus && (
              <div
                className={`p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-stimulus ${fontClass} leading-[1.7] text-slate-800 dark:text-slate-200 max-w-[75ch] whitespace-pre-line`}
              >
                {currentQ.stimulus}
              </div>
            )}

            {/* Image if present */}
            {displayImg && (
              <div>
                <img
                  src={displayImg}
                  alt={
                    currentQ.deskripsi_gambar ||
                    `Visual Soal ${currentQ.nomor}`
                  }
                  referrerPolicy="no-referrer"
                  className="max-h-72 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1.5"
                />
              </div>
            )}

            {/* Question Stem */}
            <div
              className={`${fontClass} font-medium leading-relaxed text-slate-900 dark:text-slate-100 max-w-[75ch] whitespace-pre-line`}
            >
              {currentQ.pertanyaan}
            </div>

            {/* Student Answer Input Area */}
            {hasOptions ? (
              <div className="space-y-2.5 pt-1">
                {currentQ.opsi_jawaban.map((opt, idx) => {
                  const selected = isComplexChoice
                    ? Array.isArray(answers[currentQ.nomor]) &&
                      (answers[currentQ.nomor] as string[]).includes(opt)
                    : answers[currentQ.nomor] === opt;

                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                        isSubmitted ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        selected
                          ? 'theme-soft-surface border'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type={isComplexChoice ? 'checkbox' : 'radio'}
                        name={`cbt-q-${currentQ.nomor}`}
                        checked={selected}
                        disabled={isSubmitted}
                        onChange={() =>
                          isComplexChoice
                            ? handleToggleMulti(opt)
                            : handleSelectSingle(opt)
                        }
                        className="mt-1 w-4 h-4 text-sky-700 border-slate-300 focus:ring-sky-600 shrink-0"
                      />
                      <span className="text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed">
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Ketik Jawaban Anda:
                </label>
                <textarea
                  rows={4}
                  disabled={isSubmitted}
                  value={
                    typeof answers[currentQ.nomor] === 'string'
                      ? (answers[currentQ.nomor] as string)
                      : ''
                  }
                  onChange={(e) => handleTextAnswer(e.target.value)}
                  placeholder="Tuliskan jawaban atau uraian analisis Anda di sini..."
                  className="w-full p-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            )}

            {/* Show Key & Discussion ONLY after student submits CBT */}
            {isSubmitted && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                <div className="font-bold text-emerald-700 dark:text-emerald-400">
                  Kunci Jawaban Resmi: {currentQ.kunci_jawaban}
                </div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Pembahasan:{' '}
                  </span>
                  {currentQ.pembahasan}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              disabled={isSubmitted}
              onClick={toggleFlag}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                flagged[currentQ.nomor]
                  ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Ragu-ragu</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(questions.length - 1, i + 1)
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg theme-btn-primary text-sm font-semibold cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : !isSubmitted ? (
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Ujian</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Ujian Telah Dikirim
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Question Number Navigation Grid */}
        <aside className="lg:col-span-4 xl:col-span-3 p-5 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Daftar Nomor Soal
              </h3>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                {answeredCount}/{questions.length} Dijawab
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isActive = idx === currentIndex;
                const isFlagged = Boolean(flagged[q.nomor]);
                const hasAns = isAnswered(q.nomor);

                let btnClass =
                  'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
                if (isFlagged) {
                  btnClass =
                    'border-amber-500 bg-amber-400 text-slate-950 font-bold';
                } else if (hasAns) {
                  btnClass =
                    'border-emerald-600 bg-emerald-600 text-white font-bold';
                }

                return (
                  <button
                    key={q.nomor}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg border text-xs tabular-nums transition-all cursor-pointer ${btnClass} ${
                      isActive ? 'ring-2 ring-[var(--theme-primary)] ring-offset-1 dark:ring-offset-slate-950' : ''
                    }`}
                  >
                    {q.nomor}
                  </button>
                );
              })}
            </div>

            {/* Clear Status Legend */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 inline-block" />
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>

          {!isSubmitted && (
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Selesai &amp; Kumpulkan Ujian
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
