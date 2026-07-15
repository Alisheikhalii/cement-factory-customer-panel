'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { companyInfo } from '../../lib/company-info';

/**
 * Navbar عمومی لندینگ پیج (بخش ۹.۱۰.۲) — کاملاً جدا از Navbar پورتال.
 * آیتم‌ها از راست به چپ + دکمهٔ برجستهٔ «پورتال مشتریان» → /login.
 */
const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/', label: 'خانه' },
  { href: '/news', label: 'اخبار کارخانه' },
  { href: '/announcements', label: 'اطلاعیه‌ها' },
  { href: '/reports', label: 'گزارش‌ها' },
  { href: '/about', label: 'دربارهٔ ما' },
  { href: '/contact', label: 'تماس با ما' },
];

const MEDIA_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/media/photos', label: 'گالری عکس' },
  { href: '/media/videos', label: 'گالری فیلم' },
];

export function PublicNavbar(): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  return (
    <header className="sticky top-0 z-dropdown bg-white/80 backdrop-blur-md border-b border-slate-200">
      <nav className="mx-auto max-w-content px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-700">{companyInfo.shortName}</span>
        </Link>

        {/* منوی دسکتاپ */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100 hover:text-primary-700 transition"
            >
              {item.label}
            </Link>
          ))}

          {/* زیرمنوی چندرسانه‌ای */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100 hover:text-primary-700 transition"
            >
              چندرسانه‌ای
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 w-40 rounded-lg bg-white shadow-glass border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
              {MEDIA_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {NAV_ITEMS.slice(4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100 hover:text-primary-700 transition"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/login"
            className="ms-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 transition"
          >
            پورتال مشتریان
          </Link>
        </div>

        {/* دکمهٔ منوی موبایل */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-slate-700"
          aria-label="منو"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* منوی موبایل */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMediaOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100"
          >
            چندرسانه‌ای
            <ChevronDown className={`w-4 h-4 transition ${mediaOpen ? 'rotate-180' : ''}`} />
          </button>
          {mediaOpen &&
            MEDIA_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-6 py-2 text-sm text-slate-600 rounded-md hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg bg-primary-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-800"
          >
            پورتال مشتریان
          </Link>
        </div>
      )}
    </header>
  );
}
