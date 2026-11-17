import { ChangeEvent, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AiConfig,
  AssessmentMetadata,
  KopSuratConfig,
  QuestionItem,
} from '../types/assessment';
import { getQuestionDisplayImage } from '../utils/illustrationHelper';
import {
  OfficialKopAndIdentity,
  OfficialSignatureBlock,
} from './OfficialDocumentParts';

interface ExamPaperTabProps {
  questions: QuestionItem[];
  kop: KopSuratConfig;
  meta: AssessmentMetadata;
  aiConfig: AiConfig;
  onUpdateQuestion: (nomor: number, patch: Partial<QuestionItem>) => void;
}

export function ExamPaperTab({
  questions,
  kop,
  meta,
  aiConfig,
  onUpdateQuestion,
}: ExamPaperTabProps) {
  const [expandedSolutions, setExpandedSolutions] = useState<
    Record<number, boolean>
  >({});
  const [generatingImgFor, setGeneratingImgFor] = useState<number | null>(null);
  const [imgError, setImgError] = useState<{ nomor: number; msg: string } | null>(
    null
  );

  const toggleSolution = (nomor: number) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [nomor]: prev[nomor] === undefined ? false : !prev[nomor],
    }));
  };

  const handleUploadCustomImage =
    (nomor: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateQuestion(nomor, {
            custom_image: reader.result,
            image_deleted: false,
          });
          setImgError(null);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

  const handleDeleteImage = (nomor: number) => {
    onUpdateQuestion(nomor, {
      custom_image: undefined,
      image_deleted: true,
    });
  };

  const handleGenerateAiImage = async (q: QuestionItem) => {
    const promptText =
      q.deskripsi_gambar || `${q.materi}: ${q.pertanyaan.slice(0, 120)}`;
    setGeneratingImgFor(q.nomor);
    setImgError(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          apiKey: aiConfig.keys.gemini || '',
        }),
      });
      const data = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) {
        throw new Error(data.error || 'Gagal membuat ilustrasi AI.');
      }
      onUpdateQuestion(q.nomor, {
        custom_image: data.dataUrl,
        image_deleted: false,
      });
    } catch (err) {
      setImgError({
        nomor: q.nomor,
        msg: err instanceof Error ? err.message : 'Gagal membuat gambar.',
      });
    } finally {
      setGeneratingImgFor(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6">
      <OfficialKopAndIdentity
        kop={kop}
        meta={meta}
        totalQuestions={questions.length}
      />

      <div className="space-y-6 pt-2">
        {questions.map((q) => {
          const displayImg = getQuestionDisplayImage(q);
          const isSolutionOpen = expandedSolutions[q.nomor] !== false;
          const isGeneratingThisImg = generatingImgFor === q.nomor;

          const levelColor = q.level_kognitif.toUpperCase().includes('HOTS')
            ? 'text-rose-600 dark:text-rose-400'
            : q.level_kognitif.toUpperCase().includes('MOTS')
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400';

          return (
            <article
              key={q.nomor}
              className="avoid-page-break rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-5 space-y-4 shadow-xs"
            >
              {/* Metadata Header (Clean unboxed text with · separators) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold theme-accent-text tabular-nums">
                    Soal No. {q.nomor}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-indigo-700 dark:text-indigo-300">
                    {q.bentuk_soal}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={`font-bold ${levelColor}`}>
                    {q.level_kognitif}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-teal-700 dark:text-teal-300">
                    {q.pengalaman_belajar}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{q.materi}</span>
                </div>

                {/* Image Controls Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-xs font-semibold text-sky-800 dark:text-sky-200 cursor-pointer transition-colors">
                    <ImagePlus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Upload Gambar Sendiri</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadCustomImage(q.nomor)}
                      className="hidden"
                    />
                  </label>

                  {q.deskripsi_gambar && (
                    <button
                      type="button"
                      disabled={isGeneratingThisImg}
                      onClick={() => handleGenerateAiImage(q)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-xs font-semibold text-violet-800 dark:text-violet-200 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isGeneratingThisImg ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      )}
                      <span>
                        {isGeneratingThisImg
                          ? 'Membuat Gambar...'
                          : 'Buat Ilustrasi AI'}
                      </span>
                    </button>
                  )}

                  {displayImg && (
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(q.nomor)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Gambar</span>
                    </button>
                  )}
                </div>
              </div>

              {imgError && imgError.nomor === q.nomor && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900">
                  {imgError.msg}
                </div>
              )}

              {/* Stimulus Passage */}
              {q.stimulus && (
                <div className="p-4 rounded-lg bg-amber-50/40 dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 font-stimulus text-[15.5px] leading-[1.7] text-slate-800 dark:text-slate-200 max-w-[75ch] whitespace-pre-line">
                  {q.stimulus}
                </div>
              )}

              {/* Illustration Image Container */}
              {displayImg && (
                <div className="space-y-1.5">
                  <div className="inline-block rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2 max-w-full">
                    <img
                      src={displayImg}
                      alt={
                        q.deskripsi_gambar || `Ilustrasi Soal Nomor ${q.nomor}`
                      }
                      referrerPolicy="no-referrer"
                      className="max-h-72 w-auto object-contain rounded"
                    />
                  </div>
                  {q.deskripsi_gambar && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Deskripsi visual: {q.deskripsi_gambar}
                    </p>
                  )}
                </div>
              )}

              {/* Question Stem */}
              <div className="text-[15px] sm:text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100 max-w-[75ch] whitespace-pre-line">
                {q.pertanyaan}
              </div>

              {/* Answer Options */}
              {q.opsi_jawaban.length > 0 && (
                <div className="space-y-2 pl-1">
                  {q.opsi_jawaban.map((opt, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-sky-300 dark:hover:border-sky-700 text-sm text-slate-800 dark:text-slate-200 leading-relaxed transition-colors"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Key & Discussion Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleSolution(q.nomor)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold theme-accent-text hover:underline cursor-pointer"
                >
                  {isSolutionOpen ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Sembunyikan Kunci &amp; Pembahasan</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Tampilkan Kunci &amp; Pembahasan</span>
                    </>
                  )}
                </button>

                {isSolutionOpen && (
                  <div className="mt-2.5 p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/60 space-y-2 text-sm">
                    <div className="text-slate-900 dark:text-slate-100">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Kunci Jawaban:{' '}
                      </span>
                      <span className="font-semibold">{q.kunci_jawaban}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Pembahasan:{' '}
                      </span>
                      {q.pembahasan}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <OfficialSignatureBlock kop={kop} />
    </div>
  );
}
