import { QuestionItem } from '../types/assessment';

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  // Remove ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }
  return cleaned;
}

function extractJsonArraySlice(text: string): string {
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1);
  }
  return text;
}

function fixCommonJsonIssues(text: string): string {
  // Remove trailing commas before ] or }
  return text.replace(/,\s*([\]}])/g, '$1');
}

export function parseQuestionBatchJson(
  rawText: string,
  expectedStartNumber: number
): QuestionItem[] {
  const stripped = stripMarkdownFences(rawText);

  let parsed: unknown;
  const candidates = [
    stripped,
    extractJsonArraySlice(stripped),
    fixCommonJsonIssues(extractJsonArraySlice(stripped)),
  ];

  for (const candidate of candidates) {
    try {
      parsed = JSON.parse(candidate);
      if (parsed) break;
    } catch {
      // try next candidate
    }
  }

  if (!parsed) {
    throw new Error(
      'Gagal mem-parsing output JSON dari model AI. Format respons tidak valid.'
    );
  }

  let items: unknown[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'questions' in parsed &&
    Array.isArray((parsed as { questions: unknown[] }).questions)
  ) {
    items = (parsed as { questions: unknown[] }).questions;
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'soal' in parsed &&
    Array.isArray((parsed as { soal: unknown[] }).soal)
  ) {
    items = (parsed as { soal: unknown[] }).soal;
  } else {
    throw new Error('Struktur JSON yang dikembalikan AI bukan array soal.');
  }

  return items.map((rawItem, idx): QuestionItem => {
    const obj = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<
      string,
      unknown
    >;

    const rawOptions = obj.opsi_jawaban;
    let opsiJawaban: string[] = [];
    if (Array.isArray(rawOptions)) {
      opsiJawaban = rawOptions.map((o) => String(o ?? '').trim()).filter(Boolean);
    } else if (typeof rawOptions === 'string' && rawOptions.trim()) {
      opsiJawaban = rawOptions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const numericNomor = Number(obj.nomor);
    const nomor =
      Number.isFinite(numericNomor) && numericNomor > 0
        ? numericNomor
        : expectedStartNumber + idx;

    return {
      nomor,
      capaian_pembelajaran: String(obj.capaian_pembelajaran ?? '').trim() || '-',
      materi: String(obj.materi ?? '').trim() || '-',
      indikator_soal: String(obj.indikator_soal ?? '').trim() || '-',
      bentuk_soal: String(obj.bentuk_soal ?? '').trim() || 'Pilihan ganda',
      level_kognitif: String(obj.level_kognitif ?? '').trim() || 'MOTS',
      pengalaman_belajar:
        String(obj.pengalaman_belajar ?? '').trim() || 'Mengaplikasi',
      stimulus: String(obj.stimulus ?? '').trim(),
      pertanyaan: String(obj.pertanyaan ?? '').trim() || 'Pertanyaan belum tersedia.',
      opsi_jawaban: opsiJawaban,
      kunci_jawaban: String(obj.kunci_jawaban ?? '').trim() || '-',
      pembahasan: String(obj.pembahasan ?? '').trim() || '-',
      deskripsi_gambar: String(obj.deskripsi_gambar ?? '').trim(),
      svg_ilustrasi:
        typeof obj.svg_ilustrasi === 'string' ? obj.svg_ilustrasi.trim() : '',
    };
  });
}
