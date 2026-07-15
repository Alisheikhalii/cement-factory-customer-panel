'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  PackageCheck,
  ShoppingCart,
  Truck,
  Wallet,
} from 'lucide-react';
import type { AuthUser } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';

/** هفت آیتم Navbar از راست به چپ (بخش ۹.۰). */
const NAV_ITEMS = [
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/finance', label: 'مالی', icon: Wallet },
  { href: '/orders', label: 'سفارشات', icon: ShoppingCart },
  { href: '/loading-requests', label: 'اعلام بار', icon: ClipboardList },
  { href: '/deliveries', label: 'تحویل', icon: Truck },
  { href: '/surveys', label: 'نظرسنجی', icon: PackageCheck },
  { href: '/complaints', label: 'شکایات', icon: MessageSquareWarning },
];

/**
 * پوسته‌ی پورتال مشتری: Header ثابت + Navbar گرادیانت (بخش ۹.۰).
 * صفحات محتوای خود را به‌عنوان children می‌دهند.
 */
export function PortalShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authStorage.clear();
      router.replace('/login');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900 text-xs font-bold text-white">
            نی‌ریز
          </div>
          <h1 className="text-sm font-bold text-slate-800 sm:text-base">
            سامانه خدمات الکترونیک مشتریان {companyInfo.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            {user.fullName ?? user.username}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      {/* Navbar */}
      <nav className="bg-gradient-to-l from-blue-950 to-blue-800 px-2 sm:px-6">
        <ul className="flex flex-wrap gap-1 overflow-x-auto py-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-white/15 font-semibold text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
