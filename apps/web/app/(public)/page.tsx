import Link from 'next/link';
import { ArrowLeft, Newspaper, Bell } from 'lucide-react';
import { getCollection } from '../../lib/content';
import { formatJalaliDate } from '../../lib/format';
import { companyInfo } from '../../lib/company-info';

/**
 * صفحهٔ خانهٔ لندینگ پیج — `/` (بخش ۹.۱۰.۳).
 * Hero + معرفی کوتاه + ۳ خبر اخیر + آمار کوتاه. SSG با ISR (بخش ۹.۱۰.۱).
 */
export const revalidate = 3600;

/** آمار کوتاه کارخانه (Placeholder تا دریافت داده واقعی، بخش ۲۰.۲). */
const STATS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'سال تأسیس', value: '—' },
  { label: 'ظرفیت تولید سالانه', value: '—' },
  { label: 'تعداد مشتریان', value: '+۱۰۰' },
  { label: 'انواع محصول', value: '۳' },
];

export default function PublicHomePage(): React.ReactElement {
  const latestNews = getCollection('news').slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary-700 to-indigo-600 text-white">
        <div className="mx-auto max-w-content px-4 py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
            {companyInfo.name}
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-8 leading-8">
            تولیدکنندهٔ سیمان با کیفیت برای پروژه‌های عمرانی و ساختمانی — با تعهد به کیفیت،
            پایداری و خدمات الکترونیک نوین به مشتریان.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-primary-700 font-medium hover:bg-primary-50 transition"
          >
            ورود به پورتال مشتریان
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* آمار کوتاه */}
      <section className="mx-auto max-w-content px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-white shadow-card border border-slate-100 p-5 text-center"
            >
              <div className="text-2xl font-bold text-primary-700">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* معرفی کوتاه */}
      <section className="mx-auto max-w-content px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">دربارهٔ کارخانه</h2>
          <p className="text-slate-600 leading-8">
            کارخانه سیمان خاکستری نی‌ریز با بهره‌گیری از فناوری‌های روز و نیروی انسانی متخصص،
            در تلاش است تا محصولاتی با بالاترین کیفیت تولید کرده و خدماتی شایسته به مشتریان خود
            ارائه دهد.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 mt-4 text-primary-700 hover:underline"
          >
            بیشتر بخوانید
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* آخرین اخبار */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-content px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <Newspaper className="w-6 h-6 text-primary-700" />
              آخرین اخبار
            </h2>
            <Link href="/news" className="text-sm text-primary-700 hover:underline">
              همهٔ اخبار
            </Link>
          </div>

          {latestNews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
              <Bell className="w-10 h-10" />
              <p className="text-sm">فعلاً خبری منتشر نشده است.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {latestNews.map((item) => (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="group rounded-lg bg-white shadow-card border border-slate-100 overflow-hidden hover:shadow-glass transition"
                >
                  {item.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <div className="text-xs text-slate-400 mb-2">
                      {formatJalaliDate(item.date)}
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primary-700 transition line-clamp-2">
                      {item.title}
                    </h3>
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
      </section>
    </>
  );
}
