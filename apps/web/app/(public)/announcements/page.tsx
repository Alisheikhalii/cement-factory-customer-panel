import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { getCollection } from '../../../lib/content';
import { formatJalaliDate } from '../../../lib/format';
import { Markdown } from '../../../components/public/Markdown';

/** اطلاعیه‌ها — `/announcements` (بخش ۹.۱۰.۳). SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'اطلاعیه‌ها',
  description: 'اطلاعیه‌های رسمی کارخانه سیمان خاکستری نی‌ریز.',
};

export default function AnnouncementsPage(): React.ReactElement {
  const items = getCollection('announcements');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-8">
        <Bell className="w-7 h-7 text-primary-700" />
        اطلاعیه‌ها
      </h1>

      {items.length === 0 ? (
        <p className="py-16 text-center text-slate-400">فعلاً اطلاعیه‌ای منتشر نشده است.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.slug}
              className="rounded-lg bg-white shadow-card border border-slate-100 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="font-bold text-slate-800">{item.title}</h2>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatJalaliDate(item.date)}
                </span>
              </div>
              <div className="text-sm">
                <Markdown content={item.body} />
              </div>
              {item.attachment && (
                <a
                  href={item.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary-700 hover:underline"
                >
                  دریافت فایل ضمیمه
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
