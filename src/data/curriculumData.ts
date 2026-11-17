import {
  AiConfig,
  DifficultyLevel,
  JenjangPendidikan,
  KopLineStyles,
  KopSuratConfig,
  LearningExperience,
  QuestionCountOption,
  TkaJenisSoal,
} from '../types/assessment';

export const AI_PROVIDER_OPTIONS = [
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    models: [
      { id: 'gemini-4-hydrogen', label: 'gemini-4-hydrogen (Flash — Cepat & Cerdas)' },
      { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Ringan & Ultra Cepat)' },
      { id: 'gemini-4-argon', label: 'gemini-4-argon (Pro — Penalaran Mendalam)' },
    ],
    placeholder: 'AIzaSy...',
  },
  {
    id: 'anthropic' as const,
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-7-sonnet', label: 'claude-3-7-sonnet (Analitis Unggul)' },
      { id: 'claude-3-5-haiku', label: 'claude-3-5-haiku (Respons Cepat)' },
    ],
    placeholder: 'sk-ant-api03-...',
  },
  {
    id: 'openai' as const,
    name: 'OpenAI ChatGPT',
    models: [
      { id: 'gpt-4o', label: 'gpt-4o (Multimodal Standar Tinggi)' },
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini (Hemat & Cepat)' },
    ],
    placeholder: 'sk-proj-...',
  },
];

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'gemini',
  model: 'gemini-4-hydrogen',
  keys: {
    gemini: '',
    anthropic: '',
    openai: '',
  },
};

export const KOP_FONT_SIZE_OPTIONS: number[] = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22,
];

export const DEFAULT_KOP_FONT_SIZES = {
  baris1: 11,
  baris2: 11,
  baris3: 10,
  baris4: 14,
  baris5: 9,
  baris6: 8,
};

export const DEFAULT_KOP_LINE_STYLES: KopLineStyles = {
  baris1: { fontSize: 11, bold: true, italic: false, underline: false, align: 'center' },
  baris2: { fontSize: 11, bold: true, italic: false, underline: false, align: 'center' },
  baris3: { fontSize: 10, bold: false, italic: false, underline: false, align: 'center' },
  baris4: { fontSize: 14, bold: true, italic: false, underline: false, align: 'center' },
  baris5: { fontSize: 9, bold: false, italic: false, underline: false, align: 'center' },
  baris6: { fontSize: 8, bold: false, italic: false, underline: false, align: 'center' },
};

export const DEFAULT_LOGO_SIZE = 64;

export const DEFAULT_KOP_SURAT: KopSuratConfig = {
  logoKiri: '',
  logoKanan: '',
  logoKiriSize: DEFAULT_LOGO_SIZE,
  logoKananSize: DEFAULT_LOGO_SIZE,
  kopBaris1: 'PEMERINTAH PROVINSI JAWA TENGAH',
  kopBaris2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kopBaris3: 'CABANG DINAS PENDIDIKAN WILAYAH III',
  namaSatuanPendidikan: 'SMA NEGERI 1 KUDUS',
  kopBaris5: 'Jalan Pramuka No. 41, Mlati Lor, Kab. Kudus, Kode Pos 59319',
  kopBaris6:
    'Telepon (0291) 431368 · Laman: www.sman1kudus.sch.id · Pos-el: info@sman1kudus.sch.id',
  kopFontSizes: DEFAULT_KOP_FONT_SIZES,
  kopLineStyles: DEFAULT_KOP_LINE_STYLES,
  namaKegiatan: 'Simulasi Tes Kemampuan Akademik (TKA) & Asesmen Nasional',
  tahunPelajaran: '2026 / 2027',
  alokasiWaktu: '90 Menit',
  tempatTanggal: 'Kudus, 16 November 2026',
  jabatanKepalaSekolah: 'Kepala Sekolah',
  namaKepalaSekolah: 'Drs. H. Ahmad Sudrajat, M.Pd.',
  nipKepalaSekolah: '19690412 199512 1 002',
  jabatanPenyusun: 'Guru Penyusun Soal',
  namaPenyusun: 'Siti Rahmawati, S.Pd., M.Pd.',
  nipPenyusun: '19850817 201001 2 015',
};

export const TKA_JENIS_SOAL_OPTIONS: TkaJenisSoal[] = [
  'Literasi Membaca',
  'Numerasi',
  'Sains',
];

export const TKA_SUBDOMAIN_MAP: Record<TkaJenisSoal, string[]> = {
  'Literasi Membaca': [
    'Teks fiksi (cerita, dongeng) dengan narasi deskripsi',
    'Teks nonfiksi (artikel, laporan, infografik) dengan gambar dan tanpa gambar',
  ],
  Numerasi: [
    'Bilangan',
    'Mengukur',
    'Data',
    'Geometri & peluang',
    'Perbandingan & Proporsi',
  ],
  Sains: [
    'Biologi',
    'Fisika',
    'Kimia',
    'Ilmu bumi & lingkungan',
    'Ilmu sosial & budaya',
  ],
};

export const TKA_BENTUK_SOAL: string[] = [
  'Pilihan ganda',
  'Pilihan ganda kompleks',
  'Isian singkat',
  'Uraian / esai',
  'Menjodohkan',
  'Benar–salah',
  'Berbasis konteks/stimulus',
  'Studi kasus',
  'Praktik / kinerja',
  'Menentukan respon yang paling tepat / paling tidak tepat',
  'Tes Penilaian Situasional',
];

