import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { getCollection } from '../../../lib/content';
import { formatJalaliDate } from '../../../lib/format';

/** لیست اخبار — `/news` (بخش ۹.۱۰.۳). SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'اخبار کارخانه',
  description: 'آخرین اخبار و رویدادهای کارخانه سیمان خاکستری نی‌ریز.',
};

export default function NewsListPage(): React.ReactElement {
  const news = getCollection('news');

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-8">
        <Newspaper className="w-7 h-7 text-primary-700" />
        اخبار کارخانه
      </h1>

      {news.length === 0 ? (
        <p className="py-16 text-center text-slate-400">فعلاً خبری منتشر نشده است.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {news.map((item) => (
            <Link
              key={item.slug}
              href={`/news/${item.slug}`}
              className="group rounded-lg bg-white shadow-card border border-slate-100 overflow-hidden hover:shadow-glass transition"
            >
              {item.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover} alt={item.title} className="h-44 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="text-xs text-slate-400 mb-2">
                  {formatJalaliDate(item.date)}
                </div>
                <h2 className="font-bold text-slate-800 group-hover:text-primary-700 transition line-clamp-2">
                  {item.title}
                </h2>
                {item.summary && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-7">
                    {item.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
