'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@cement/shared-types';
import { authStorage } from './auth-storage';

/**
 * محافظت مسیرهای ادمین سمت کلاینت (بخش ۶.۲/۹.۹).
 * تا تایید نقش ADMIN مقدار null برمی‌گرداند تا محتوای محافظت‌شده نمایش داده نشود.
 * ⚠️ این فقط UX است؛ منبع حقیقت مجوز، AdminGuard روی هر Endpoint است.
 */
export function useRequireAdmin(): AuthUser | null {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = authStorage.getUser();
    const token = authStorage.getToken();
    if (!stored || !token || stored.role !== 'ADMIN') {
      router.replace('/admin/login');
      return;
    }
    setUser(stored);
  }, [router]);

  return user;
}
