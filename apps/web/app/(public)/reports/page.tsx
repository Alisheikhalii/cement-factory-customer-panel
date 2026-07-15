import type { Metadata } from 'next';
import { FileText, Download } from 'lucide-react';
import { getCollection } from '../../../lib/content';
import { formatJalaliDate } from '../../../lib/format';

/** گزارش‌ها — `/reports` (بخش ۹.۱۰.۳). هر گزارش با دکمهٔ دانلود PDF. SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'گزارش‌ها',
  description: 'گزارش‌های عملکرد و زیست‌محیطی کارخانه سیمان خاکستری نی‌ریز.',
};

export default function ReportsPage(): React.ReactElement {
  const reports = getCollection('reports');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-8">
        <FileText className="w-7 h-7 text-primary-700" />
        گزارش‌ها
      </h1>

      {reports.length === 0 ? (
        <p className="py-16 text-center text-slate-400">فعلاً گزارشی منتشر نشده است.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => (
            <div
              key={item.slug}
              className="flex items-center justify-between gap-4 rounded-lg bg-white shadow-card border border-slate-100 p-5"
            >
              <div>
                <h2 className="font-bold text-slate-800">{item.title}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  {formatJalaliDate(item.date)}
                </div>
                {item.summary && (
                  <p className="text-sm text-slate-500 mt-2 leading-7">{item.summary}</p>
                )}
              </div>
              {item.attachment && (
                <a
                  href={item.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 transition"
                >
                  <Download className="w-4 h-4" />
                  دانلود
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
