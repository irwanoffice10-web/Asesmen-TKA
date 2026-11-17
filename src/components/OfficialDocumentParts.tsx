import {
  DEFAULT_KOP_LINE_STYLES,
  DEFAULT_LOGO_SIZE,
} from '../data/curriculumData';
import {
  AssessmentMetadata,
  KopLineStyle,
  KopSuratConfig,
} from '../types/assessment';

interface KopSuratViewProps {
  kop: KopSuratConfig;
  meta: AssessmentMetadata;
  totalQuestions: number;
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

export function OfficialKopAndIdentity({
  kop,
  meta,
  totalQuestions,
}: KopSuratViewProps) {
  const styles = kop.kopLineStyles || DEFAULT_KOP_LINE_STYLES;
  const logoKiriSize = kop.logoKiriSize ?? DEFAULT_LOGO_SIZE;
  const logoKananSize = kop.logoKananSize ?? DEFAULT_LOGO_SIZE;

  return (
    <div className="space-y-4">
      {/* Kop Surat */}
      <div className="pb-3 border-b-[3px] border-slate-900 dark:border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div
            style={{ width: `${logoKiriSize}px`, height: `${logoKiriSize}px` }}
            className="shrink-0 flex items-center justify-center"
          >
            {kop.logoKiri && (
              <img
                src={kop.logoKiri}
                alt="Logo Instansi"
                referrerPolicy="no-referrer"
                style={{ width: `${logoKiriSize}px`, height: `${logoKiriSize}px` }}
                className="object-contain"
              />
            )}
          </div>

          <div className="flex-1 text-slate-900 dark:text-slate-100 leading-tight">
            {kop.kopBaris1 && (
              <div
                style={getInlineCssStyle(styles.baris1)}
                className="tracking-wide"
              >
                {kop.kopBaris1}
              </div>
            )}
            {kop.kopBaris2 && (
              <div
                style={getInlineCssStyle(styles.baris2)}
                className="tracking-wide mt-0.5"
              >
                {kop.kopBaris2}
              </div>
            )}
            {kop.kopBaris3 && (
              <div
                style={getInlineCssStyle(styles.baris3)}
                className="tracking-wide mt-0.5"
              >
                {kop.kopBaris3}
              </div>
            )}
            <div
              style={getInlineCssStyle(styles.baris4)}
              className="mt-0.5"
            >
              {kop.namaSatuanPendidikan || meta.satuanPendidikan}
            </div>
            {kop.kopBaris5 && (
              <div
                style={getInlineCssStyle(styles.baris5)}
                className="text-slate-600 dark:text-slate-400 mt-0.5"
              >
                {kop.kopBaris5}
              </div>
            )}
            {kop.kopBaris6 && (
              <div
                style={getInlineCssStyle(styles.baris6)}
                className="text-slate-600 dark:text-slate-400 mt-0.5"
              >
                {kop.kopBaris6}
              </div>
            )}
          </div>

          <div
            style={{ width: `${logoKananSize}px`, height: `${logoKananSize}px` }}
            className="shrink-0 flex items-center justify-center"
          >
            {kop.logoKanan && (
              <img
                src={kop.logoKanan}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                style={{ width: `${logoKananSize}px`, height: `${logoKananSize}px` }}
                className="object-contain"
              />
            )}
          </div>
        </div>
      </div>
      <div className="!mt-0.5 border-b border-slate-900 dark:border-slate-200" />

      {/* Identitas Naskah */}
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
        <div className="text-center text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
          {kop.namaKegiatan || meta.judulAsesmen}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Mata Uji / Bidang</span>
            <span>: {meta.subJudul}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Tahun Pelajaran</span>
            <span>: {kop.tahunPelajaran || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Kelas / Fase</span>
            <span>
              : {meta.kelas || '-'} ({meta.faseAtauJenjang || '-'})
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Alokasi Waktu</span>
            <span>: {kop.alokasiWaktu || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Jumlah Soal</span>
            <span className="tabular-nums">: {totalQuestions} Butir Soal</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-36 shrink-0">Satuan Pendidikan</span>
            <span>
              : {kop.namaSatuanPendidikan || meta.satuanPendidikan || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfficialSignatureBlock({ kop }: { kop: KopSuratConfig }) {
  return (
    <div className="avoid-page-break pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-slate-800 dark:text-slate-200">
      <div>
        <div>Mengetahui,</div>
        <div className="font-semibold">
          {kop.jabatanKepalaSekolah || 'Kepala Sekolah'}
        </div>
        <div className="h-16" />
        <div className="font-bold underline">
          {kop.namaKepalaSekolah || '................................'}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono-tabular mt-0.5">
          NIP. {kop.nipKepalaSekolah || '-'}
        </div>
      </div>

      <div>
        <div>{kop.tempatTanggal || ''}</div>
        <div className="font-semibold">
          {kop.jabatanPenyusun || 'Guru Penyusun Soal'}
        </div>
        <div className="h-16" />
        <div className="font-bold underline">
          {kop.namaPenyusun || '................................'}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono-tabular mt-0.5">
          NIP. {kop.nipPenyusun || '-'}
        </div>
      </div>
    </div>
  );
}
