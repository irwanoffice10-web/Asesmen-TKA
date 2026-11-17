import { useEffect, useRef, useState } from 'react';
import { Check, Moon, Palette, Settings2, Sun } from 'lucide-react';
import { APP_THEMES } from '../data/themes';
import {
  ActiveFeatureTab,
  AiConfig,
  AppThemeId,
} from '../types/assessment';

interface HeaderProps {
  activeTab: ActiveFeatureTab;
  onTabChange: (tab: ActiveFeatureTab) => void;
  aiConfig: AiConfig;
  hasServerGeminiKey: boolean;
  onOpenApiConfig: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeTheme: AppThemeId;
  onChangeTheme: (theme: AppThemeId) => void;
}

export function Header({
  activeTab,
  onTabChange,
  aiConfig,
  hasServerGeminiKey,
  onOpenApiConfig,
  isDark,
  onToggleDark,
  activeTheme,
  onChangeTheme,
}: HeaderProps) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isThemeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(e.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeMenuOpen]);

  const activeKeyConfigured =
    Boolean(aiConfig.keys[aiConfig.provider]?.trim()) ||
    (aiConfig.provider === 'gemini' && hasServerGeminiKey);

  const providerShortName =
    aiConfig.provider === 'gemini'
      ? 'Gemini'
      : aiConfig.provider === 'anthropic'
        ? 'Claude'
        : 'ChatGPT';

  const currentThemeMeta =
    APP_THEMES.find((t) => t.id === activeTheme) || APP_THEMES[0];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      {/* Top 3-stop spectrum bar matching active theme */}
      <div className="h-1 w-full theme-spectrum-bar" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
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
        </nav>

        {/* Zone 3: Theme Selector, Dark Switch & Multi-AI API Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Colorful Theme Picker Popover */}
          <div ref={themeMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              aria-expanded={isThemeMenuOpen}
              aria-label="Pilih tema warna tampilan"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Palette className="w-4 h-4 theme-accent-text shrink-0" />
              <span className="hidden sm:inline">{currentThemeMeta.name}</span>
              <span className="flex items-center -space-x-1">
                {currentThemeMeta.swatches.map((hex, i) => (
                  <span
                    key={i}
                    style={{ backgroundColor: hex }}
                    className="w-2.5 h-2.5 rounded-full ring-1 ring-white dark:ring-slate-900"
                  />
                ))}
              </span>
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2 z-40 space-y-1">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Pilih Tema Warna Portal</span>
                  <span className="text-[10px] font-medium">
                    {isDark ? 'Mode Gelap' : 'Mode Terang'}
                  </span>
                </div>

                {APP_THEMES.map((theme) => {
                  const selected = theme.id === activeTheme;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onChangeTheme(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selected
                          ? 'theme-soft-surface border'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center -space-x-1 shrink-0">
                          {theme.swatches.map((hex, idx) => (
                            <span
                              key={idx}
                              style={{ backgroundColor: hex }}
                              className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                            />
                          ))}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
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
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            type="button"
            onClick={onOpenApiConfig}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold theme-btn-primary whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings2 className="w-4 h-4 shrink-0" />
            <span>
              API: {providerShortName} (
              {activeKeyConfigured ? 'Aktif' : 'Belum Diatur'})
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Row */}
      <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 px-4">
        <button
          type="button"
          onClick={() => onTabChange('tka')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tka'
              ? 'border-[var(--theme-primary)] theme-accent-text'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          TKA &amp; Asesmen Nasional
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
          Semua Mata Pelajaran
        </button>
      </div>
    </header>
  );
}
