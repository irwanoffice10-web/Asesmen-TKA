import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Moon,
  Palette,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  Wifi,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { AI_PROVIDER_OPTIONS } from '../data/curriculumData';
import { APP_THEMES } from '../data/themes';
import {
  auth,
  createAuthAccountAsAdmin,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AiConfig,
  AiProvider,
  AppThemeId,
  KopSuratConfig,
  PortalUserProfile,
  UserRole,
  UserStatus,
} from '../types/assessment';
import { KopSuratAccordion } from './KopSuratAccordion';

type AdminSubTab = 'users' | 'ai' | 'kop_tema';

interface AdminPanelProps {
  currentUser: PortalUserProfile;
  aiConfig: AiConfig;
  hasServerGeminiKey: boolean;
  kopSurat: KopSuratConfig;
  activeTheme: AppThemeId;
  isDark: boolean;
  onSavePortalSettings: (next: {
    aiConfig: AiConfig;
    kopSurat: KopSuratConfig;
    activeTheme: AppThemeId;
    isDarkDefault: boolean;
  }) => Promise<void>;
  onLocalThemePreview: (theme: AppThemeId, dark: boolean) => void;
}

export function AdminPanel({
  currentUser,
  aiConfig,
  hasServerGeminiKey,
  kopSurat,
  activeTheme,
  isDark,
  onSavePortalSettings,
  onLocalThemePreview,
}: AdminPanelProps) {
  const [subTab, setSubTab] = useState<AdminSubTab>('users');

  // Users management state
  const [users, setUsers] = useState<PortalUserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [userActionFeedback, setUserActionFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  // Settings draft state (synced with props when opened or saved)
  const [draftAi, setDraftAi] = useState<AiConfig>(aiConfig);
  const [draftKop, setDraftKop] = useState<KopSuratConfig>(kopSurat);
  const [draftTheme, setDraftTheme] = useState<AppThemeId>(activeTheme);
  const [draftDark, setDraftDark] = useState<boolean>(isDark);
  const [showKey, setShowKey] = useState(false);

  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  // Keep draft synced when upstream Firestore props arrive initially
  useEffect(() => {
    setDraftAi(aiConfig);
  }, [aiConfig]);

  useEffect(() => {
    setDraftKop(kopSurat);
  }, [kopSurat]);

  useEffect(() => {
    setDraftTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setDraftDark(isDark);
  }, [isDark]);

  // Listen to /users collection in real time (Admin only)
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const list: PortalUserProfile[] = snapshot.docs.map((d) =>
          d.data() as PortalUserProfile
        );
        list.sort((a, b) => {
          if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
          return (a.displayName || '').localeCompare(b.displayName || '');
        });
        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'users');
        } catch (wrapped) {
          setFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
          setLoadingUsers(false);
        }
      }
    );

    return () => unsub();
  }, []);

  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const regularUsers = users.filter((u) => u.role === 'user').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    return { total, admins, regularUsers, suspended };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (q) {
        const matchName = (u.displayName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchUsername = (u.username || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchUsername) return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleCreateUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newUserFullName.trim();
    const rawUsername = newUserUsername.trim().replace(/^@+/, '');
    if (!trimmedName || !rawUsername || !newUserPassword) {
      setUserActionFeedback({
        ok: false,
        message: 'Nama lengkap, username, dan kata sandi wajib diisi.',
      });
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(rawUsername)) {
      setUserActionFeedback({
        ok: false,
        message:
          'Username harus 3–64 karakter dan hanya boleh berisi huruf, angka, titik (.), garis bawah (_), atau tanda hubung (-).',
      });
      return;
    }
    if (newUserPassword.length < 6) {
      setUserActionFeedback({
        ok: false,
        message: 'Kata sandi pengguna minimal 6 karakter.',
      });
      return;
    }

    setCreatingUser(true);
    setUserActionFeedback(null);
    try {
      const created = await createAuthAccountAsAdmin(
        rawUsername,
        newUserPassword,
        trimmedName
      );

      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', created.uid);
      batch.set(userDocRef, {
        uid: created.uid,
        username: created.username,
        email: created.email,
        displayName: trimmedName.slice(0, 150),
        role: newUserRole,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      if (newUserRole === 'admin') {
        batch.set(doc(db, 'admins', created.uid), {
          uid: created.uid,
          email: created.email,
          grantedBy: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();

      setUserActionFeedback({
        ok: true,
        message: `Akun ${trimmedName} (username: ${created.username}) berhasil dibuat dengan role ${
          newUserRole === 'admin' ? 'Administrator' : 'User / Guru'
        }.`,
      });
      setNewUserFullName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setShowNewUserPassword(false);
      setNewUserRole('user');
      setShowCreateUser(false);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/configuration-not-found'
      ) {
        setUserActionFeedback({
          ok: false,
          message:
            'Metode login Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method → Email/Password).',
        });
      } else if (code === 'auth/email-already-in-use') {
        setUserActionFeedback({
          ok: false,
          message: 'Username tersebut sudah digunakan. Pilih username lain.',
        });
      } else {
        setUserActionFeedback({
          ok: false,
          message:
            err instanceof Error
              ? err.message
              : 'Gagal menambahkan pengguna baru.',
        });
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUserRoleAndStatus = async (
    target: PortalUserProfile,
    nextRole: UserRole,
    nextStatus: UserStatus
  ) => {
    if (target.uid === currentUser.uid) return;
    setBusyUid(target.uid);
    setUserActionFeedback(null);

    try {
      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', target.uid);
      const adminDocRef = doc(db, 'admins', target.uid);

      batch.update(userDocRef, {
        role: nextRole,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      if (nextRole === 'admin' && nextStatus === 'active') {
        batch.set(adminDocRef, {
          uid: target.uid,
          email: target.email,
          grantedBy: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        batch.delete(adminDocRef);
      }

      await batch.commit();

      setUserActionFeedback({
        ok: true,
        message: `Peran ${target.displayName} diperbarui menjadi ${
          nextRole === 'admin' ? 'Admin' : 'User'
        } (${nextStatus === 'active' ? 'Aktif' : 'Nonaktif'}).`,
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${target.uid}`);
      } catch (wrapped) {
        setUserActionFeedback({
          ok: false,
          message:
            wrapped instanceof Error
              ? wrapped.message
              : 'Gagal memperbarui peran pengguna.',
        });
      }
    } finally {
      setBusyUid(null);
    }
  };

  const handleDeleteUser = async (target: PortalUserProfile) => {
    if (target.uid === currentUser.uid) return;
    setBusyUid(target.uid);
    setUserActionFeedback(null);

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', target.uid));
      batch.delete(doc(db, 'admins', target.uid));
      await batch.commit();

      setConfirmDeleteUid(null);
      setUserActionFeedback({
        ok: true,
        message: `Profil ${target.displayName} berhasil dihapus dari daftar portal.`,
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `users/${target.uid}`);
      } catch (wrapped) {
        setUserActionFeedback({
          ok: false,
          message:
            wrapped instanceof Error
              ? wrapped.message
              : 'Gagal menghapus profil pengguna.',
        });
      }
    } finally {
      setBusyUid(null);
    }
  };

  const selectedProviderMeta =
    AI_PROVIDER_OPTIONS.find((p) => p.id === draftAi.provider) ||
    AI_PROVIDER_OPTIONS[0];

  const handleSelectProvider = (provider: AiProvider) => {
    const providerMeta = AI_PROVIDER_OPTIONS.find((p) => p.id === provider)!;
    setTestResult(null);
    setSaveFeedback(null);
    setDraftAi({
      ...draftAi,
      provider,
      model: providerMeta.models[0].id,
    });
  };

  const handleTestConnection = async () => {
    setTestingApi(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: draftAi.provider,
          model: draftAi.model,
          apiKey: draftAi.keys[draftAi.provider] || '',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Gagal terhubung (${res.status}).`);
      }
      setTestResult({
        ok: true,
        message: data.message || 'Koneksi API aktif dan siap digunakan.',
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menguji koneksi ke penyedia AI.',
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleSaveAllAdminSettings = async () => {
    setSavingSettings(true);
    setSaveFeedback(null);
    try {
      // Persist secret keys first into /adminSecrets/aiKeys (Admin-only collection)
      try {
        await setDoc(doc(db, 'adminSecrets', 'aiKeys'), {
          geminiKey: (draftAi.keys.gemini || '').trim().slice(0, 512),
          anthropicKey: (draftAi.keys.anthropic || '').trim().slice(0, 512),
          openaiKey: (draftAi.keys.openai || '').trim().slice(0, 512),
          updatedAt: serverTimestamp(),
          updatedByUid: currentUser.uid,
        });
      } catch (secretErr) {
        handleFirestoreError(
          secretErr,
          OperationType.WRITE,
          'adminSecrets/aiKeys'
        );
      }

      // Persist public/user-readable global portal settings (/portalSettings/global)
      await onSavePortalSettings({
        aiConfig: draftAi,
        kopSurat: draftKop,
        activeTheme: draftTheme,
        isDarkDefault: draftDark,
      });

      // Sync keys to backend server memory for active regular Users
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/admin/runtime-ai-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            geminiKey: draftAi.keys.gemini || '',
            anthropicKey: draftAi.keys.anthropic || '',
            openaiKey: draftAi.keys.openai || '',
          }),
        });
      }

      setSaveFeedback({
        ok: true,
        message:
          'Seluruh pengaturan portal (Multi-AI, Kop Surat, dan Tema) berhasil disimpan dan diterapkan ke semua User.',
      });
    } catch (err) {
      setSaveFeedback({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan pengaturan portal.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const currentKey = draftAi.keys[draftAi.provider] || '';
  const isAiConnected =
    Boolean(currentKey.trim()) ||
    (draftAi.provider === 'gemini' && hasServerGeminiKey);

  return (
    <div className="space-y-6">
      {/* Top Admin Header Banner & Sub-navigation */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full theme-spectrum-bar" />
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl theme-gradient-bg text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Panel Kendali Administrator
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Kelola hak akses pengguna berdasarkan role serta kendalikan seluruh pengaturan API AI, Kop Surat resmi, tanda tangan, dan tema portal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                subTab === 'users'
                  ? 'theme-btn-primary border-transparent shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen User &amp; Role</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ai')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                subTab === 'ai'
                  ? 'theme-btn-primary border-transparent shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Pengaturan Multi-AI</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('kop_tema')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                subTab === 'kop_tema'
                  ? 'theme-btn-primary border-transparent shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kop Surat &amp; Tema</span>
            </button>
          </div>
        </div>
      </section>

      {/* SUB-TAB 1: MANAJEMEN USER & ROLE */}
      {subTab === 'users' && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Total Akun Terdaftar</span>
                <Users className="w-4 h-4 theme-accent-text" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {userStats.total}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span>Role Admin</span>
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-indigo-950 dark:text-indigo-100 tabular-nums">
                {userStats.admins}
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-700 dark:text-sky-300">
                <span>Role User / Guru</span>
                <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-sky-950 dark:text-sky-100 tabular-nums">
                {userStats.regularUsers}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                <span>Akun Dinonaktifkan</span>
                <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-amber-950 dark:text-amber-100 tabular-nums">
                {userStats.suspended}
              </div>
            </div>
          </div>

          {userActionFeedback && (
            <div
              className={`rounded-xl border p-3.5 flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
                userActionFeedback.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
              }`}
            >
              {userActionFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{userActionFeedback.message}</span>
            </div>
          )}

          {/* Filter Toolbar + Add User + Users Table */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, username, atau email pengguna..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter berdasarkan role"
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as 'all' | UserRole)
                  }
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Admin Saja</option>
                  <option value="user">User / Guru Saja</option>
                </select>

                <select
                  aria-label="Filter berdasarkan status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | UserStatus)
                  }
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="suspended">Nonaktif</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowCreateUser((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg theme-btn-primary text-xs sm:text-sm font-semibold cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {showCreateUser ? 'Tutup Form' : 'Tambah Akun User'}
                  </span>
                </button>
              </div>
            </div>

            {showCreateUser && (
              <form
                onSubmit={handleCreateUserSubmit}
                className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Buat Akun Pengguna Baru (Tanpa Email — Langsung Username &amp; Password)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="Nama Lengkap (contoh: Budi Santoso)"
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="Username (contoh: guru_ipa)"
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <div className="relative">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Password (min. 6 karakter)"
                      className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((prev) => !prev)}
                      aria-label={
                        showNewUserPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewUserPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <select
                    aria-label="Pilih role akun baru"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="user">Role: User / Guru</option>
                    <option value="admin">Role: Administrator</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-bold disabled:opacity-60 cursor-pointer"
                  >
                    {creatingUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {creatingUser ? 'Membuat Akun...' : 'Simpan Akun Baru'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {loadingUsers ? (
              <div className="p-10 flex items-center justify-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat daftar pengguna portal...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada pengguna yang sesuai dengan filter pencarian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Role Akses</th>
                      <th className="py-3 px-4">Status Akun</th>
                      <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {filteredUsers.map((user) => {
                      const isSelf = user.uid === currentUser.uid;
                      const isBusy = busyUid === user.uid;
                      const initials = (user.displayName || user.email || 'U')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={user.uid}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full theme-gradient-bg text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                                  <span className="truncate">
                                    {user.displayName}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                                      Akun Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {user.email?.endsWith('@tka-portal.local')
                                    ? `Username: ${user.username || user.email.replace('@tka-portal.local', '')}`
                                    : user.username
                                      ? `${user.username} (${user.email})`
                                      : user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isSelf ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <select
                                aria-label={`Ubah role untuk ${user.displayName}`}
                                disabled={isBusy}
                                value={user.role}
                                onChange={(e) =>
                                  handleUpdateUserRoleAndStatus(
                                    user,
                                    e.target.value as UserRole,
                                    user.status
                                  )
                                }
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                                  user.role === 'admin'
                                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200'
                                    : 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                                }`}
                              >
                                <option value="user">User / Guru</option>
                                <option value="admin">Administrator</option>
                              </select>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                user.status === 'active'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                              }`}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Aktif</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Nonaktif</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Terlindungi
                              </span>
                            ) : (
                              <div className="inline-flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleUpdateUserRoleAndStatus(
                                      user,
                                      user.role,
                                      user.status === 'active'
                                        ? 'suspended'
                                        : 'active'
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                                    user.status === 'active'
                                      ? 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      : 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                  <span>
                                    {user.status === 'active'
                                      ? 'Nonaktifkan'
                                      : 'Aktifkan'}
                                  </span>
                                </button>

                                {confirmDeleteUid === user.uid ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleDeleteUser(user)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                                    >
                                      Ya, Hapus
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUid(null)}
                                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setConfirmDeleteUid(user.uid)}
                                    aria-label={`Hapus profil ${user.displayName}`}
                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUB-TAB 2: PENGATURAN MULTI-AI (ADMIN-ONLY) */}
      {subTab === 'ai' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Pengaturan Penyedia &amp; Kunci API Multi-AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hanya Admin yang dapat mengatur model serta kunci API AI. User biasa menggunakan mesin AI ini secara otomatis tanpa akses ke kredensial rahasia.
              </p>
            </div>
            <button
              type="button"
              disabled={savingSettings}
              onClick={handleSaveAllAdminSettings}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl theme-btn-primary text-xs sm:text-sm font-bold shadow-sm disabled:opacity-60 cursor-pointer shrink-0"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
              </span>
            </button>
          </div>

          {/* Connection Status & Live Test */}
          <div
            className={`p-4 rounded-xl border ${
              isAiConnected
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {isAiConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {isAiConnected
                    ? `Koneksi Siap: ${selectedProviderMeta.name} (${draftAi.model})`
                    : `API Key ${selectedProviderMeta.name} Diperlukan`}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {isAiConnected
                    ? currentKey.trim()
                      ? 'Menggunakan kunci API khusus Admin yang tersimpan terenkripsi/terisolasi di database Admin.'
                      : 'Menggunakan konfigurasi Google Gemini bawaan server secara otomatis untuk seluruh pengguna.'
                    : 'Masukkan kunci API pada kolom di bawah ini sebelum menyimpan.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={testingApi || !isAiConnected}
                    onClick={handleTestConnection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {testingApi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 theme-accent-text" />
                    )}
                    <span>
                      {testingApi ? 'Menguji Koneksi...' : 'Uji Koneksi API'}
                    </span>
                  </button>
                </div>

                {testResult && (
                  <p
                    className={`text-xs font-medium mt-2 ${
                      testResult.ok
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {testResult.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Choices */}
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                1. Pilih Penyedia Layanan AI
              </label>
              {AI_PROVIDER_OPTIONS.map((prov) => {
                const isSelected = draftAi.provider === prov.id;
                const hasKey =
                  Boolean(draftAi.keys[prov.id]?.trim()) ||
                  (prov.id === 'gemini' && hasServerGeminiKey);
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'theme-soft-surface border'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {prov.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {prov.models.map((m) => m.id).join(' · ')}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        hasKey
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {hasKey ? 'Terkonfigurasi' : 'Kosong'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Model + API Key Input */}
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="admin-ai-model"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
                >
                  2. Pilih Model AI Aktif
                </label>
                <select
                  id="admin-ai-model"
                  value={
                    selectedProviderMeta.models.some(
                      (m) => m.id === draftAi.model
                    )
                      ? draftAi.model
                      : selectedProviderMeta.models[0].id
                  }
                  onChange={(e) => {
                    setTestResult(null);
                    setDraftAi({ ...draftAi, model: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {selectedProviderMeta.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-api-key"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
                >
                  3. API Key Rahasia {selectedProviderMeta.name}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-api-key"
                    type={showKey ? 'text' : 'password'}
                    value={currentKey}
                    onChange={(e) => {
                      setTestResult(null);
                      setDraftAi({
                        ...draftAi,
                        keys: {
                          ...draftAi.keys,
                          [draftAi.provider]: e.target.value,
                        },
                      });
                    }}
                    placeholder={
                      draftAi.provider === 'gemini' && hasServerGeminiKey
                        ? 'Opsional (kosongkan untuk memakai kunci bawaan server)'
                        : selectedProviderMeta.placeholder
                    }
                    className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => !prev)}
                    aria-label={
                      showKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Kunci API disimpan terpisah dalam koleksi khusus Admin dan diteruskan melalui jalur server aman. User biasa tidak dapat melihat atau mengubah API Key.
                </p>
              </div>
            </div>
          </div>

          {saveFeedback && (
            <div
              className={`rounded-xl border p-3.5 flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
                saveFeedback.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
              }`}
            >
              {saveFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{saveFeedback.message}</span>
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 3: KOP SURAT, TANDA TANGAN & TEMA PORTAL */}
      {subTab === 'kop_tema' && (
        <div className="space-y-5">
          {/* Theme & Appearance Controls */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg theme-gradient-bg text-white flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Pengaturan Tema Warna &amp; Mode Tampilan Portal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tema yang dipilih Admin otomatis berlaku bagi seluruh User pada portal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveAllAdminSettings}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl theme-btn-primary text-xs sm:text-sm font-bold shadow-sm disabled:opacity-60 cursor-pointer shrink-0"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {savingSettings
                    ? 'Menyimpan...'
                    : 'Simpan Kop Surat & Tema'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {APP_THEMES.map((theme) => {
                const selected = draftTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setDraftTheme(theme.id);
                      onLocalThemePreview(theme.id, draftDark);
                    }}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'theme-soft-surface border'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center -space-x-1 shrink-0">
                        {theme.swatches.map((hex, idx) => (
                          <span
                            key={idx}
                            style={{ backgroundColor: hex }}
                            className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-900"
                          />
                        ))}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {theme.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {theme.subtitle}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <Check className="w-4 h-4 theme-accent-text shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Dark/Light Mode Default Selector */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Mode Layar Portal
                </div>
                <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDark(false);
                      onLocalThemePreview(draftTheme, false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      !draftDark
                        ? 'theme-gradient-bg text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDark(true);
                      onLocalThemePreview(draftTheme, true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      draftDark
                        ? 'theme-gradient-bg text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Gelap</span>
                  </button>
                </div>
              </div>
            </div>

            {saveFeedback && (
              <div
                className={`rounded-xl border p-3.5 flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
                  saveFeedback.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                }`}
              >
                {saveFeedback.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{saveFeedback.message}</span>
              </div>
            )}
          </section>

          {/* Embedded Kop Surat Editor */}
          <KopSuratAccordion
            alwaysExpanded
            config={draftKop}
            onChange={setDraftKop}
            onSchoolNameChange={(schoolName) =>
              setDraftKop((prev) => ({
                ...prev,
                namaSatuanPendidikan: schoolName,
              }))
            }
          />
        </div>
      )}
    </div>
  );
}
