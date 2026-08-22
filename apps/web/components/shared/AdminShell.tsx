'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  PackageCheck,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { AuthUser } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';
import { ErrorBoundary } from './ErrorBoundary';

/** آیتم‌های منوی ادمین (بخش ۹.۹): داشبورد، مشتریان، کارتابل، شکایات، نظرسنجی. */
const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'مشتریان', icon: Users },
  { href: '/admin/loading-requests', label: 'کارتابل اعلام بار', icon: ClipboardList },
  { href: '/admin/complaints', label: 'شکایات', icon: MessageSquareWarning },
  { href: '/admin/surveys', label: 'نظرسنجی', icon: PackageCheck },
];

/**
 * پوسته داشبورد ادمین: همان زبان بصری «شیشه صنعتی» PortalShell مشتری
 * (بخش ۹.۹ — «مچ بودن») با سایدبار شیشه‌ای ثابت و آیتم‌های ناوبری ادمین.
 */
export function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authStorage.clear();
      router.replace('/admin/login');
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* لوگو */}
      <div className="flex items-center gap-3 px-6 h-20 shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-container to-secondary text-white shadow-md transition-transform duration-300 hover:rotate-6">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-on-surface leading-6">{companyInfo.name}</p>
          <p className="text-[11px] text-on-surface-variant">داشبورد مدیریت</p>
        </div>
      </div>

      {/* آیتم‌های ناوبری */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`nav-item interactive-element flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    active
                      ? 'bg-gradient-to-l from-primary-container to-secondary text-white shadow-md'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* خروج */}
      <div className="p-4 shrink-0">
        <button
          onClick={handleLogout}
          className="interactive-element flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-bg min-h-screen">
      {/* سایدبار دسکتاپ */}
      <aside className="glass-panel fixed inset-y-0 right-0 z-40 hidden w-72 border-l border-white/40 lg:block">
        {sidebarContent}
      </aside>

      {/* کشوی موبایل */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="glass-panel absolute inset-y-0 right-0 w-72 border-l border-white/40 shadow-lg">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute left-3 top-3 rounded-lg p-1.5 text-on-surface-variant hover:bg-black/5"
              aria-label="بستن منو"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* هدر */}
      <header className="glass-panel fixed top-0 left-0 right-0 lg:right-72 z-30 flex h-16 items-center justify-between border-b border-white/40 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="interactive-element rounded-lg p-2 text-on-surface-variant hover:bg-black/5 lg:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/50 border border-white/60 px-4 py-2 text-sm text-on-surface-variant w-64">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">جستجو...</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="interactive-element relative rounded-full bg-white/50 border border-white/60 p-2.5 text-on-surface-variant hover:text-primary-container transition-colors"
            aria-label="اعلان‌ها"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2.5 rounded-full bg-white/50 border border-white/60 py-1.5 pr-2 pl-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-container to-secondary text-xs font-bold text-white">
              {(user.fullName ?? user.username).slice(0, 1)}
            </div>
            <span className="hidden text-sm font-medium text-on-surface sm:inline">
              {user.fullName ?? user.username}
            </span>
          </div>
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="lg:mr-72 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* مرزِ خطا دورِ بدنهٔ صفحهٔ ادمین (Issue 3a): اگر یک صفحه در رندر بیفتد،
              سایدبار/هدر سالم می‌ماند و «تلاش مجدد» فقط همین بخش را باز-رندر می‌کند. */}
          <ErrorBoundary name="AdminShell:content">{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
