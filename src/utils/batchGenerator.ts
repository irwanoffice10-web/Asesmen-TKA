import {
  AiConfig,
  BatchProgressState,
  DifficultyLevel,
  LearningExperience,
  MapelFormState,
  QuestionItem,
  TkaFormState,
} from '../types/assessment';
import { parseQuestionBatchJson } from './jsonParser';

const MAX_BATCH_SIZE = 10;
const INTER_BATCH_DELAY_MS = 1500;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 2;

export interface BatchSlotPlan {
  batchIndex: number;
  startNumber: number;
  endNumber: number;
  shapeCounts: Record<string, number>;
  difficultyCounts: Record<DifficultyLevel, number>;
  experienceCounts: Record<LearningExperience, number>;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Distributes all selected question shapes, difficulty levels, and learning
 * experiences proportionally into sequential batches of at most 10 questions.
 */
export function buildBatchPlan(
  bentukSoal: Record<string, number>,
  difficulties: DifficultyLevel[],
  experiences: LearningExperience[]
): BatchSlotPlan[] {
  const entries = Object.entries(bentukSoal).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return [];

  // Interleave shapes evenly across the flat sequence so every batch gets a proportional mix
  const remainingShapes = entries.map(([shape, count]) => ({ shape, count }));
  const flatShapes: string[] = [];
  while (flatShapes.length < total) {
    // Weighted round-robin proportional step
    for (let i = 0; i < remainingShapes.length; i++) {
      const item = remainingShapes[i];
      if (item.count > 0) {
        flatShapes.push(item.shape);
        item.count -= 1;
      }
    }
  }

  const activeDiffs: DifficultyLevel[] =
    difficulties.length > 0 ? difficulties : ['MOTS'];
  const activeExps: LearningExperience[] =
    experiences.length > 0 ? experiences : ['Mengaplikasi'];

  const totalBatches = Math.ceil(total / MAX_BATCH_SIZE);
  const plans: BatchSlotPlan[] = [];

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * MAX_BATCH_SIZE;
    const endIdx = Math.min(startIdx + MAX_BATCH_SIZE, total);
    const slice = flatShapes.slice(startIdx, endIdx);

    const shapeCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    const experienceCounts: Record<string, number> = {};

    slice.forEach((shape, offset) => {
      const globalIdx = startIdx + offset;
      shapeCounts[shape] = (shapeCounts[shape] || 0) + 1;

      const diff = activeDiffs[globalIdx % activeDiffs.length];
      difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

      const exp = activeExps[globalIdx % activeExps.length];
      experienceCounts[exp] = (experienceCounts[exp] || 0) + 1;
    });

    plans.push({
      batchIndex: b,
      startNumber: startIdx + 1,
      endNumber: endIdx,
      shapeCounts,
      difficultyCounts: difficultyCounts as Record<DifficultyLevel, number>,
      experienceCounts: experienceCounts as Record<LearningExperience, number>,
    });
  }

  return plans;
}

