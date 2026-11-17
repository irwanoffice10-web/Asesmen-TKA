import html2pdf from 'html2pdf.js';
import {
  DEFAULT_KOP_LINE_STYLES,
  DEFAULT_LOGO_SIZE,
} from '../data/curriculumData';
import {
  AssessmentMetadata,
  KopLineStyle,
  KopSuratConfig,
  QuestionItem,
} from '../types/assessment';
import { getQuestionDisplayImage } from './illustrationHelper';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br />');
}

function lineStyleCss(s: KopLineStyle, extraColor?: string): string {
  return [
    `font-size:${s.fontSize}pt`,
    `font-weight:${s.bold ? 700 : 400}`,
    `font-style:${s.italic ? 'italic' : 'normal'}`,
    `text-decoration:${s.underline ? 'underline' : 'none'}`,
    `text-align:${s.align}`,
    extraColor ? `color:${extraColor}` : '',
  ]
    .filter(Boolean)
    .join(';');
}

function buildKopSuratHtml(kop: KopSuratConfig): string {
  const styles = kop.kopLineStyles || DEFAULT_KOP_LINE_STYLES;
  const logoKiriSize = kop.logoKiriSize ?? DEFAULT_LOGO_SIZE;
  const logoKananSize = kop.logoKananSize ?? DEFAULT_LOGO_SIZE;

  const logoLeftHtml = kop.logoKiri
    ? `<img src="${escapeHtml(kop.logoKiri)}" crossorigin="anonymous" referrerpolicy="no-referrer" alt="Logo Instansi" style="width:${logoKiriSize}px;height:${logoKiriSize}px;object-fit:contain;" />`
    : `<div style="width:${logoKiriSize}px;height:${logoKiriSize}px;"></div>`;
  const logoRightHtml = kop.logoKanan
    ? `<img src="${escapeHtml(kop.logoKanan)}" crossorigin="anonymous" referrerpolicy="no-referrer" alt="Logo Sekolah" style="width:${logoKananSize}px;height:${logoKananSize}px;object-fit:contain;" />`
    : `<div style="width:${logoKananSize}px;height:${logoKananSize}px;"></div>`;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:3px solid #0f172a;position:relative;">
      <div style="flex-shrink:0;">${logoLeftHtml}</div>
      <div style="flex:1;color:#0f172a;line-height:1.25;">
        ${kop.kopBaris1 ? `<div style="${lineStyleCss(styles.baris1)};letter-spacing:0.04em;">${escapeHtml(kop.kopBaris1)}</div>` : ''}
        ${kop.kopBaris2 ? `<div style="${lineStyleCss(styles.baris2)};letter-spacing:0.04em;margin-top:1px;">${escapeHtml(kop.kopBaris2)}</div>` : ''}
        ${kop.kopBaris3 ? `<div style="${lineStyleCss(styles.baris3)};letter-spacing:0.03em;margin-top:1px;">${escapeHtml(kop.kopBaris3)}</div>` : ''}
        <div style="${lineStyleCss(styles.baris4)};margin-top:2px;">${escapeHtml(kop.namaSatuanPendidikan || '')}</div>
        ${kop.kopBaris5 ? `<div style="${lineStyleCss(styles.baris5, '#334155')};margin-top:2px;">${escapeHtml(kop.kopBaris5)}</div>` : ''}
        ${kop.kopBaris6 ? `<div style="${lineStyleCss(styles.baris6, '#334155')};margin-top:1px;">${escapeHtml(kop.kopBaris6)}</div>` : ''}
      </div>
      <div style="flex-shrink:0;">${logoRightHtml}</div>
    </div>
    <div style="border-bottom:1px solid #0f172a;margin-top:2px;margin-bottom:14px;"></div>
  `;
}

function buildIdentitasHtml(
  kop: KopSuratConfig,
  meta: AssessmentMetadata,
  totalQuestions: number
): string {
  return `
    <div style="margin-bottom:16px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;background-color:#f8fafc;color:#0f172a;font-size:9.5pt;">
      <div style="text-align:center;font-weight:700;font-size:11pt;margin-bottom:8px;">
        ${escapeHtml(kop.namaKegiatan || meta.judulAsesmen)}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9pt;">
        <tr>
          <td style="width:20%;padding:2px 4px;font-weight:600;">Mata Uji / Bidang</td>
          <td style="width:30%;padding:2px 4px;">: ${escapeHtml(meta.subJudul)}</td>
          <td style="width:20%;padding:2px 4px;font-weight:600;">Tahun Pelajaran</td>
          <td style="width:30%;padding:2px 4px;">: ${escapeHtml(kop.tahunPelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding:2px 4px;font-weight:600;">Kelas / Fase</td>
          <td style="padding:2px 4px;">: ${escapeHtml(meta.kelas || '-')} (${escapeHtml(meta.faseAtauJenjang || '-')})</td>
          <td style="padding:2px 4px;font-weight:600;">Alokasi Waktu</td>
          <td style="padding:2px 4px;">: ${escapeHtml(kop.alokasiWaktu || '-')}</td>
        </tr>
        <tr>
          <td style="padding:2px 4px;font-weight:600;">Jumlah Soal</td>
          <td style="padding:2px 4px;">: ${totalQuestions} Butir Soal</td>
          <td style="padding:2px 4px;font-weight:600;">Satuan Pendidikan</td>
          <td style="padding:2px 4px;">: ${escapeHtml(kop.namaSatuanPendidikan || meta.satuanPendidikan || '-')}</td>
        </tr>
      </table>
    </div>
  `;
}

function buildSignatureHtml(kop: KopSuratConfig): string {
  return `
    <div class="avoid-page-break" style="page-break-inside:avoid;break-inside:avoid;margin-top:26px;padding-top:12px;color:#0f172a;font-size:9.5pt;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:20px;">
            <div>Mengetahui,</div>
            <div style="font-weight:600;">${escapeHtml(kop.jabatanKepalaSekolah || 'Kepala Sekolah')}</div>
            <div style="height:56px;"></div>
            <div style="font-weight:700;text-decoration:underline;">${escapeHtml(kop.namaKepalaSekolah || '........................')}</div>
            <div style="font-size:8.5pt;color:#334155;">NIP. ${escapeHtml(kop.nipKepalaSekolah || '-')}</div>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:20px;">
            <div>${escapeHtml(kop.tempatTanggal || '')}</div>
            <div style="font-weight:600;">${escapeHtml(kop.jabatanPenyusun || 'Guru Penyusun Soal')}</div>
            <div style="height:56px;"></div>
            <div style="font-weight:700;text-decoration:underline;">${escapeHtml(kop.namaPenyusun || '........................')}</div>
            <div style="font-size:8.5pt;color:#334155;">NIP. ${escapeHtml(kop.nipPenyusun || '-')}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildKisiKisiHtml(questions: QuestionItem[]): string {
  const rows = questions
    .map(
      (q, index) => `
      <tr style="page-break-inside:avoid;break-inside:avoid;">
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;vertical-align:top;">${index + 1}</td>
        <td style="border:1px solid #94a3b8;padding:6px;vertical-align:top;">${escapeHtml(q.capaian_pembelajaran)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;vertical-align:top;">${escapeHtml(q.materi)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;vertical-align:top;">${escapeHtml(q.indikator_soal)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;vertical-align:top;font-weight:600;">${escapeHtml(q.level_kognitif)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;vertical-align:top;">${escapeHtml(q.pengalaman_belajar)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;vertical-align:top;">${escapeHtml(q.bentuk_soal)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;vertical-align:top;font-weight:700;">${q.nomor}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:11.5pt;font-weight:700;color:#0f172a;margin:0 0 8px 0;text-transform:uppercase;">
        I. KISI-KISI PENULISAN SOAL ASESMEN
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:8.5pt;color:#0f172a;">
        <thead>
          <tr style="background-color:#e2e8f0;">
            <th style="border:1px solid #94a3b8;padding:6px;text-align:center;width:28px;">No</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:left;">Capaian Pembelajaran</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:left;">Materi / Subdomain</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:left;">Indikator Soal</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:center;width:54px;">Level</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:center;width:82px;">Pengalaman</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:left;width:88px;">Bentuk Soal</th>
            <th style="border:1px solid #94a3b8;padding:6px;text-align:center;width:42px;">No. Soal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildQuestionsHtml(questions: QuestionItem[]): string {
  const cards = questions
    .map((q) => {
      const displayImg = getQuestionDisplayImage(q);
      const imageBlock = displayImg
        ? `<div style="margin:8px 0;">
            <img src="${displayImg}" alt="Ilustrasi Soal ${q.nomor}" style="max-width:100%;max-height:220px;object-fit:contain;border:1px solid #cbd5e1;border-radius:6px;" />
           </div>`
        : '';

      const stimulusBlock = q.stimulus
        ? `<div style="margin:6px 0 8px 0;padding:8px 10px;background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;font-family:Georgia,serif;font-size:9.5pt;line-height:1.55;color:#1e293b;">
            ${escapeHtml(q.stimulus)}
           </div>`
        : '';

      const optionsBlock =
        q.opsi_jawaban.length > 0
          ? `<div style="margin-top:6px;padding-left:4px;">
              ${q.opsi_jawaban
                .map(
                  (opt) =>
                    `<div style="margin-bottom:4px;font-size:9.5pt;line-height:1.45;color:#0f172a;">${escapeHtml(opt)}</div>`
                )
                .join('')}
            </div>`
          : `<div style="margin-top:8px;border:1px dashed #cbd5e1;height:42px;border-radius:4px;"></div>`;

      return `
        <div class="avoid-page-break" style="page-break-inside:avoid;break-inside:avoid;margin-bottom:14px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;background-color:#ffffff;">
          <div style="font-size:8pt;color:#475569;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
            <strong>Soal No. ${q.nomor}</strong> &middot; ${escapeHtml(q.bentuk_soal)} &middot; ${escapeHtml(q.level_kognitif)} &middot; ${escapeHtml(q.pengalaman_belajar)}
          </div>
          ${stimulusBlock}
          ${imageBlock}
          <div style="font-size:10pt;font-weight:500;line-height:1.5;color:#0f172a;margin-bottom:4px;">
            ${escapeHtml(q.pertanyaan)}
          </div>
          ${optionsBlock}
        </div>
      `;
    })
    .join('');

  return `
    <div>
      <h2 style="font-size:11.5pt;font-weight:700;color:#0f172a;margin:0 0 10px 0;text-transform:uppercase;">
        NASKAH SOAL ASESMEN
      </h2>
      ${cards}
    </div>
  `;
}

function buildAnswerKeyHtml(questions: QuestionItem[]): string {
  const items = questions
    .map(
      (q) => `
      <div class="avoid-page-break" style="page-break-inside:avoid;break-inside:avoid;margin-bottom:10px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:5px;background-color:#ffffff;font-size:9pt;color:#0f172a;">
        <div style="font-weight:700;margin-bottom:3px;">Nomor ${q.nomor} (${escapeHtml(q.bentuk_soal)} &middot; ${escapeHtml(q.level_kognitif)})</div>
        <div style="margin-bottom:4px;"><strong>Kunci Jawaban:</strong> <span style="color:#0369a1;font-weight:600;">${escapeHtml(q.kunci_jawaban)}</span></div>
        <div style="color:#334155;line-height:1.45;"><strong>Pembahasan:</strong> ${escapeHtml(q.pembahasan)}</div>
      </div>`
    )
    .join('');

  return `
    <div style="page-break-before:always;break-before:page;">
      <h2 style="font-size:11.5pt;font-weight:700;color:#0f172a;margin:0 0 10px 0;text-transform:uppercase;">
        LAMPIRAN: KUNCI JAWABAN &amp; PEMBAHASAN LENGKAP
      </h2>
      ${items}
    </div>
  `;
}

export type PdfExportMode = 'complete' | 'questions_only';

export async function exportAssessmentPdf(
  questions: QuestionItem[],
  kop: KopSuratConfig,
  meta: AssessmentMetadata,
  exportMode: PdfExportMode
): Promise<void> {
  if (questions.length === 0) {
    throw new Error('Belum ada soal yang dapat diekspor ke PDF.');
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '760px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Plus Jakarta Sans, Arial, Helvetica, sans-serif';
  container.style.padding = '12px';

  const kopHtml = buildKopSuratHtml(kop);
  const identitasHtml = buildIdentitasHtml(kop, meta, questions.length);
  const signatureHtml = buildSignatureHtml(kop);

  let bodyHtml = '';
  if (exportMode === 'complete') {
    bodyHtml = `
      ${kopHtml}
      ${identitasHtml}
      ${buildKisiKisiHtml(questions)}
      <div style="page-break-before:always;break-before:page;">
        ${kopHtml}
        ${identitasHtml}
        ${buildQuestionsHtml(questions)}
      </div>
      ${buildAnswerKeyHtml(questions)}
      ${signatureHtml}
    `;
  } else {
    bodyHtml = `
      ${kopHtml}
      ${identitasHtml}
      ${buildQuestionsHtml(questions)}
      ${signatureHtml}
    `;
  }

  container.innerHTML = bodyHtml;
  document.body.appendChild(container);

  const safeSlug = (meta.subJudul || 'Asesmen')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fileSuffix =
    exportMode === 'complete' ? 'paket-lengkap' : 'naskah-soal';
  const filename = `${safeSlug}-${fileSuffix}.pdf`;

  try {
    const pdfOptions: Record<string, unknown> = {
      margin: [12, 12, 14, 12],
      filename,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.avoid-page-break', 'tr'],
      },
    };

    const createWorker = html2pdf as unknown as () => {
      set: (opts: Record<string, unknown>) => {
        from: (el: HTMLElement) => {
          save: () => Promise<void>;
        };
      };
    };

    await createWorker().set(pdfOptions).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
