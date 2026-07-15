import Link from 'next/link';
import {
  ArrowLeft,
  Factory,
  Users,
  BadgeCheck,
  Leaf,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  ClipboardCheck,
  Award,
  Medal,
  Shield,
  ChevronUp,
  Bell,
} from 'lucide-react';
import { getCollection } from '../../lib/content';
import { formatJalaliDate } from '../../lib/format';

/**
 * صفحهٔ خانهٔ لندینگ پیج — `/` (بخش ۹.۱۰.۳).
 * بازسازی مطابق طرح مرجع docs/animated_landing_page_ngcc_cement/code.html:
 * Hero تمام‌عرض با تصویر header.png + کارت‌های آمار شیشه‌ای روی Hero +
 * گرید Masonry اخبار + سکشن پرتال مشتریان (bg-primary) + نوار گواهینامه‌ها.
 * SSG با ISR (بخش ۹.۱۰.۱).
 */
export const revalidate = 3600;

/** آمار کارخانه مطابق کارت‌های KPI طرح مرجع. */
const STATS: ReadonlyArray<{
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
  badge?: string;
}> = [
  {
    label: 'ظرفیت تولید سالانه',
    value: '۱,۲۰۰,۰۰۰ تن',
    icon: Factory,
    iconClass: 'bg-primary/10 text-primary',
    badge: '+۱۲٪ رشد',
  },
  {
    label: 'اشتغال‌زایی مستقیم',
    value: '۴۵۰ نفر',
    icon: Users,
    iconClass: 'bg-secondary/10 text-secondary',
  },
  {
    label: 'استانداردهای ملی و بین‌المللی',
    value: '۸ گواهینامه',
    icon: BadgeCheck,
    iconClass: 'bg-warning/10 text-warning',
  },
  {
    label: 'کاهش آلایندگی',
    value: '۹۵٪ راندمان فیلتر',
    icon: Leaf,
    iconClass: 'bg-primary/10 text-primary',
  },
];

/** ویژگی‌های پرتال مشتریان (چیپ‌های سکشن CTA مرجع). */
const PORTAL_FEATURES: ReadonlyArray<string> = [
  'ثبت سفارش آنلاین',
  'گزارشات مالی آنی',
  'پشتیبانی متمرکز',
];

/** آیکون‌های نوار گواهینامه‌ها (معادل lucide آیکون‌های مرجع). */
const CERT_ICONS: ReadonlyArray<React.ElementType> = [
  ShieldCheck,
  ClipboardCheck,
  Award,
  Medal,
  Shield,
];