function resolveJenjangRules(
  mode: 'tka' | 'mapel',
  formState: TkaFormState | MapelFormState
): {
  levelLabel: string;
  mcCount: number;
  mcLetters: string;
  stimulusSentenceRule: string;
  complexStatementRule: string;
} {
  const faseOrJenjang =
    mode === 'tka'
      ? (formState as TkaFormState).fase
      : (formState as MapelFormState).jenjang;

  if (
    faseOrJenjang === 'Fase A' ||
    faseOrJenjang === 'Fase B' ||
    faseOrJenjang === 'Fase C' ||
    faseOrJenjang === 'SD / MI'
  ) {
    return {
      levelLabel: `SD/MI (${faseOrJenjang})`,
      mcCount: 4,
      mcLetters: 'A, B, C, D',
      stimulusSentenceRule:
        'Stimulus narasi WAJIB berupa minimal 1 paragraf yang terdiri atas minimal 4 kalimat lengkap dengan panjang dan kosakata yang disesuaikan untuk siswa SD/MI (sekitar 12–18 kata per kalimat), serta dapat dipadukan dengan data sederhana, tabel, gambar, atau grafik/diagram.',
      complexStatementRule:
        'Setiap pernyataan pada Pilihan Ganda Kompleks WAJIB berupa 1 kalimat utuh yang jelas dan komunikatif sesuai tingkat pemahaman SD/MI (sekitar 12–18 kata per kalimat).',
    };
  }

  if (faseOrJenjang === 'Fase D' || faseOrJenjang === 'SMP / MTs') {
    return {
      levelLabel: `SMP/MTs (${faseOrJenjang})`,
      mcCount: 4,
      mcLetters: 'A, B, C, D',
      stimulusSentenceRule:
        'Stimulus narasi WAJIB berupa minimal 1 paragraf yang terdiri atas minimal 4 kalimat lengkap dengan rata-rata 16–22 kata per kalimat yang disesuaikan untuk siswa SMP/MTs, serta dapat dipadukan dengan data, tabel, gambar, atau grafik/diagram.',
      complexStatementRule:
        'Setiap pernyataan pada Pilihan Ganda Kompleks WAJIB berupa 1 kalimat utuh sepanjang 16–22 kata yang kontekstual untuk siswa SMP/MTs.',
    };
  }

  // SMA / MA / SMK / Fase E / Fase F
  return {
    levelLabel: `SMA/MA/SMK (${faseOrJenjang})`,
    mcCount: 5,
    mcLetters: 'A, B, C, D, E',
    stimulusSentenceRule:
      'Stimulus narasi WAJIB berupa minimal 1 paragraf yang terdiri atas minimal 4 kalimat, di mana SETIAP kalimat terdiri atas 20–25 kata atau lebih (kalimat majemuk bertingkat/setara yang informatif), serta dipadukan atau divariasikan dengan data, tabel terstruktur, gambar, atau grafik/diagram.',
    complexStatementRule:
      'Setiap pernyataan pada Pilihan Ganda Kompleks WAJIB berupa 1 kalimat utuh yang terdiri atas 20–25 kata atau lebih.',
  };
}

function buildSystemPrompt(): string {
  return `Anda adalah Pakar Asesmen Pendidikan Nasional (Pusmendik Kemdikbudristek) dan Pengembang Instrumen Evaluasi Kurikulum Merdeka Indonesia yang sangat teliti dan profesional.

TUGAS UTAMA:
Susun butir soal asesmen berkualitas tinggi sesuai standar Asesmen Nasional (TKA/AKM) dan Kurikulum Merdeka.

ATURAN WAJIB STIMULUS, OPSI JAWABAN & DAYA PENGECOH:
1. STIMULUS WAJIB DI SETIAP SOAL:
   - Setiap nomor soal TANPA PENGECUALIAN wajib memiliki field "stimulus" yang berisi dan kaya konteks (JANGAN PERNAH mengosongkan "stimulus").
   - Variasikan bentuk stimulus berupa: narasi (minimal 1 paragraf berisi minimal 4 kalimat sesuai aturan panjang kalimat per jenjang), data kuantitatif, tabel (sajikan rapi dalam format tabel teks/markdown), gambar, atau grafik/diagram.
   - Jika stimulus berupa gambar/grafik/diagram, wajib isi "deskripsi_gambar" dengan detail visual spesifik serta buat "svg_ilustrasi" berisi string <svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">...</svg> yang rapi dan konsisten dengan angka/fakta pada stimulus.
2. PENALARAN TINGGI (MOTS & HOTS):
   - Pada level MOTS dan terutama HOTS, fokuskan butir soal pada kemampuan analisis, evaluasi, kreasi/pembuatan, berpikir logis-sistematis, dan pemecahan masalah kompleks berbasis stimulus kontekstual.
3. KISI-KISI LENGKAP:
   - Untuk setiap nomor soal, wajib hasilkan komponen Kisi-Kisi Soal terukur: Capaian Pembelajaran, Materi/Subdomain, Indikator Soal (dengan Kata Kerja Operasional terukur), Level Kognitif, Pengalaman Belajar, dan Bentuk Soal.
4. ATURAN OPSI PILIHAN GANDA & PENGECOH SETARA (HOMOGEN):
   - Untuk bentuk "Pilihan ganda" (serta "Menentukan respon yang paling tepat / paling tidak tepat" dan "Tes Penilaian Situasional"), wajib ikuti jumlah opsi per jenjang (5 pilihan A–E untuk SMA/MA/SMK/Fase E–F; menyesuaikan aturan jenjang untuk SD/SMP).
   - SETIAP pilihan jawaban (A, B, C, D, E maupun pernyataan Pilihan Ganda Kompleks) WAJIB mempunyai panjang kalimat/jumlah kata yang SAMA/SEIMBANG, struktur gramatikal sejajar, serta isi yang MIRIP-MIRIP secara konseptual sehingga benar-benar MENGECOH (plausible distractors) dan tidak bisa ditebak hanya dari panjang-pendek kalimat atau opsi yang janggal.
5. PILIHAN GANDA KOMPLEKS:
   - Setiap pernyataan pada "opsi_jawaban" untuk Pilihan Ganda Kompleks wajib berupa 1 kalimat utuh sesuai aturan jumlah kata jenjang (20–25 kata atau lebih per kalimat untuk SMA/MA/SMK/Fase E–F, dan menyesuaikan jenjang untuk SD/SMP), dengan panjang antar pernyataan yang seragam dan saling mengecoh.

FORMAT OUTPUT WAJIB:
Kembalikan HANYA array JSON valid (tanpa teks pengantar atau penutup di luar JSON) berisi objek-objek dengan properti persis berikut:
[
  {
    "nomor": 1,
    "capaian_pembelajaran": "...",
    "materi": "...",
    "indikator_soal": "...",
    "bentuk_soal": "...",
    "level_kognitif": "LOTS | MOTS | HOTS",
    "pengalaman_belajar": "Memahami | Mengaplikasi | Merefleksi",
    "stimulus": "...",
    "pertanyaan": "...",
    "opsi_jawaban": ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."],
    "kunci_jawaban": "...",
    "pembahasan": "...",
    "deskripsi_gambar": "...",
    "svg_ilustrasi": ""
  }
]

CATATAN FORMAT BENTUK SOAL:
- Pilihan ganda / Menentukan respon paling tepat / Tes Penilaian Situasional: isi opsi_jawaban dengan 5 pilihan ("A. ...", "B. ...", "C. ...", "D. ...", "E. ...") untuk SMA/SMK/Fase E–F (atau 4 pilihan A–D untuk SD/SMP), dengan panjang dan gaya kalimat yang seragam serta mengecoh.
- Pilihan ganda kompleks: isi opsi_jawaban dengan 4–5 pernyataan berupa 1 kalimat panjang (20–25+ kata untuk SMA/SMK, menyesuaikan untuk SD/SMP) yang seragam panjangnya dan mirip secara konseptual; sebutkan semua pernyataan benar pada kunci_jawaban.
- Benar–salah: isi opsi_jawaban dengan daftar pernyataan beserta format "[Benar / Salah]" dan tuliskan pasangan kunci di kunci_jawaban.
- Menjodohkan: isi opsi_jawaban dengan daftar pasangan Premis -> Pilihan Respon, dan kunci pasangannya di kunci_jawaban.
- Isian singkat / Uraian / Studi kasus / Praktik kinerja: tetap wajib memiliki "stimulus" lengkap; opsi_jawaban berupa array kosong [] (atau rubrik singkat jika praktik), dan kunci_jawaban berisi jawaban acuan / pedoman penskoran lengkap.`;
}

