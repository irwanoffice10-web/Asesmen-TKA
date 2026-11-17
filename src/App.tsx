import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AdminPanel } from './components/AdminPanel';
import { BatchProgressBanner } from './components/BatchProgressBanner';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { MapelForm } from './components/MapelForm';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { TkaForm } from './components/TkaForm';
import { useAuth } from './contexts/AuthContext';
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_AI_CONFIG,
  DEFAULT_KOP_LINE_STYLES,
  DEFAULT_KOP_SURAT,
  DEFAULT_LOGO_SIZE,
  MAPEL_BY_JENJANG,
  TKA_SUBDOMAIN_MAP,
} from './data/curriculumData';
import { DEFAULT_APP_THEME } from './data/themes';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  ActiveFeatureTab,
  AiConfig,
  AppThemeId,
  AssessmentMetadata,
  BatchProgressState,
  KopSuratConfig,
  MapelFormState,
  PortalSettingsState,
  QuestionItem,
  TkaFormState,
} from './types/assessment';
import { runSequentialBatchGeneration } from './utils/batchGenerator';

const STORAGE_KEYS = {
  THEME: 'tka_generator_theme_v1',
};

export default function App() {
  const {
    firebaseUser,
    userProfile,
    authReady,
    isSigningIn,
    authError,
    emailProviderDisabled,
    signInWithCredentials,
    signInWithGoogle,
    logout,
  } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
    } catch {
      return false;
    }
  });

  const [activeTheme, setActiveTheme] = useState<AppThemeId>(DEFAULT_APP_THEME);
  const [activeTab, setActiveTab] = useState<ActiveFeatureTab>('tka');
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);
  const [runtimeConfiguredProviders, setRuntimeConfiguredProviders] = useState({
    gemini: false,
    anthropic: false,
    openai: false,
  });
  const [portalHasCustomKeys, setPortalHasCustomKeys] = useState({
    gemini: false,
    anthropic: false,
    openai: false,
  });
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [kopSurat, setKopSurat] = useState<KopSuratConfig>(DEFAULT_KOP_SURAT);

  const [tkaForm, setTkaForm] = useState<TkaFormState>(() => ({
    namaSatuanPendidikan:
      DEFAULT_KOP_SURAT.namaSatuanPendidikan || 'SMA Negeri 1 Kudus',
    fase: 'Fase E',
    kelas: 'Kelas X',
    jenisSoal: ['Literasi Membaca'],
    subdomain: [TKA_SUBDOMAIN_MAP['Literasi Membaca'][0]],
    bentukSoal: { 'Pilihan ganda': 5 },
    tingkatKesulitan: ['MOTS', 'HOTS'],
    pengalamanBelajar: ['Memahami', 'Mengaplikasi', 'Merefleksi'],
  }));

  const [mapelForm, setMapelForm] = useState<MapelFormState>(() => ({
    namaSatuanPendidikan:
      DEFAULT_KOP_SURAT.namaSatuanPendidikan || 'SMA Negeri 1 Kudus',
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

  if (fatalError) {
    throw fatalError;
  }

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
  }, [activeTheme]);

  // Check server health for server-side Gemini / runtime key availability
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(
        (data: {
          hasServerGeminiKey?: boolean;
          runtimeConfiguredProviders?: {
            gemini: boolean;
            anthropic: boolean;
            openai: boolean;
          };
        }) => {
          setHasServerGeminiKey(Boolean(data.hasServerGeminiKey));
          if (data.runtimeConfiguredProviders) {
            setRuntimeConfiguredProviders(data.runtimeConfiguredProviders);
          }
        }
      )
      .catch(() => {
        setHasServerGeminiKey(false);
      });
  }, [userProfile?.uid]);

  // Ensure non-admins cannot remain on the Admin tab
  useEffect(() => {
    if (!userProfile) {
      setActiveTab('tka');
      return;
    }

    if (userProfile.role !== 'admin' && activeTab === 'admin') {
      setActiveTab('tka');
    }
  }, [userProfile, activeTab]);

  // Listen to centralized portalSettings/global in real time when signed in & active
  useEffect(() => {
    if (!firebaseUser || !userProfile || userProfile.status !== 'active') {
      return;
    }

    const portalDocRef = doc(db, 'portalSettings', 'global');
    const unsub = onSnapshot(
      portalDocRef,
      (snap) => {
        if (!snap.exists()) {
          // Seed initial global portal settings automatically on first Admin login
          if (userProfile.role === 'admin') {
            setDoc(portalDocRef, {
              aiProvider: DEFAULT_AI_CONFIG.provider,
              aiModel: DEFAULT_AI_CONFIG.model,
              activeTheme: DEFAULT_APP_THEME,
              isDarkDefault: false,
              hasCustomKeys: {
                gemini: false,
                anthropic: false,
                openai: false,
              },
              kopSurat: DEFAULT_KOP_SURAT,
              updatedAt: serverTimestamp(),
              updatedByUid: userProfile.uid,
              updatedByName: userProfile.displayName || 'Administrator',
            }).catch((seedErr) => {
              try {
                handleFirestoreError(
                  seedErr,
                  OperationType.CREATE,
                  'portalSettings/global'
                );
              } catch (wrapped) {
                setFatalError(
                  wrapped instanceof Error ? wrapped : new Error(String(wrapped))
                );
              }
            });
          }
          return;
        }

        const data = snap.data() as PortalSettingsState;
        const providerMeta =
          AI_PROVIDER_OPTIONS.find((p) => p.id === data.aiProvider) ||
          AI_PROVIDER_OPTIONS[0];
        const validModel = providerMeta.models.some(
          (m) => m.id === data.aiModel
        )
          ? data.aiModel
          : providerMeta.models[0].id;

        setAiConfig((prev) => ({
          ...prev,
          provider: providerMeta.id,
          model: validModel,
        }));

        if (data.activeTheme) {
          setActiveTheme(data.activeTheme);
        }
        if (typeof data.isDarkDefault === 'boolean') {
          setIsDark(data.isDarkDefault);
        }
        if (data.hasCustomKeys) {
          setPortalHasCustomKeys(data.hasCustomKeys);
        }
        if (data.kopSurat) {
          const syncedKop: KopSuratConfig = {
            ...DEFAULT_KOP_SURAT,
            ...data.kopSurat,
            logoKiriSize: data.kopSurat.logoKiriSize ?? DEFAULT_LOGO_SIZE,
            logoKananSize: data.kopSurat.logoKananSize ?? DEFAULT_LOGO_SIZE,
            kopLineStyles: {
              ...DEFAULT_KOP_LINE_STYLES,
              ...(data.kopSurat.kopLineStyles || {}),
            },
          };
          setKopSurat(syncedKop);
          setTkaForm((prev) => ({
            ...prev,
            namaSatuanPendidikan:
              syncedKop.namaSatuanPendidikan || prev.namaSatuanPendidikan,
          }));
          setMapelForm((prev) => ({
            ...prev,
            namaSatuanPendidikan:
              syncedKop.namaSatuanPendidikan || prev.namaSatuanPendidikan,
          }));
        }
      },
      (err) => {
        try {
          handleFirestoreError(
            err,
            OperationType.GET,
            'portalSettings/global'
          );
        } catch (wrapped) {
          setFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      }
    );

    return () => unsub();
  }, [firebaseUser, userProfile]);

  // Admin-only: Listen to /adminSecrets/aiKeys & sync runtime keys to backend server
  useEffect(() => {
    if (
      !firebaseUser ||
      !userProfile ||
      userProfile.role !== 'admin' ||
      userProfile.status !== 'active'
    ) {
      return;
    }

    const secretDocRef = doc(db, 'adminSecrets', 'aiKeys');
    const unsub = onSnapshot(
      secretDocRef,
      async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as {
          geminiKey?: string;
          anthropicKey?: string;
          openaiKey?: string;
        };
        const keys = {
          gemini: data.geminiKey || '',
          anthropic: data.anthropicKey || '',
          openai: data.openaiKey || '',
        };
        setAiConfig((prev) => ({
          ...prev,
          keys,
        }));

        if (auth.currentUser && (keys.gemini || keys.anthropic || keys.openai)) {
          try {
            const idToken = await auth.currentUser.getIdToken();
            const res = await fetch('/api/admin/runtime-ai-keys', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                geminiKey: keys.gemini,
                anthropicKey: keys.anthropic,
                openaiKey: keys.openai,
              }),
            });
            if (res.ok) {
              const payload = (await res.json()) as {
                runtimeConfiguredProviders?: {
                  gemini: boolean;
                  anthropic: boolean;
                  openai: boolean;
                };
              };
              if (payload.runtimeConfiguredProviders) {
                setRuntimeConfiguredProviders(
                  payload.runtimeConfiguredProviders
                );
              }
            }
          } catch {
            // ignore transient sync error
          }
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'adminSecrets/aiKeys');
        } catch (wrapped) {
          setFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      }
    );

    return () => unsub();
  }, [firebaseUser, userProfile]);

  const handleSavePortalSettings = async (next: {
    aiConfig: AiConfig;
    kopSurat: KopSuratConfig;
    activeTheme: AppThemeId;
    isDarkDefault: boolean;
  }) => {
    if (!userProfile || userProfile.role !== 'admin') return;

    try {
      await setDoc(doc(db, 'portalSettings', 'global'), {
        aiProvider: next.aiConfig.provider,
        aiModel: next.aiConfig.model,
        activeTheme: next.activeTheme,
        isDarkDefault: next.isDarkDefault,
        hasCustomKeys: {
          gemini: Boolean(next.aiConfig.keys.gemini?.trim()),
          anthropic: Boolean(next.aiConfig.keys.anthropic?.trim()),
          openai: Boolean(next.aiConfig.keys.openai?.trim()),
        },
        kopSurat: {
          ...next.kopSurat,
          logoKiri: (next.kopSurat.logoKiri || '').slice(0, 345000),
          logoKanan: (next.kopSurat.logoKanan || '').slice(0, 345000),
        },
        updatedAt: serverTimestamp(),
        updatedByUid: userProfile.uid,
        updatedByName: (userProfile.displayName || 'Administrator').slice(0, 150),
      });
      setAiConfig(next.aiConfig);
      setKopSurat(next.kopSurat);
      setActiveTheme(next.activeTheme);
      setIsDark(next.isDarkDefault);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'portalSettings/global');
    }
  };

  const handleSchoolNameSync = (schoolName: string) => {
    setTkaForm((prev) => ({ ...prev, namaSatuanPendidikan: schoolName }));
    setMapelForm((prev) => ({ ...prev, namaSatuanPendidikan: schoolName }));
  };

  const handleGenerate = async () => {
    if (activeTab === 'admin') return;

    const activeKeyConfigured =
      Boolean(aiConfig.keys[aiConfig.provider]?.trim()) ||
      (aiConfig.provider === 'gemini' && hasServerGeminiKey) ||
      runtimeConfiguredProviders[aiConfig.provider] ||
      portalHasCustomKeys[aiConfig.provider];

    if (!activeKeyConfigured) {
      if (userProfile?.role === 'admin') {
        setActiveTab('admin');
      } else {
        setProgress({
          status: 'error',
          currentBatch: 0,
          totalBatches: 0,
          batchStartNumber: 0,
          batchEndNumber: 0,
          generatedCount: 0,
          totalRequested: 0,
          retryingAttempt: 0,
          message: 'Konfigurasi API AI belum aktif.',
          error:
            'Layanan API AI belum dikonfigurasi oleh Administrator. Silakan hubungi Admin portal untuk mengatur penyedia & API Key di Panel Admin.',
        });
      }
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

  // 1. Auth Loading Gate
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center app-colorful-canvas text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg">
          <Loader2 className="w-7 h-7 animate-spin theme-accent-text" />
          <div className="text-sm font-semibold">
            Memverifikasi sesi &amp; hak akses portal...
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate -> Single Unified Login Page (User & Admin)
  if (!firebaseUser || !userProfile) {
    return (
      <LoginPage
        onSignInWithCredentials={signInWithCredentials}
        onSignInWithGoogle={signInWithGoogle}
        isSigningIn={isSigningIn}
        authError={authError}
        emailProviderDisabled={emailProviderDisabled}
        isDark={isDark}
        onToggleDark={() => setIsDark((prev) => !prev)}
      />
    );
  }

  // 3. Suspended Account Gate
  if (userProfile.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 app-colorful-canvas text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Akses Akun Dinonaktifkan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userProfile.email}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Status akun Anda saat ini sedang dinonaktifkan oleh Administrator portal. Silakan hubungi Admin untuk mengaktifkan kembali akses Anda.
          </p>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar &amp; Ganti Akun</span>
          </button>
        </div>
      </div>
    );
  }

  const isGenerating = progress.status === 'running';
  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col app-colorful-canvas text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userProfile={userProfile}
        onLogout={logout}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {activeTab === 'admin' && isAdmin ? (
          <AdminPanel
            currentUser={userProfile}
            aiConfig={aiConfig}
            hasServerGeminiKey={hasServerGeminiKey}
            kopSurat={kopSurat}
            activeTheme={activeTheme}
            isDark={isDark}
            onSavePortalSettings={handleSavePortalSettings}
            onLocalThemePreview={(theme, dark) => {
              setActiveTheme(theme);
              setIsDark(dark);
            }}
          />
        ) : (
          <>
            {/* Compact Governance Banner for Admin vs User clarity */}
            {isAdmin ? (
              <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Pengaturan Multi-AI ({aiConfig.model}), Kop Surat Resmi, Tema Portal, &amp; Manajemen Role dikelola di{' '}
                    <strong>Panel Admin</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-btn-primary text-xs font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Buka Pengaturan Admin</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Format Kop Surat ({kopSurat.namaSatuanPendidikan || 'Sekolah'}), Tanda Tangan Resmi, Tema, dan Layanan AI dikelola terpusat oleh Administrator portal.
                </span>
                <span className="font-semibold theme-accent-text">
                  Model Aktif: {aiConfig.model}
                </span>
              </div>
            )}

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
          </>
        )}
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
    </div>
  );
}
