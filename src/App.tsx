import { useEffect, useRef, useState } from 'react';
import { ApiConfigModal } from './components/ApiConfigModal';
import { BatchProgressBanner } from './components/BatchProgressBanner';
import { Header } from './components/Header';
import { KopSuratAccordion } from './components/KopSuratAccordion';
import { MapelForm } from './components/MapelForm';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { TkaForm } from './components/TkaForm';
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_AI_CONFIG,
  DEFAULT_KOP_FONT_SIZES,
  DEFAULT_KOP_LINE_STYLES,
  DEFAULT_KOP_SURAT,
  DEFAULT_LOGO_SIZE,
  MAPEL_BY_JENJANG,
  TKA_SUBDOMAIN_MAP,
} from './data/curriculumData';
import { DEFAULT_APP_THEME } from './data/themes';
import {
  ActiveFeatureTab,
  AiConfig,
  AppThemeId,
  AssessmentMetadata,
  BatchProgressState,
  KopSuratConfig,
  MapelFormState,
  QuestionItem,
  TkaFormState,
} from './types/assessment';
import { runSequentialBatchGeneration } from './utils/batchGenerator';

const STORAGE_KEYS = {
  AI_CONFIG: 'tka_generator_ai_config_v1',
  KOP_SURAT: 'tka_generator_kop_surat_v1',
  THEME: 'tka_generator_theme_v1',
  THEME_PALETTE: 'tka_generator_theme_palette_v1',
};

function loadJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
    } catch {
      return false;
    }
  });

  const [activeTheme, setActiveTheme] = useState<AppThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_PALETTE);
      if (
        saved === 'nusantara' ||
        saved === 'zamrud' ||
        saved === 'mentari' ||
        saved === 'angkasa' ||
        saved === 'delima'
      ) {
        return saved;
      }
      return DEFAULT_APP_THEME;
    } catch {
      return DEFAULT_APP_THEME;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveFeatureTab>('tka');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    const loaded = loadJsonStorage(STORAGE_KEYS.AI_CONFIG, DEFAULT_AI_CONFIG);
    const providerMeta =
      AI_PROVIDER_OPTIONS.find((p) => p.id === loaded.provider) ||
      AI_PROVIDER_OPTIONS[0];
    const isValidModel = providerMeta.models.some((m) => m.id === loaded.model);
    return {
      ...DEFAULT_AI_CONFIG,
      ...loaded,
      provider: providerMeta.id,
      model: isValidModel ? loaded.model : providerMeta.models[0].id,
      keys: {
        ...DEFAULT_AI_CONFIG.keys,
        ...(loaded.keys || {}),
      },
    };
  });

  const [kopSurat, setKopSurat] = useState<KopSuratConfig>(() => {
    const loaded = loadJsonStorage(STORAGE_KEYS.KOP_SURAT, DEFAULT_KOP_SURAT);
    return {
      ...DEFAULT_KOP_SURAT,
      ...loaded,
      logoKiriSize: loaded.logoKiriSize ?? DEFAULT_LOGO_SIZE,
      logoKananSize: loaded.logoKananSize ?? DEFAULT_LOGO_SIZE,
      kopFontSizes: {
        ...DEFAULT_KOP_FONT_SIZES,
        ...(loaded.kopFontSizes || {}),
      },
      kopLineStyles: {
        ...DEFAULT_KOP_LINE_STYLES,
        ...(loaded.kopLineStyles || {}),
      },
    };
  });

  const [tkaForm, setTkaForm] = useState<TkaFormState>(() => ({
    namaSatuanPendidikan: kopSurat.namaSatuanPendidikan || 'SMA Negeri 1 Kudus',
    fase: 'Fase E',
    kelas: 'Kelas X',
    jenisSoal: ['Literasi Membaca'],
    subdomain: [TKA_SUBDOMAIN_MAP['Literasi Membaca'][0]],
    bentukSoal: { 'Pilihan ganda': 5 },
    tingkatKesulitan: ['MOTS', 'HOTS'],
    pengalamanBelajar: ['Memahami', 'Mengaplikasi', 'Merefleksi'],
  }));

  const [mapelForm, setMapelForm] = useState<MapelFormState>(() => ({
    namaSatuanPendidikan: kopSurat.namaSatuanPendidikan || 'SMA Negeri 1 Kudus',
    jenjang: 'SMA / MA',
    mataPelajaran: MAPEL_BY_JENJANG['SMA / MA'][0],
    kelas: 'Kelas XI',
    topikMateri1: 'Analisis Teks Argumentasi & Penalaran Kritis',
    topikMateri2: 'Evaluasi Fakta, Opini, dan Struktur Kebahasaan',
    bentukSoal: { 'Pilihan ganda': 5 },
    tingkatKesulitan: ['MOTS', 'HOTS'],
    pengalamanBelajar: ['Memahami', 'Mengaplikasi', 'Merefleksi'],
  }));

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [lastGeneratedMeta, setLastGeneratedMeta] =
    useState<AssessmentMetadata | null>(null);

  const [progress, setProgress] = useState<BatchProgressState>({
    status: 'idle',
    currentBatch: 0,
    totalBatches: 0,
    batchStartNumber: 0,
    batchEndNumber: 0,
    generatedCount: 0,
    totalRequested: 0,
    retryingAttempt: 0,
    message: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  // Sync dark mode class and theme palette attribute on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_PALETTE, activeTheme);
    } catch {
      // ignore storage errors
    }
  }, [activeTheme]);

  // Persist AI config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(aiConfig));
    } catch {
      // ignore
    }
  }, [aiConfig]);

  // Persist Kop Surat config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KOP_SURAT, JSON.stringify(kopSurat));
    } catch {
      // ignore
    }
  }, [kopSurat]);

  // Check server health for server-side Gemini availability
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { hasServerGeminiKey?: boolean }) => {
        setHasServerGeminiKey(Boolean(data.hasServerGeminiKey));
      })
      .catch(() => {
        setHasServerGeminiKey(false);
      });
  }, []);

  // Bidirectional sync for Nama Satuan Pendidikan across Kop Surat & both forms
  const handleSchoolNameSync = (schoolName: string) => {
    setKopSurat((prev) => ({ ...prev, namaSatuanPendidikan: schoolName }));
    setTkaForm((prev) => ({ ...prev, namaSatuanPendidikan: schoolName }));
    setMapelForm((prev) => ({ ...prev, namaSatuanPendidikan: schoolName }));
  };

  const handleGenerate = async () => {
    const activeKeyConfigured =
      Boolean(aiConfig.keys[aiConfig.provider]?.trim()) ||
      (aiConfig.provider === 'gemini' && hasServerGeminiKey);

    if (!activeKeyConfigured) {
      setIsApiModalOpen(true);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentMeta: AssessmentMetadata =
      activeTab === 'tka'
        ? {
            mode: 'tka',
            satuanPendidikan: tkaForm.namaSatuanPendidikan,
            judulAsesmen: `Asesmen Nasional / Simulasi TKA — ${tkaForm.jenisSoal.join(', ')}`,
            subJudul: `${tkaForm.jenisSoal.join(', ')} (${tkaForm.subdomain.join('; ')})`,
            kelas: tkaForm.kelas,
            faseAtauJenjang: tkaForm.fase,
          }
        : {
            mode: 'mapel',
            satuanPendidikan: mapelForm.namaSatuanPendidikan,
            judulAsesmen: `Asesmen Mata Pelajaran ${mapelForm.mataPelajaran}`,
            subJudul: `${mapelForm.mataPelajaran} — ${[
              mapelForm.topikMateri1,
              mapelForm.topikMateri2,
            ]
              .map((t) => t.trim())
              .filter(Boolean)
              .join(' & ')}`,
            kelas: mapelForm.kelas,
            faseAtauJenjang: mapelForm.jenjang,
          };

    setLastGeneratedMeta(currentMeta);
    setQuestions([]);

    setTimeout(() => {
      resultsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 150);

    try {
      await runSequentialBatchGeneration({
        mode: activeTab,
        formState: activeTab === 'tka' ? tkaForm : mapelForm,
        aiConfig,
        abortController: controller,
        onProgress: (nextProgress) => setProgress(nextProgress),
        onBatchComplete: (newBatch) => {
          setQuestions((prev) => [...prev, ...newBatch]);
        },
      });
    } catch (err) {
      console.error('Batch generation error:', err);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleUpdateQuestion = (
    nomor: number,
    patch: Partial<QuestionItem>
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.nomor === nomor ? { ...q, ...patch } : q))
    );
  };

  const isGenerating = progress.status === 'running';

  return (
    <div className="min-h-screen flex flex-col app-colorful-canvas text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        aiConfig={aiConfig}
        hasServerGeminiKey={hasServerGeminiKey}
        onOpenApiConfig={() => setIsApiModalOpen(true)}
        isDark={isDark}
        onToggleDark={() => setIsDark((prev) => !prev)}
        activeTheme={activeTheme}
        onChangeTheme={setActiveTheme}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Accordion: Pengaturan Kop Surat & Tanda Tangan Resmi */}
        <KopSuratAccordion
          config={kopSurat}
          onChange={setKopSurat}
          onSchoolNameChange={handleSchoolNameSync}
        />

        {/* Active Generator Form */}
        {activeTab === 'tka' ? (
          <TkaForm
            value={tkaForm}
            onChange={setTkaForm}
            onSchoolNameChange={handleSchoolNameSync}
            onSubmit={handleGenerate}
            isGenerating={isGenerating}
          />
        ) : (
          <MapelForm
            value={mapelForm}
            onChange={setMapelForm}
            onSchoolNameChange={handleSchoolNameSync}
            onSubmit={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {/* Incremental Progress & Results Anchor */}
        <div ref={resultsAnchorRef} className="space-y-5">
          <BatchProgressBanner
            progress={progress}
            onStop={handleStopGeneration}
          />

          {questions.length > 0 && lastGeneratedMeta && (
            <ResultsWorkspace
              questions={questions}
              kop={kopSurat}
              meta={lastGeneratedMeta}
              aiConfig={aiConfig}
              onUpdateQuestion={handleUpdateQuestion}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 px-4 sm:px-6">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            AI Generator Asesmen &amp; Simulasi TKA · Portal Penyusunan Instrumen Kurikulum Merdeka
          </span>
          <span>
            Mendukung ekspor PDF otomatis, Kisi-Kisi terstruktur, dan Simulasi CBT
          </span>
        </div>
      </footer>

      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        aiConfig={aiConfig}
        onChangeConfig={setAiConfig}
        hasServerGeminiKey={hasServerGeminiKey}
      />
    </div>
  );
}
