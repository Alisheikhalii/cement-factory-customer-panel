'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  PackageCheck,
  Users,
} from 'lucide-react';
import type { AuthUser } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';

/** آیتم‌های Navbar ادمین (بخش ۹.۹): داشبورد، مشتریان، کارتابل، شکایات، نظرسنجی. */
const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'مشتریان', icon: Users },
  { href: '/admin/loading-requests', label: 'کارتابل اعلام بار', icon: ClipboardList },
  { href: '/admin/complaints', label: 'شکایات', icon: MessageSquareWarning },
  { href: '/admin/surveys', label: 'نظرسنجی', icon: PackageCheck },
];

/**
 * پوسته داشبورد ادمین: همان زبان بصری PortalShell مشتری (بخش ۹.۹ — «مچ بودن»)
 * اما با آیتم‌های Navbar ادمین. صفحات محتوا را به‌عنوان children می‌دهند.
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

  async function handleLogout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authStorage.clear();
      router.replace('/admin/login');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white">
            نی‌ریز
          </div>
          <h1 className="text-sm font-bold text-slate-800 sm:text-base">
            داشبورد مدیریت {companyInfo.name}
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

      <nav className="bg-gradient-to-l from-slate-900 to-slate-700 px-2 sm:px-6">
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
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
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
