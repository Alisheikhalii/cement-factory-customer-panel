'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authStorage } from '../../lib/auth-storage';

/**
 * ریشه `/admin` — به داشبورد یا صفحه ورود هدایت می‌کند (Command Center در ۹.۹.۱).
 */
export default function AdminIndexPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    const stored = authStorage.getUser();
    const token = authStorage.getToken();
    if (stored && token && stored.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center">در حال هدایت…</main>;
}
