import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { ActiveFeatureTab, PortalUserProfile } from '../types/assessment';

interface HeaderProps {
  activeTab: ActiveFeatureTab;
  onTabChange: (tab: ActiveFeatureTab) => void;
  userProfile: PortalUserProfile;
  onLogout: () => Promise<void>;
}

export function Header({
  activeTab,
  onTabChange,
  userProfile,
  onLogout,
}: HeaderProps) {
  const isAdmin = userProfile.role === 'admin';
  const initials = (userProfile.displayName || userProfile.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      {/* Top 3-stop spectrum bar matching active theme */}
      <div className="h-1 w-full theme-spectrum-bar" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg theme-gradient-bg text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-sm">
            TKA
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
            AI Generator Asesmen &amp; Simulasi TKA
          </span>
        </div>

        {/* Zone 2: Primary Feature Navigation Tabs */}
        <nav
          aria-label="Navigasi Fitur Utama"
          className="hidden md:flex items-center gap-6"
        >
          <button
            type="button"
            onClick={() => onTabChange('tka')}
            className={`relative py-5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'tka'
                ? 'theme-accent-text'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            TKA &amp; Asesmen Nasional
            {activeTab === 'tka' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 theme-spectrum-bar rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('mapel')}
            className={`relative py-5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'mapel'
                ? 'theme-accent-text'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Semua Mata Pelajaran
            {activeTab === 'mapel' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 theme-spectrum-bar rounded-full" />
            )}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onTabChange('admin')}
              className={`relative py-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'admin'
                  ? 'theme-accent-text'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Panel Admin</span>
              {activeTab === 'admin' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 theme-spectrum-bar rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: User Identity & Sign Out */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full theme-gradient-bg text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {initials}
              </div>
            )}

            <div className="hidden sm:block min-w-0 leading-tight">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
                {userProfile.displayName}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold theme-accent-text">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>Administrator</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 shrink-0" />
                    <span>User / Guru</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            title="Keluar dari akun"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:border-rose-800 dark:hover:text-rose-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Row */}
      <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 px-3">
        <button
          type="button"
          onClick={() => onTabChange('tka')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tka'
              ? 'border-[var(--theme-primary)] theme-accent-text'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          TKA &amp; AN
        </button>
        <button
          type="button"
          onClick={() => onTabChange('mapel')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'mapel'
              ? 'border-[var(--theme-primary)] theme-accent-text'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          Semua Mapel
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onTabChange('admin')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'admin'
                ? 'border-[var(--theme-primary)] theme-accent-text'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Panel Admin
          </button>
        )}
      </div>
    </header>
  );
}
