import { useState, ChangeEvent } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  FileText,
  Italic,
  Link2,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';
import {
  DEFAULT_KOP_LINE_STYLES,
  DEFAULT_LOGO_SIZE,
  KOP_FONT_SIZE_OPTIONS,
} from '../data/curriculumData';
import {
  KopLineStyle,
  KopLineStyles,
  KopSuratConfig,
  TextAlignOption,
} from '../types/assessment';

interface KopSuratAccordionProps {
  config: KopSuratConfig;
  onChange: (next: KopSuratConfig) => void;
  onSchoolNameChange: (schoolName: string) => void;
  alwaysExpanded?: boolean;
}

interface LineToolbarProps {
  label: string;
  styleValue: KopLineStyle;
  onChangeStyle: (patch: Partial<KopLineStyle>) => void;
}

function KopLineFormatToolbar({
  label,
  styleValue,
  onChangeStyle,
}: LineToolbarProps) {
  const alignButtons: Array<{
    value: TextAlignOption;
    title: string;
    Icon: typeof AlignLeft;
  }> = [
    { value: 'left', title: 'Rata Kiri (Left)', Icon: AlignLeft },
    { value: 'center', title: 'Rata Tengah (Center)', Icon: AlignCenter },
    { value: 'right', title: 'Rata Kanan (Right)', Icon: AlignRight },
    { value: 'justify', title: 'Rata Kanan-Kiri (Justify)', Icon: AlignJustify },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-1">
        <select
          aria-label={`Ukuran huruf ${label}`}
          value={styleValue.fontSize}
          onChange={(e) =>
            onChangeStyle({ fontSize: Number(e.target.value) })
          }
          className="px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums"
        >
          {KOP_FONT_SIZE_OPTIONS.map((pt) => (
            <option key={pt} value={pt}>
              {pt} pt
            </option>
          ))}
        </select>

        <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden">
          <button
            type="button"
            title="Tebal (Bold)"
            aria-pressed={styleValue.bold}
            onClick={() => onChangeStyle({ bold: !styleValue.bold })}
            className={`p-1 transition-colors cursor-pointer ${
              styleValue.bold
                ? 'theme-gradient-bg text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Miring (Italic)"
            aria-pressed={styleValue.italic}
            onClick={() => onChangeStyle({ italic: !styleValue.italic })}
            className={`p-1 border-l border-slate-200 dark:border-slate-800 transition-colors cursor-pointer ${
              styleValue.italic
                ? 'theme-gradient-bg text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Garis Bawah (Underline)"
            aria-pressed={styleValue.underline}
            onClick={() => onChangeStyle({ underline: !styleValue.underline })}
            className={`p-1 border-l border-slate-200 dark:border-slate-800 transition-colors cursor-pointer ${
              styleValue.underline
                ? 'theme-gradient-bg text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden">
          {alignButtons.map(({ value, title, Icon }, idx) => (
            <button
              key={value}
              type="button"
              title={title}
              aria-pressed={styleValue.align === value}
              onClick={() => onChangeStyle({ align: value })}
              className={`p-1 transition-colors cursor-pointer ${
                idx > 0 ? 'border-l border-slate-200 dark:border-slate-800' : ''
              } ${
                styleValue.align === value
                  ? 'theme-gradient-bg text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getInlineCssStyle(s: KopLineStyle) {
  return {
    fontSize: `${s.fontSize}pt`,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? ('italic' as const) : ('normal' as const),
    textDecoration: s.underline ? ('underline' as const) : ('none' as const),
    textAlign: s.align,
  };
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result || file.type === 'image/svg+xml') {
        resolve(result.slice(0, 340000));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result.slice(0, 340000));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const pngData = canvas.toDataURL('image/png');
        if (pngData.length <= 320000) {
          resolve(pngData);
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        }
      };
      img.onerror = () => resolve(result.slice(0, 340000));
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export function KopSuratAccordion({
  config,
  onChange,
  onSchoolNameChange,
  alwaysExpanded = false,
}: KopSuratAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);
  const showBody = alwaysExpanded || isExpanded;

  const handleImageUpload =
    (field: 'logoKiri' | 'logoKanan') =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        onChange({ ...config, [field]: dataUrl });
      }
      e.target.value = '';
    };

  const updateField = <K extends keyof KopSuratConfig>(
    key: K,
    value: KopSuratConfig[K]
  ) => {
    if (key === 'namaSatuanPendidikan') {
      onSchoolNameChange(String(value));
    } else {
      onChange({ ...config, [key]: value });
    }
  };

  const styles = config.kopLineStyles || DEFAULT_KOP_LINE_STYLES;
  const logoKiriSize = config.logoKiriSize ?? DEFAULT_LOGO_SIZE;
  const logoKananSize = config.logoKananSize ?? DEFAULT_LOGO_SIZE;

  const clampLogoSize = (val: number) => Math.max(32, Math.min(140, val));

  const updateLineStyle = (
    line: keyof KopLineStyles,
    patch: Partial<KopLineStyle>
  ) => {
    onChange({
      ...config,
      kopLineStyles: {
        ...styles,
        [line]: {
          ...styles[line],
          ...patch,
        },
      },
    });
  };

  return (
    <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm overflow-hidden">
      {!alwaysExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg theme-gradient-bg text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Pengaturan Kop Surat &amp; Tanda Tangan Resmi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {config.namaSatuanPendidikan || 'Nama Satuan Pendidikan'} ·{' '}
                {config.namaKegiatan || 'Identitas Naskah'} · Dikelola Admin
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold theme-accent-text shrink-0 whitespace-nowrap">
            {isExpanded ? 'Tutup Pengaturan' : 'Atur Kop & Tanda Tangan'}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>
      )}

      {showBody && (
        <div
          className={`px-5 pb-6 ${
            alwaysExpanded ? 'pt-5' : 'pt-2 border-t border-slate-200 dark:border-slate-800'
          } space-y-6`}
        >
          {/* Live Preview of Kop Surat */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Pratinjau Kop Surat Resmi
            </div>
            <div className="bg-white text-slate-900 p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between gap-4 pb-2.5 border-b-[3px] border-slate-900">
                <div
                  style={{ width: `${logoKiriSize}px`, height: `${logoKiriSize}px` }}
                  className="flex items-center justify-center shrink-0"
                >
                  {config.logoKiri ? (
                    <img
                      src={config.logoKiri}
                      alt="Logo Kiri"
                      referrerPolicy="no-referrer"
                      style={{ width: `${logoKiriSize}px`, height: `${logoKiriSize}px` }}
                      className="object-contain"
                    />
                  ) : (
                    <div
                      style={{ width: `${logoKiriSize}px`, height: `${logoKiriSize}px` }}
                      className="rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center"
                    >
                      Logo Kiri
                    </div>
                  )}
                </div>
                <div className="flex-1 leading-tight">
                  {config.kopBaris1 && (
                    <div
                      style={getInlineCssStyle(styles.baris1)}
                      className="tracking-wide"
                    >
                      {config.kopBaris1}
                    </div>
                  )}
                  {config.kopBaris2 && (
                    <div
                      style={getInlineCssStyle(styles.baris2)}
                      className="tracking-wide mt-0.5"
                    >
                      {config.kopBaris2}
                    </div>
                  )}
                  {config.kopBaris3 && (
                    <div
                      style={getInlineCssStyle(styles.baris3)}
                      className="tracking-wide mt-0.5"
                    >
                      {config.kopBaris3}
                    </div>
                  )}
                  <div
                    style={getInlineCssStyle(styles.baris4)}
                    className="mt-0.5"
                  >
                    {config.namaSatuanPendidikan || 'Nama Satuan Pendidikan'}
                  </div>
                  {config.kopBaris5 && (
                    <div
                      style={getInlineCssStyle(styles.baris5)}
                      className="text-slate-600 mt-0.5"
                    >
                      {config.kopBaris5}
                    </div>
                  )}
                  {config.kopBaris6 && (
                    <div
                      style={getInlineCssStyle(styles.baris6)}
                      className="text-slate-600 mt-0.5"
                    >
                      {config.kopBaris6}
                    </div>
                  )}
                </div>
                <div
                  style={{ width: `${logoKananSize}px`, height: `${logoKananSize}px` }}
                  className="flex items-center justify-center shrink-0"
                >
                  {config.logoKanan ? (
                    <img
                      src={config.logoKanan}
                      alt="Logo Kanan"
                      referrerPolicy="no-referrer"
                      style={{ width: `${logoKananSize}px`, height: `${logoKananSize}px` }}
                      className="object-contain"
                    />
                  ) : (
                    <div
                      style={{ width: `${logoKananSize}px`, height: `${logoKananSize}px` }}
                      className="rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center"
                    >
                      Logo Kanan
                    </div>
                  )}
                </div>
              </div>
              <div className="border-b border-slate-900 mt-0.5" />
            </div>
          </div>

          {/* 1. Upload Two Logos or Input Image URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/45 dark:bg-sky-950/20 space-y-3">
              <div className="text-sm font-bold text-sky-900 dark:text-sky-200">
                Logo Kiri (Pemprov / Dinas / Yayasan)
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleImageUpload('logoKiri')}
                    className="hidden"
                  />
                </label>
                {config.logoKiri && (
                  <button
                    type="button"
                    onClick={() => updateField('logoKiri', '')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  value={
                    config.logoKiri.startsWith('data:') ? '' : config.logoKiri
                  }
                  onChange={(e) => updateField('logoKiri', e.target.value)}
                  placeholder="Atau tempel link URL gambar logo kiri (https://...)"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Ukuran Logo Kiri
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {logoKiriSize} px
                    </span>
                    {logoKiriSize !== DEFAULT_LOGO_SIZE && (
                      <button
                        type="button"
                        onClick={() => updateField('logoKiriSize', DEFAULT_LOGO_SIZE)}
                        className="text-[11px] font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Perkecil Logo Kiri"
                    onClick={() =>
                      updateField('logoKiriSize', clampLogoSize(logoKiriSize - 4))
                    }
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min={32}
                    max={140}
                    step={2}
                    aria-label="Atur ukuran Logo Kiri"
                    value={logoKiriSize}
                    onChange={(e) =>
                      updateField('logoKiriSize', Number(e.target.value))
                    }
                    className="w-full accent-sky-700 cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Perbesar Logo Kiri"
                    onClick={() =>
                      updateField('logoKiriSize', clampLogoSize(logoKiriSize + 4))
                    }
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/45 dark:bg-emerald-950/20 space-y-3">
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Logo Kanan (Logo Sekolah / Satuan Pendidikan)
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleImageUpload('logoKanan')}
                    className="hidden"
                  />
                </label>
                {config.logoKanan && (
                  <button
                    type="button"
                    onClick={() => updateField('logoKanan', '')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  value={
                    config.logoKanan.startsWith('data:') ? '' : config.logoKanan
                  }
                  onChange={(e) => updateField('logoKanan', e.target.value)}
                  placeholder="Atau tempel link URL gambar logo kanan (https://...)"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Ukuran Logo Kanan
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {logoKananSize} px
                    </span>
                    {logoKananSize !== DEFAULT_LOGO_SIZE && (
                      <button
                        type="button"
                        onClick={() => updateField('logoKananSize', DEFAULT_LOGO_SIZE)}
                        className="text-[11px] font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Perkecil Logo Kanan"
                    onClick={() =>
                      updateField('logoKananSize', clampLogoSize(logoKananSize - 4))
                    }
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min={32}
                    max={140}
                    step={2}
                    aria-label="Atur ukuran Logo Kanan"
                    value={logoKananSize}
                    onChange={(e) =>
                      updateField('logoKananSize', Number(e.target.value))
                    }
                    className="w-full accent-sky-700 cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Perbesar Logo Kanan"
                    onClick={() =>
                      updateField('logoKananSize', clampLogoSize(logoKananSize + 4))
                    }
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Kop Surat Header Text (6 Baris + Format Font B, I, U & Alignment) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <KopLineFormatToolbar
                label="Baris 1: Pemda / Kementerian / Yayasan"
                styleValue={styles.baris1}
                onChangeStyle={(patch) => updateLineStyle('baris1', patch)}
              />
              <input
                type="text"
                value={config.kopBaris1}
                onChange={(e) => updateField('kopBaris1', e.target.value)}
                placeholder="PEMERINTAH PROVINSI JAWA TENGAH"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <KopLineFormatToolbar
                label="Baris 2: Dinas / Badan Penyelenggara"
                styleValue={styles.baris2}
                onChangeStyle={(patch) => updateLineStyle('baris2', patch)}
              />
              <input
                type="text"
                value={config.kopBaris2}
                onChange={(e) => updateField('kopBaris2', e.target.value)}
                placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <KopLineFormatToolbar
                label="Baris 3: Cabang Dinas / Wilayah"
                styleValue={styles.baris3}
                onChangeStyle={(patch) => updateLineStyle('baris3', patch)}
              />
              <input
                type="text"
                value={config.kopBaris3}
                onChange={(e) => updateField('kopBaris3', e.target.value)}
                placeholder="CABANG DINAS PENDIDIKAN WILAYAH III"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <KopLineFormatToolbar
                label="Baris 4: Nama Satuan Pendidikan"
                styleValue={styles.baris4}
                onChangeStyle={(patch) => updateLineStyle('baris4', patch)}
              />
              <input
                type="text"
                value={config.namaSatuanPendidikan}
                onChange={(e) =>
                  updateField('namaSatuanPendidikan', e.target.value)
                }
                placeholder="SMA NEGERI 1 KUDUS"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <KopLineFormatToolbar
                label="Baris 5: Alamat Lengkap & Kode Pos"
                styleValue={styles.baris5}
                onChangeStyle={(patch) => updateLineStyle('baris5', patch)}
              />
              <input
                type="text"
                value={config.kopBaris5}
                onChange={(e) => updateField('kopBaris5', e.target.value)}
                placeholder="Jalan Pramuka No. 41, Mlati Lor, Kab. Kudus, Kode Pos 59319"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <KopLineFormatToolbar
                label="Baris 6: Telepon, Laman & Email"
                styleValue={styles.baris6}
                onChangeStyle={(patch) => updateLineStyle('baris6', patch)}
              />
              <input
                type="text"
                value={config.kopBaris6}
                onChange={(e) => updateField('kopBaris6', e.target.value)}
                placeholder="Telepon (0291) 431368 · Laman: www.sman1kudus.sch.id · Pos-el: info@sman1kudus.sch.id"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* 3. Identitas Naskah & Blok Tanda Tangan */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
              Identitas Naskah Ujian &amp; Blok Tanda Tangan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Kegiatan / Asesmen
                </label>
                <input
                  type="text"
                  value={config.namaKegiatan}
                  onChange={(e) => updateField('namaKegiatan', e.target.value)}
                  placeholder="Asesmen Sumatif Akhir Semester / Simulasi TKA"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  value={config.tahunPelajaran}
                  onChange={(e) => updateField('tahunPelajaran', e.target.value)}
                  placeholder="2026 / 2027"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alokasi Waktu
                </label>
                <input
                  type="text"
                  value={config.alokasiWaktu}
                  onChange={(e) => updateField('alokasiWaktu', e.target.value)}
                  placeholder="90 Menit"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kepala Sekolah */}
              <div className="p-4 rounded-xl bg-indigo-50/45 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  Pejabat Penandatangan Kiri (Kepala Sekolah)
                </div>
                <input
                  type="text"
                  value={config.jabatanKepalaSekolah}
                  onChange={(e) =>
                    updateField('jabatanKepalaSekolah', e.target.value)
                  }
                  placeholder="Jabatan (misal: Kepala Sekolah)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={config.namaKepalaSekolah}
                  onChange={(e) =>
                    updateField('namaKepalaSekolah', e.target.value)
                  }
                  placeholder="Nama Lengkap Kepala Sekolah & Gelar"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={config.nipKepalaSekolah}
                  onChange={(e) =>
                    updateField('nipKepalaSekolah', e.target.value)
                  }
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              {/* Guru Penyusun */}
              <div className="p-4 rounded-xl bg-amber-50/45 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Pejabat Penandatangan Kanan (Penyusun Soal)
                </div>
                <input
                  type="text"
                  value={config.tempatTanggal}
                  onChange={(e) => updateField('tempatTanggal', e.target.value)}
                  placeholder="Tempat & Tanggal (misal: Kudus, 16 November 2026)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={config.jabatanPenyusun}
                  onChange={(e) => updateField('jabatanPenyusun', e.target.value)}
                  placeholder="Jabatan (misal: Guru Penyusun Soal)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={config.namaPenyusun}
                    onChange={(e) =>
                      updateField('namaPenyusun', e.target.value)
                    }
                    placeholder="Nama Guru Penyusun"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={config.nipPenyusun}
                    onChange={(e) => updateField('nipPenyusun', e.target.value)}
                    placeholder="NIP Penyusun"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
