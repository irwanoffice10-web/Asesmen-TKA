import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, X, AlertTriangle } from 'lucide-react';
import { AI_PROVIDER_OPTIONS } from '../data/curriculumData';
import { AiConfig, AiProvider } from '../types/assessment';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AiConfig;
  onChangeConfig: (next: AiConfig) => void;
  hasServerGeminiKey: boolean;
}

export function ApiConfigModal({
  isOpen,
  onClose,
  aiConfig,
  onChangeConfig,
  hasServerGeminiKey,
}: ApiConfigModalProps) {
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const selectedProviderMeta =
    AI_PROVIDER_OPTIONS.find((p) => p.id === aiConfig.provider) ||
    AI_PROVIDER_OPTIONS[0];

  const handleSelectProvider = (provider: AiProvider) => {
    const providerMeta = AI_PROVIDER_OPTIONS.find((p) => p.id === provider)!;
    onChangeConfig({
      ...aiConfig,
      provider,
      model: providerMeta.models[0].id,
    });
  };

  const handleModelChange = (model: string) => {
    onChangeConfig({
      ...aiConfig,
      model,
    });
  };

  const handleKeyChange = (value: string) => {
    onChangeConfig({
      ...aiConfig,
      keys: {
        ...aiConfig.keys,
        [aiConfig.provider]: value,
      },
    });
  };

  const currentKey = aiConfig.keys[aiConfig.provider] || '';
  const isConnected =
    Boolean(currentKey.trim()) ||
    (aiConfig.provider === 'gemini' && hasServerGeminiKey);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-config-title"
    >
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="h-1 w-full theme-spectrum-bar" />
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="api-config-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Pengaturan Multi-AI (API Config)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Konfigurasi penyedia AI, model, dan API Key disimpan otomatis di browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan API"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Connection Status */}
          <div
            className={`p-4 rounded-xl border ${
              isConnected
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {isConnected
                    ? `Koneksi Siap: ${selectedProviderMeta.name} (${aiConfig.model})`
                    : `API Key ${selectedProviderMeta.name} Diperlukan`}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isConnected
                    ? currentKey.trim()
                      ? 'Menggunakan API Key pribadi Anda yang tersimpan di LocalStorage.'
                      : 'Menggunakan konfigurasi Google Gemini bawaan sistem secara otomatis.'
                    : 'Masukkan API Key pada kolom di bawah ini untuk mengaktifkan penyedia AI pilihan Anda.'}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
              1. Pilih Penyedia Layanan AI
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {AI_PROVIDER_OPTIONS.map((prov) => {
                const isSelected = aiConfig.provider === prov.id;
                const hasKey =
                  Boolean(aiConfig.keys[prov.id]?.trim()) ||
                  (prov.id === 'gemini' && hasServerGeminiKey);
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
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
                      className={`text-xs font-medium whitespace-nowrap ${
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
          </div>

          {/* Model Selection */}
          <div>
            <label
              htmlFor="ai-model-select"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
            >
              2. Pilih Model AI
            </label>
            <select
              id="ai-model-select"
              value={
                selectedProviderMeta.models.some((m) => m.id === aiConfig.model)
                  ? aiConfig.model
                  : selectedProviderMeta.models[0].id
              }
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {selectedProviderMeta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label
              htmlFor="ai-api-key-input"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
            >
              3. API Key {selectedProviderMeta.name}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="ai-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={
                  aiConfig.provider === 'gemini' && hasServerGeminiKey
                    ? 'Opsional (kosongkan untuk memakai kunci bawaan server)'
                    : selectedProviderMeta.placeholder
                }
                className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
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
              Kunci API Anda disimpan secara lokal di LocalStorage browser dan dikirim melalui jalur server aman untuk menghindari kendala CORS saat memanggil Gemini, Claude, atau OpenAI.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg theme-btn-primary text-sm font-semibold transition-all cursor-pointer shadow-sm"
          >
            Simpan &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
