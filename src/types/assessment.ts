export type AiProvider = 'gemini' | 'anthropic' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  keys: {
    gemini: string;
    anthropic: string;
    openai: string;
  };
}

export type TextAlignOption = 'left' | 'center' | 'right' | 'justify';

export interface KopLineStyle {
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlignOption;
}

export interface KopLineStyles {
  baris1: KopLineStyle;
  baris2: KopLineStyle;
  baris3: KopLineStyle;
  baris4: KopLineStyle;
  baris5: KopLineStyle;
  baris6: KopLineStyle;
}

export interface KopFontSizes {
  baris1: number;
  baris2: number;
  baris3: number;
  baris4: number;
  baris5: number;
  baris6: number;
}

export interface KopSuratConfig {
  logoKiri: string;
  logoKanan: string;
  logoKiriSize?: number;
  logoKananSize?: number;
  kopBaris1: string;
  kopBaris2: string;
  kopBaris3: string;
  namaSatuanPendidikan: string;
  kopBaris5: string;
  kopBaris6: string;
  kopFontSizes?: KopFontSizes;
  kopLineStyles: KopLineStyles;
  namaKegiatan: string;
  tahunPelajaran: string;
  alokasiWaktu: string;
  tempatTanggal: string;
  jabatanKepalaSekolah: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  jabatanPenyusun: string;
  namaPenyusun: string;
  nipPenyusun: string;
}

export type ActiveFeatureTab = 'tka' | 'mapel';
export type ResultSubTab = 'editor' | 'kisikisi' | 'simulasi';

export type QuestionCountOption = 5 | 10 | 25 | 50 | 75 | 100;
export type DifficultyLevel = 'LOTS' | 'MOTS' | 'HOTS';
export type LearningExperience = 'Memahami' | 'Mengaplikasi' | 'Merefleksi';

export type TkaJenisSoal = 'Literasi Membaca' | 'Numerasi' | 'Sains';

export interface TkaFormState {
  namaSatuanPendidikan: string;
  fase: string;
  kelas: string;
  jenisSoal: TkaJenisSoal[];
  subdomain: string[];
  bentukSoal: Record<string, QuestionCountOption>;
  tingkatKesulitan: DifficultyLevel[];
  pengalamanBelajar: LearningExperience[];
}

export type JenjangPendidikan = 'SD / MI' | 'SMP / MTs' | 'SMA / MA' | 'SMK';

export interface MapelFormState {
  namaSatuanPendidikan: string;
  jenjang: JenjangPendidikan;
  mataPelajaran: string;
  kelas: string;
  topikMateri1: string;
  topikMateri2: string;
  bentukSoal: Record<string, QuestionCountOption>;
  tingkatKesulitan: DifficultyLevel[];
  pengalamanBelajar: LearningExperience[];
}

export interface QuestionItem {
  nomor: number;
  capaian_pembelajaran: string;
  materi: string;
  indikator_soal: string;
  bentuk_soal: string;
  level_kognitif: DifficultyLevel | string;
  pengalaman_belajar: LearningExperience | string;
  stimulus: string;
  pertanyaan: string;
  opsi_jawaban: string[];
  kunci_jawaban: string;
  pembahasan: string;
  deskripsi_gambar: string;
  svg_ilustrasi?: string;
  custom_image?: string;
  image_deleted?: boolean;
}

export interface BatchProgressState {
  status: 'idle' | 'running' | 'completed' | 'stopped' | 'error';
  currentBatch: number;
  totalBatches: number;
  batchStartNumber: number;
  batchEndNumber: number;
  generatedCount: number;
  totalRequested: number;
  message: string;
  retryingAttempt: number;
  error?: string;
}

export interface AssessmentMetadata {
  mode: ActiveFeatureTab;
  satuanPendidikan: string;
  judulAsesmen: string;
  subJudul: string;
  kelas: string;
  faseAtauJenjang: string;
}

export type AppThemeId =
  | 'nusantara'
  | 'zamrud'
  | 'mentari'
  | 'angkasa'
  | 'delima';

export interface AppThemeMeta {
  id: AppThemeId;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
}