export default function PublicHomePage(): React.ReactElement {
  const latestNews = getCollection('news').slice(0, 6);

  return (
    <>
      {/* Hero — تصویر مرجع header.png تمام‌عرض با گرادیان تیره (hero-gradient مرجع) */}
      <section id="top" className="relative h-[600px] lg:h-[819px] w-full overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/landing/header.png"
            alt="نمای کارخانه سیمان خاکستری نی‌ریز"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#191c1e]/40 to-[#191c1e]/70" />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-content flex-col items-start justify-center px-4 text-white md:px-8">
          <span
            className="animate-fade-up mb-4 rounded-full border border-white/20 bg-primary/30 px-4 py-1 text-sm font-medium backdrop-blur-md"
            style={{ animationDelay: '0.1s' }}
          >
            تکنولوژی و پایداری
          </span>
          <h1
            className="animate-fade-up mb-6 max-w-2xl text-3xl font-bold leading-tight md:text-4xl"
            style={{ animationDelay: '0.2s' }}
          >
            سیمان خاکستری نی‌ریز؛ نماد استحکام و نوآوری در صنعت
          </h1>
          <p
            className="animate-fade-up mb-8 max-w-xl text-lg leading-8 opacity-90"
            style={{ animationDelay: '0.3s' }}
          >
            پیشرو در تولید سیمان با استانداردهای جهانی و بهره‌گیری از تکنولوژی‌های روز دنیا
            جهت توسعه زیرساخت‌های پایدار میهن.
          </p>
          <div className="animate-fade-up flex flex-wrap gap-4" style={{ animationDelay: '0.4s' }}>
            <Link
              href="/about"
              className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary shadow-xl transition-all hover:bg-primary-fixedDim active:scale-95"
            >
              کاتالوگ محصولات
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border-2 border-white/50 px-8 py-3 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              مشاوره فنی
            </Link>
          </div>
        </div>
      </section>

      {/* کارت‌های آمار (KPI) — شناور روی انتهای Hero مطابق مرجع (-mt-16) */}
      <section className="relative z-20 mx-auto -mt-16 max-w-content px-4 md:px-8">
        <div className="animate-stagger grid grid-cols-1 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="glass-card glass-card-hover animate-fade-up flex flex-col rounded-2xl p-6 shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className={`rounded-xl p-3 ${s.iconClass}`}>
                  <s.icon className="h-6 w-6" />
                </span>
                {s.badge && (
                  <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                    {s.badge}
                  </span>
                )}
              </div>
              <span className="text-sm text-on-surface-variant">{s.label}</span>
              <span className="mt-1 text-2xl font-bold text-on-surface">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* آخرین اخبار و رویدادها — گرید Masonry (Pinterest Style) مرجع */}
      <section className="mx-auto max-w-content px-4 py-24 md:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-on-surface">آخرین اخبار و رویدادها</h2>
            <p className="text-on-surface-variant">
              تازه‌ترین تحولات شرکت سیمان نی‌ریز در یک نگاه
            </p>
          </div>
          <Link
            href="/news"
            className="self-start rounded-lg bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high md:self-auto"
          >
            مشاهده همه اخبار
          </Link>
        </div>

        {latestNews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
            <Bell className="h-10 w-10" />
            <p className="text-sm">فعلاً خبری منتشر نشده است.</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {latestNews.map((item, idx) =>
              item.cover ? (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="glass-card group mb-6 block break-inside-avoid overflow-hidden rounded-2xl"
                >
                  <div className={`relative overflow-hidden ${idx % 2 === 0 ? 'aspect-[4/3]' : 'aspect-video'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
                      {formatJalaliDate(item.date)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-3 text-lg font-semibold leading-snug text-on-surface">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="mb-4 leading-7 text-on-surface-variant opacity-80">
                        {item.summary}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 font-bold text-primary">
                      <span className="text-sm">ادامه مطلب</span>
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="glass-card group mb-6 block break-inside-avoid rounded-2xl border-r-4 border-r-primary p-6"
                >
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {formatJalaliDate(item.date)}
                  </span>
                  <h3 className="mb-3 text-lg font-semibold text-on-surface">{item.title}</h3>
                  {item.summary && (
                    <p className="leading-7 text-on-surface-variant">{item.summary}</p>
                  )}
                </Link>
              ),
            )}
          </div>
        )}
      </section>

      {/* سکشن پرتال مشتریان — پس‌زمینه Primary با کارت ورود شیشه‌ای (مرجع) */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="relative z-10 mx-auto flex max-w-content flex-col items-center justify-between gap-10 px-4 md:flex-row md:px-8">
          <div className="md:w-1/2">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              پرتال جامع مشتریان سیمان نی‌ریز
            </h2>
            <p className="mb-8 text-lg leading-8 opacity-80">
              دسترسی سریع و آسان به سیستم ثبت سفارش، رهگیری بارنامه‌ها، مشاهده
              صورت‌حساب‌های مالی و خدمات پس از فروش در ۲۴ ساعت شبانه‌روز.
            </p>
            <div className="flex flex-wrap gap-4">
              {PORTAL_FEATURES.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 transition-all hover:bg-white/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:w-1/2">
            <div className="w-full max-w-sm rounded-3xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-lg">
                  <LogIn className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white">ورود به سامانه</h3>
              </div>
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-white py-3 text-center font-bold text-primary shadow-xl transition-all hover:bg-primary-fixed active:scale-95"
                >
                  ورود به پنل کاربری
                </Link>
                <Link
                  href="/forgot-password"
                  className="block text-center text-xs opacity-60 transition-opacity hover:opacity-100"
                >
                  رمز عبور خود را فراموش کرده‌اید؟
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* نوار گواهینامه‌ها — آیکون‌های خاکستری با Hover رنگی (مرجع) */}
      <section className="bg-surface-container-lowest py-16">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-16 px-4 opacity-50 grayscale transition-all duration-1000 hover:grayscale-0 md:gap-20">
          {CERT_ICONS.map((Icon, i) => (
            <Icon
              key={i}
              className="h-14 w-14 cursor-pointer text-on-surface-variant transition-transform hover:scale-110"
            />
          ))}
        </div>
      </section>

      {/* دکمهٔ بازگشت به بالا (FAB مرجع) */}
      <a
        href="#top"
        aria-label="بازگشت به بالا"
        className="fixed bottom-8 left-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <ChevronUp className="h-6 w-6" />
      </a>
    </>
  );
}
