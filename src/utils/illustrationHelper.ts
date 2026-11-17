import { QuestionItem } from '../types/assessment';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (words.length > 0 && lines.length === maxLines) {
    const lastIdx = lines.length - 1;
    if (lines[lastIdx].length > maxCharsPerLine - 3) {
      lines[lastIdx] = lines[lastIdx].slice(0, maxCharsPerLine - 3) + '...';
    }
  }
  return lines;
}

function sanitizeAiSvg(svgRaw: string): string | null {
  const trimmed = svgRaw.trim();
  if (!trimmed.startsWith('<svg') || !trimmed.includes('</svg>')) {
    return null;
  }
  // Remove any script tags or inline event handlers for safety
  const safe = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');

  try {
    const encoded = encodeURIComponent(safe)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  } catch {
    return null;
  }
}

function buildDiagramDataUrl(question: QuestionItem): string {
  const desc = question.deskripsi_gambar.trim();
  const lower = `${question.materi} ${desc}`.toLowerCase();

  let motifSvg = '';
  if (
    lower.includes('grafik') ||
    lower.includes('diagram') ||
    lower.includes('data') ||
    lower.includes('statistik') ||
    lower.includes('tabel')
  ) {
    motifSvg = `
      <rect x="48" y="34" width="224" height="128" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="72" y1="142" x2="252" y2="142" stroke="#64748b" stroke-width="1.5"/>
      <line x1="72" y1="48" x2="72" y2="142" stroke="#64748b" stroke-width="1.5"/>
      <rect x="90" y="96" width="24" height="46" rx="3" fill="#0284c7"/>
      <rect x="130" y="70" width="24" height="72" rx="3" fill="#0ea5e9"/>
      <rect x="170" y="84" width="24" height="58" rx="3" fill="#0369a1"/>
      <rect x="210" y="56" width="24" height="86" rx="3" fill="#1e3a8a"/>
    `;
  } else if (
    lower.includes('geometri') ||
    lower.includes('segitiga') ||
    lower.includes('lingkaran') ||
    lower.includes('kubus') ||
    lower.includes('sudut') ||
    lower.includes('luas')
  ) {
    motifSvg = `
      <rect x="48" y="34" width="224" height="128" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <polygon points="80,140 164,140 122,58" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <circle cx="216" cy="98" r="34" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <line x1="216" y1="98" x2="250" y2="98" stroke="#b45309" stroke-width="1.5" stroke-dasharray="3,3"/>
    `;
  } else if (
    lower.includes('biologi') ||
    lower.includes('kimia') ||
    lower.includes('fisika') ||
    lower.includes('sel') ||
    lower.includes('laboratorium') ||
    lower.includes('ekosistem') ||
    lower.includes('sains')
  ) {
    motifSvg = `
      <rect x="48" y="34" width="224" height="128" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <circle cx="132" cy="98" r="38" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
      <circle cx="132" cy="98" r="14" fill="#a7f3d0" stroke="#047857" stroke-width="1.5"/>
      <path d="M196 60 L216 60 L216 86 L234 134 C236 139 232 142 226 142 L186 142 C180 142 176 139 178 134 L196 86 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <line x1="186" y1="118" x2="226" y2="118" stroke="#0284c7" stroke-width="1.5"/>
    `;
  } else {
    motifSvg = `
      <rect x="48" y="34" width="224" height="128" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <rect x="68" y="54" width="184" height="12" rx="3" fill="#e2e8f0"/>
      <rect x="68" y="76" width="142" height="8" rx="3" fill="#cbd5e1"/>
      <rect x="68" y="92" width="166" height="8" rx="3" fill="#cbd5e1"/>
      <rect x="68" y="114" width="76" height="32" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="156" y="114" width="96" height="32" rx="5" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    `;
  }

  const lines = wrapTextLines(desc, 48, 4);
  const textTspans = lines
    .map(
      (line, idx) =>
        `<tspan x="296" dy="${idx === 0 ? 0 : 19}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="196" viewBox="0 0 680 196">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#eff6ff"/>
      </linearGradient>
    </defs>
    <rect width="680" height="196" rx="10" fill="url(#bg)" stroke="#cbd5e1" stroke-width="1.5"/>
    ${motifSvg}
    <text x="296" y="56" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" font-weight="700" fill="#0369a1" letter-spacing="0.06em">ILUSTRASI STIMULUS · SOAL NO. ${question.nomor}</text>
    <text x="296" y="84" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#1e293b">
      ${textTspans}
    </text>
    <text x="296" y="162" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" fill="#64748b">Gunakan tombol Upload Gambar Sendiri atau Buat Ilustrasi AI untuk mengganti visual ini.</text>
  </svg>`;

  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function getQuestionDisplayImage(question: QuestionItem): string | null {
  if (question.image_deleted) {
    return null;
  }
  if (question.custom_image) {
    return question.custom_image;
  }
  if (question.svg_ilustrasi) {
    const sanitized = sanitizeAiSvg(question.svg_ilustrasi);
    if (sanitized) return sanitized;
  }
  if (question.deskripsi_gambar && question.deskripsi_gambar.trim().length > 2) {
    return buildDiagramDataUrl(question);
  }
  return null;
}
