import {
  AssessmentMetadata,
  KopSuratConfig,
  QuestionItem,
} from '../types/assessment';
import {
  OfficialKopAndIdentity,
  OfficialSignatureBlock,
} from './OfficialDocumentParts';

interface KisiKisiTabProps {
  questions: QuestionItem[];
  kop: KopSuratConfig;
  meta: AssessmentMetadata;
}

export function KisiKisiTab({ questions, kop, meta }: KisiKisiTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6">
      <OfficialKopAndIdentity
        kop={kop}
        meta={meta}
        totalQuestions={questions.length}
      />

      <div>
        <h2 className="text-base font-bold uppercase text-slate-900 dark:text-slate-100 mb-3">
          Tabel Kisi-Kisi Penulisan Soal Asesmen
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="theme-gradient-bg text-white">
                <th className="border-b border-r border-white/20 px-3 py-3 text-center font-bold w-12">
                  No
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 font-bold min-w-[180px]">
                  Capaian Pembelajaran
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 font-bold min-w-[140px]">
                  Materi / Subdomain
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 font-bold min-w-[220px]">
                  Indikator Soal
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 text-center font-bold w-24">
                  Level Kognitif
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 text-center font-bold w-32">
                  Pengalaman Belajar
                </th>
                <th className="border-b border-r border-white/20 px-3 py-3 font-bold min-w-[140px]">
                  Bentuk Soal
                </th>
                <th className="border-b border-white/20 px-3 py-3 text-center font-bold w-24">
                  Nomor Soal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {questions.map((q, index) => {
                const levelColor = q.level_kognitif.toUpperCase().includes('HOTS')
                  ? 'text-rose-600 dark:text-rose-400'
                  : q.level_kognitif.toUpperCase().includes('MOTS')
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400';

                return (
                  <tr
                    key={q.nomor}
                    className="avoid-page-break even:bg-slate-50/70 dark:even:bg-slate-800/25 hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 text-center tabular-nums">
                      {index + 1}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 align-top leading-relaxed">
                      {q.capaian_pembelajaran}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 align-top leading-relaxed">
                      {q.materi}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 align-top leading-relaxed">
                      {q.indikator_soal}
                    </td>
                    <td
                      className={`border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 text-center font-bold align-top ${levelColor}`}
                    >
                      {q.level_kognitif}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 text-center align-top font-medium text-teal-700 dark:text-teal-300">
                      {q.pengalaman_belajar}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2.5 align-top font-medium text-indigo-700 dark:text-indigo-300">
                      {q.bentuk_soal}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold theme-accent-text tabular-nums align-top">
                      {q.nomor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <OfficialSignatureBlock kop={kop} />
    </div>
  );
}
