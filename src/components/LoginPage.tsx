import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { FIREBASE_PROJECT_ID } from '../firebase';

interface LoginPageProps {
  onSignInWithCredentials: (
    usernameOrEmail: string,
    password: string
  ) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
  emailProviderDisabled: boolean;
  isDark: boolean;
  onToggleDark: () => void;
}

export function LoginPage({
  onSignInWithCredentials,
  onSignInWithGoogle,
  isSigningIn,
  authError,
  emailProviderDisabled,
  isDark,
  onToggleDark,
}: LoginPageProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSignInWithCredentials(usernameInput, password);
  };

  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

  return (
    <div className="min-h-screen flex flex-col app-colorful-canvas text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="h-1.5 w-full theme-spectrum-bar" />

      {/* Minimal Top Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg theme-gradient-bg text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-sm">
              TKA
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                AI Generator Asesmen &amp; Simulasi TKA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Portal Penyusunan Instrumen Kurikulum Merdeka
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Single Unified Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl overflow-hidden">
            <div className="h-1.5 w-full theme-spectrum-bar" />

            <div className="p-6 sm:p-7 space-y-5">
              {/* Heading */}
              <div className="text-center space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Masuk ke Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Satu tempat login untuk <strong>User / Guru</strong> dan{' '}
                  <strong>Administrator</strong>.
                </p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                    {authError}
                  </div>
                </div>
              )}

              {/* Firebase Email/Password Enablement Walkthrough if not yet turned on */}
              {emailProviderDisabled && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 p-4 space-y-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Aktifkan Penyedia Email/Password di Firebase Console</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-amber-800 dark:text-amber-300 leading-relaxed">
                    <li>Buka Authentication Sign-in Method di Firebase Console.</li>
                    <li>Klik <strong>Add new provider</strong> lalu pilih <strong>Email/Password</strong>.</li>
                    <li>Aktifkan sakelar <strong>Enable</strong> dan klik <strong>Save</strong>.</li>
                  </ol>
                  <a
                    href={firebaseProvidersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100 underline"
                  >
                    <span>Buka Pengaturan Firebase Authentication</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      required
                      autoComplete="username"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Masukkan username dari Admin"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LockKeyhole className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full py-3 px-4 rounded-xl theme-btn-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Portal</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                Akun Username &amp; Password dibuat langsung oleh <strong>Administrator</strong> melalui Panel Admin tanpa perlu registrasi email.
              </p>

              {/* Divider + Google Sign-In for Admin/Owner */}
              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="shrink mx-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  atau
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => void onSignInWithGoogle()}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Masuk dengan Akun Google (Admin)</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
