import { useState } from 'react';
import {
  BookOpen,
  Download,
  FileSpreadsheet,
  Loader2,
  MonitorCheck,
} from 'lucide-react';
import {
  AiConfig,
  AssessmentMetadata,
  KopSuratConfig,
  QuestionItem,
  ResultSubTab,
} from '../types/assessment';
import { exportAssessmentPdf, PdfExportMode } from '../utils/pdfExporter';
import { CbtSimulationTab } from './CbtSimulationTab';
import { ExamPaperTab } from './ExamPaperTab';
import { KisiKisiTab } from './KisiKisiTab';

interface ResultsWorkspaceProps {
  questions: QuestionItem[];
  kop: KopSuratConfig;
  meta: AssessmentMetadata;
  aiConfig: AiConfig;
  onUpdateQuestion: (nomor: number, patch: Partial<QuestionItem>) => void;
}

export function ResultsWorkspace({
  questions,
  kop,
  meta,
  aiConfig,
  onUpdateQuestion,
}: ResultsWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<ResultSubTab>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  if (questions.length === 0) return null;

  const handleExportPdf = async (mode: PdfExportMode) => {
    setShowPdfMenu(false);
    setIsExporting(true);
    setPdfError(null);
    try {
      await exportAssessmentPdf(questions, kop, meta, mode);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : 'Gagal mengekspor dokumen PDF.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Sub-Tabs Navigation & PDF Export Controls */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-3 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sub-tab buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('editor')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'editor'
                ? 'theme-btn-primary shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Naskah Soal (Mode Editor Guru)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('kisikisi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'kisikisi'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Tabel Kisi-Kisi Soal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('simulasi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'simulasi'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800'
            }`}
          >
            <MonitorCheck className="w-4 h-4 shrink-0" />
            <span>Mode Simulasi Siswa (CBT)</span>
          </button>
        </div>

        {/* Save PDF Auto-Download Action */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setShowPdfMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-400 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Membuat PDF...' : 'Simpan PDF'}</span>
            </button>
          </div>

          {showPdfMenu && !isExporting && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleExportPdf('complete')}
                className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Unduh Paket Lengkap (.pdf)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Kop Surat + Kisi-Kisi + Naskah Soal + Kunci &amp; Pembahasan + Tanda Tangan
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportPdf('questions_only')}
                className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Unduh Naskah Soal Saja (.pdf)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Kop Surat + Naskah Soal Siap Cetak Siswa + Tanda Tangan
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfError && (
        <div className="p-3.5 rounded-lg border border-red-300 bg-red-50 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {pdfError}
        </div>
      )}

      {/* Active Sub-Tab Body */}
      {activeSubTab === 'editor' && (
        <ExamPaperTab
          questions={questions}
          kop={kop}
          meta={meta}
          aiConfig={aiConfig}
          onUpdateQuestion={onUpdateQuestion}
        />
      )}

      {activeSubTab === 'kisikisi' && (
        <KisiKisiTab questions={questions} kop={kop} meta={meta} />
      )}

      {activeSubTab === 'simulasi' && (
        <CbtSimulationTab questions={questions} kop={kop} meta={meta} />
      )}
    </section>
  );
}
