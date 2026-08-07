'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@cement/shared-types';
import { authStorage } from './auth-storage';

/**
 * محافظت مسیرهای مشتری سمت کلاینت (بخش ۶.۲/۹).
 * تا زمان تایید نقش، مقدار null برمی‌گرداند تا صفحه محتوای محافظت‌شده را نشان ندهد.
 * ⚠️ این فقط UX است؛ منبع حقیقت مجوز، Guard های Backend روی هر Endpoint‌اند.
 */
export function useRequireCustomer(): AuthUser | null {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = authStorage.getUser();
    const token = authStorage.getToken();
    if (!stored || !token || stored.role !== 'CUSTOMER') {
      router.replace('/login');
      return;
    }
    // BR-26: اگر رمز اولیه تغییر نکرده، هر مسیر مشتری را به صفحهٔ تغییر رمز هدایت کن.
    // این چک از دور زدن ریدایرکت صفحهٔ لاگین با navigate مستقیم جلوگیری می‌کند.
    if (stored.mustResetPassword) {
      router.replace('/change-password');
      return;
    }
    setUser(stored);
  }, [router]);

  return user;
}