export const MAPEL_BENTUK_SOAL: string[] = [
  'Pilihan ganda',
  'Pilihan ganda kompleks',
  'Isian singkat',
  'Uraian / esai',
  'Menjodohkan',
  'Benar–salah',
  'Berbasis konteks / stimulus',
  'Studi kasus',
  'Praktik / kinerja',
  'Menentukan respons paling tepat / paling tidak tepat',
];

export const QUESTION_COUNT_OPTIONS: QuestionCountOption[] = [
  5, 10, 25, 50, 75, 100,
];

export const DIFFICULTY_LEVELS: Array<{
  id: DifficultyLevel;
  label: string;
  desc: string;
}> = [
  {
    id: 'LOTS',
    label: 'LOTS',
    desc: 'Lower Order Thinking Skills (Mengingat & Memahami)',
  },
  {
    id: 'MOTS',
    label: 'MOTS',
    desc: 'Middle Order Thinking Skills (Mengaplikasi)',
  },
  {
    id: 'HOTS',
    label: 'HOTS',
    desc: 'Higher Order Thinking Skills (Menganalisis, Mengevaluasi, Mencipta)',
  },
];

export const LEARNING_EXPERIENCES: Array<{
  id: LearningExperience;
  label: string;
  desc: string;
}> = [
  {
    id: 'Memahami',
    label: 'Memahami',
    desc: 'Menguji pemahaman dasar dan penguasaan konsep esensial',
  },
  {
    id: 'Mengaplikasi',
    label: 'Mengaplikasi',
    desc: 'Aplikasi konsep dalam pemecahan konteks nyata',
  },
  {
    id: 'Merefleksi',
    label: 'Merefleksi',
    desc: 'Refleksi kritis, logis, evaluatif, dan sistematis',
  },
];

export const FASE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'Fase A', label: 'Fase A (Kelas I–II SD/MI)' },
  { id: 'Fase B', label: 'Fase B (Kelas III–IV SD/MI)' },
  { id: 'Fase C', label: 'Fase C (Kelas V–VI SD/MI)' },
  { id: 'Fase D', label: 'Fase D (Kelas VII–IX SMP/MTs)' },
  { id: 'Fase E', label: 'Fase E (Kelas X SMA/MA/SMK)' },
  { id: 'Fase F', label: 'Fase F (Kelas XI–XII SMA/MA/SMK)' },
];

export const KELAS_BY_FASE: Record<string, string[]> = {
  'Fase A': ['Kelas I', 'Kelas II'],
  'Fase B': ['Kelas III', 'Kelas IV'],
  'Fase C': ['Kelas V', 'Kelas VI'],
  'Fase D': ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  'Fase E': ['Kelas X'],
  'Fase F': ['Kelas XI', 'Kelas XII'],
};

export const ALL_KELAS_OPTIONS: string[] = [
  'Kelas I',
  'Kelas II',
  'Kelas III',
  'Kelas IV',
  'Kelas V',
  'Kelas VI',
  'Kelas VII',
  'Kelas VIII',
  'Kelas IX',
  'Kelas X',
  'Kelas XI',
  'Kelas XII',
];

export const JENJANG_OPTIONS: JenjangPendidikan[] = [
  'SD / MI',
  'SMP / MTs',
  'SMA / MA',
  'SMK',
];

export const KELAS_BY_JENJANG: Record<JenjangPendidikan, string[]> = {
  'SD / MI': [
    'Kelas I',
    'Kelas II',
    'Kelas III',
    'Kelas IV',
    'Kelas V',
    'Kelas VI',
  ],
  'SMP / MTs': ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  'SMA / MA': ['Kelas X', 'Kelas XI', 'Kelas XII'],
  SMK: ['Kelas X', 'Kelas XI', 'Kelas XII'],
};

export const MAPEL_BY_JENJANG: Record<JenjangPendidikan, string[]> = {
  'SD / MI': [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    'Pendidikan Pancasila',
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Seni Budaya dan Prakarya',
    'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
  ],
  'SMP / MTs': [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Pancasila',
    'Informatika',
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Seni Budaya',
    'Prakarya',
    'PJOK',
  ],
  'SMA / MA': [
    'Matematika',
    'Matematika Tingkat Lanjut',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Fisika',
    'Kimia',
    'Biologi',
    'Ekonomi',
    'Sosiologi',
    'Geografi',
    'Sejarah',
    'Antropologi',
    'Pendidikan Pancasila',
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Informatika',
    'Seni dan Budaya',
  ],
  SMK: [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Projek IPAS',
    'Informatika',
    'Pendidikan Pancasila',
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Sejarah',
    'Dasar-Dasar Teknik Jaringan Komputer dan Telekomunikasi',
    'Dasar-Dasar Rekayasa Perangkat Lunak (PPLG)',
    'Dasar-Dasar Akuntansi dan Keuangan Lembaga',
    'Dasar-Dasar Manajemen Perkantoran dan Layanan Bisnis',
    'Dasar-Dasar Teknik Otomotif',
    'Dasar-Dasar Kuliner & Tata Boga',
    'Projek Kreatif dan Kewirausahaan (PKK)',
  ],
};