function buildBatchUserPrompt(
  mode: 'tka' | 'mapel',
  formState: TkaFormState | MapelFormState,
  batch: BatchSlotPlan,
  totalRequested: number,
  previousTopics: string[]
): string {
  const rules = resolveJenjangRules(mode, formState);

  const shapeDist = Object.entries(batch.shapeCounts)
    .map(([shape, count]) => `- ${shape}: ${count} soal`)
    .join('\n');

  const diffDist = Object.entries(batch.difficultyCounts)
    .map(([diff, count]) => `- ${diff}: ${count} soal`)
    .join('\n');

  const expDist = Object.entries(batch.experienceCounts)
    .map(([exp, count]) => `- ${exp}: ${count} soal`)
    .join('\n');

  const contextSection =
    mode === 'tka'
      ? (() => {
          const s = formState as TkaFormState;
          return `MODE: TKA & ASESMEN NASIONAL (AN)
Satuan Pendidikan: ${s.namaSatuanPendidikan || '-'}
Fase: ${s.fase || '-'}
Kelas: ${s.kelas || '-'}
Jenis Soal Asesmen Nasional (distribusikan merata): ${s.jenisSoal.join(', ') || '-'}
Subdomain Spesifik (distribusikan merata): ${s.subdomain.join(' | ') || '-'}`;
        })()
      : (() => {
          const s = formState as MapelFormState;
          const combinedTopics = [s.topikMateri1, s.topikMateri2]
            .map((t) => t.trim())
            .filter(Boolean)
            .join(' | ');
          return `MODE: MATA PELAJARAN KURIKULUM MERDEKA / UMUM
Satuan Pendidikan: ${s.namaSatuanPendidikan || '-'}
Jenjang Pendidikan: ${s.jenjang}
Mata Pelajaran: ${s.mataPelajaran}
Kelas: ${s.kelas || '-'}
Topik / Materi Pokok Spesifik: ${combinedTopics || '-'}`;
        })();

  const avoidTopicsText =
    previousTopics.length > 0
      ? `\nANTI-DUPLIKASI TOPIK & STIMULUS:\nHindari penggunaan teks stimulus, kasus, atau pertanyaan yang sama dengan daftar topik berikut:\n${previousTopics
          .slice(-40)
          .map((t, i) => `${i + 1}. ${t}`)
          .join('\n')}\n`
      : '';

  const batchCount = batch.endNumber - batch.startNumber + 1;

  return `${contextSection}

ATURAN KETAT SESUAI JENJANG (${rules.levelLabel}):
1. STIMULUS WAJIB: Setiap soal WAJIB memiliki stimulus yang lengkap. ${rules.stimulusSentenceRule}
2. PILIHAN GANDA: Untuk soal Pilihan Ganda / Penentuan Respon / Penilaian Situasional, WAJIB sediakan tepat ${rules.mcCount} opsi jawaban (${rules.mcLetters}).
3. PILIHAN GANDA KOMPLEKS: ${rules.complexStatementRule}
4. KESEIMBANGAN & DAYA PENGECOH: Semua opsi jawaban pada setiap soal WAJIB memiliki panjang kata yang hampir sama persis, struktur kalimat paralel, dan kemiripan konsep tinggi agar berfungsi sebagai pengecoh yang kuat.

INSTRUKSI BATCH SAAT INI:
Buat tepat ${batchCount} butir soal untuk nomor ${batch.startNumber} sampai ${batch.endNumber} (dari total ${totalRequested} soal keseluruhan).
Pastikan field "nomor" dimulai dari ${batch.startNumber} berurutan sampai ${batch.endNumber}.

DISTRIBUSI WAJIB BATCH INI:
Bentuk Soal:
${shapeDist}

Tingkat Kesulitan (Level Kognitif):
${diffDist}

Pengalaman Belajar:
${expDist}
${avoidTopicsText}
Kembalikan HANYA array JSON valid berisi tepat ${batchCount} objek soal.`;
}

async function callAiGenerateEndpoint(
  aiConfig: AiConfig,
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal
): Promise<string> {
  const apiKey = aiConfig.keys[aiConfig.provider] || '';

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey,
      systemPrompt,
      userPrompt,
    }),
    signal,
  });

  const data = (await res.json()) as { rawText?: string; error?: string };
  if (!res.ok) {
    const err = new Error(
      data.error || `Gagal memanggil AI API (${res.status}).`
    ) as Error & { nonRetryable?: boolean };
    if (
      res.status === 400 ||
      res.status === 401 ||
      res.status === 403 ||
      res.status === 404
    ) {
      err.nonRetryable = true;
    }
    throw err;
  }
  if (!data.rawText) {
    throw new Error('Server mengembalikan respons teks kosong.');
  }
  return data.rawText;
}

export interface RunSequentialGenerationParams {
  mode: 'tka' | 'mapel';
  formState: TkaFormState | MapelFormState;
  aiConfig: AiConfig;
  abortController: AbortController;
  onProgress: (progress: BatchProgressState) => void;
  onBatchComplete: (newQuestions: QuestionItem[]) => void;
}

export async function runSequentialBatchGeneration({
  mode,
  formState,
  aiConfig,
  abortController,
  onProgress,
  onBatchComplete,
}: RunSequentialGenerationParams): Promise<void> {
  const plans = buildBatchPlan(
    formState.bentukSoal,
    formState.tingkatKesulitan,
    formState.pengalamanBelajar
  );

  if (plans.length === 0) {
    throw new Error('Pilih minimal satu bentuk soal dan jumlah soal.');
  }

  const totalRequested = plans[plans.length - 1].endNumber;
  const totalBatches = plans.length;
  const systemPrompt = buildSystemPrompt();
  const previousTopics: string[] = [];
  let generatedCount = 0;

  for (let i = 0; i < plans.length; i++) {
    if (abortController.signal.aborted) {
      onProgress({
        status: 'stopped',
        currentBatch: i + 1,
        totalBatches,
        batchStartNumber: plans[i].startNumber,
        batchEndNumber: plans[i].endNumber,
        generatedCount,
        totalRequested,
        retryingAttempt: 0,
        message: `Proses dihentikan oleh pengguna. ${generatedCount} soal tersimpan.`,
      });
      return;
    }

    const batch = plans[i];

    onProgress({
      status: 'running',
      currentBatch: i + 1,
      totalBatches,
      batchStartNumber: batch.startNumber,
      batchEndNumber: batch.endNumber,
      generatedCount,
      totalRequested,
      retryingAttempt: 0,
      message: `Membuat Batch ${i + 1} dari ${totalBatches} (Soal ${batch.startNumber}–${batch.endNumber} dari ${totalRequested})...`,
    });

    const userPrompt = buildBatchUserPrompt(
      mode,
      formState,
      batch,
      totalRequested,
      previousTopics
    );

    let batchQuestions: QuestionItem[] | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted) break;

      if (attempt > 0) {
        onProgress({
          status: 'running',
          currentBatch: i + 1,
          totalBatches,
          batchStartNumber: batch.startNumber,
          batchEndNumber: batch.endNumber,
          generatedCount,
          totalRequested,
          retryingAttempt: attempt,
          message: `Mengulang Batch ${i + 1} dari ${totalBatches} (Percobaan ulang ${attempt}/${MAX_RETRIES})...`,
        });
        await sleep(RETRY_DELAY_MS, abortController.signal);
      }

      try {
        const rawText = await callAiGenerateEndpoint(
          aiConfig,
          systemPrompt,
          userPrompt,
          abortController.signal
        );
        const parsed = parseQuestionBatchJson(rawText, batch.startNumber);
        if (parsed.length === 0) {
          throw new Error('AI mengembalikan array soal kosong.');
        }

        // Enforce continuous numbering matching batch range
        batchQuestions = parsed.map((q, idx) => ({
          ...q,
          nomor: batch.startNumber + idx,
        }));
        break;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          onProgress({
            status: 'stopped',
            currentBatch: i + 1,
            totalBatches,
            batchStartNumber: plans[i].startNumber,
            batchEndNumber: plans[i].endNumber,
            generatedCount,
            totalRequested,
            retryingAttempt: 0,
            message: `Proses dihentikan oleh pengguna. ${generatedCount} soal yang berhasil dibuat tetap tersimpan.`,
          });
          return;
        }
        lastError = err;
        if ((err as Error & { nonRetryable?: boolean }).nonRetryable) {
          break;
        }
      }
    }

    if (!batchQuestions) {
      if (abortController.signal.aborted) {
        onProgress({
          status: 'stopped',
          currentBatch: i + 1,
          totalBatches,
          batchStartNumber: batch.startNumber,
          batchEndNumber: batch.endNumber,
          generatedCount,
          totalRequested,
          retryingAttempt: 0,
          message: `Proses dihentikan oleh pengguna. ${generatedCount} soal tetap tersimpan.`,
        });
        return;
      }
      const errMsg =
        lastError instanceof Error
          ? lastError.message
          : 'Gagal memproses batch soal setelah percobaan ulang.';
      onProgress({
        status: 'error',
        currentBatch: i + 1,
        totalBatches,
        batchStartNumber: batch.startNumber,
        batchEndNumber: batch.endNumber,
        generatedCount,
        totalRequested,
        retryingAttempt: 0,
        message: `Batch ${i + 1} gagal dibuat.`,
        error: errMsg,
      });
      throw new Error(errMsg);
    }

    // Track topics for subsequent anti-duplication
    for (const q of batchQuestions) {
      const topicSnippet = `${q.materi}: ${q.pertanyaan.slice(0, 75)}`;
      previousTopics.push(topicSnippet);
    }

    generatedCount += batchQuestions.length;
    onBatchComplete(batchQuestions);

    // Safe 1.5s delay between sequential batches to prevent API rate limit errors
    if (i < plans.length - 1) {
      onProgress({
        status: 'running',
        currentBatch: i + 1,
        totalBatches,
        batchStartNumber: batch.startNumber,
        batchEndNumber: batch.endNumber,
        generatedCount,
        totalRequested,
        retryingAttempt: 0,
        message: `Batch ${i + 1} selesai (${generatedCount}/${totalRequested} soal). Jeda aman sebelum batch berikutnya...`,
      });
      await sleep(INTER_BATCH_DELAY_MS, abortController.signal);
    }
  }

  onProgress({
    status: 'completed',
    currentBatch: totalBatches,
    totalBatches,
    batchStartNumber: 1,
    batchEndNumber: generatedCount,
    generatedCount,
    totalRequested,
    retryingAttempt: 0,
    message: `Selesai! ${generatedCount} soal dan tabel kisi-kisi berhasil dibuat.`,
  });
}
