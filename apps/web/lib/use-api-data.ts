'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from './api';
import { authStorage } from './auth-storage';

/**
 * وضعیت‌های Async مطابق ماتریس ۸-حالته بخش ۱۰.۹ PRD.
 * (Loading/Skeleton یکی‌اند؛ Empty بر اساس طول داده تعیین می‌شود.)
 */
export type AsyncState = 'loading' | 'success' | 'error' | 'forbidden';

export interface UseApiDataResult<T> {
  state: AsyncState;
  data: T | null;
  error: ApiError | null;
  reload: () => void;
}

/**
 * Hook عمومی واکشی داده با مدیریت خودکار حالت‌ها (بخش ۱۰.۹):
 *  - 401 (AUTH_003) → پاک‌سازی و Redirect به /login (حالت Unauthorized)
 *  - 403 (AUTH_004) → حالت Forbidden
 *  - 5xx/شبکه → حالت Error با دکمه «تلاش مجدد» (reload)
 * تشخیص Empty بر عهده کامپوننت مصرف‌کننده است (data.length===0).
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): UseApiDataResult<T> {
  const router = useRouter();
  const [state, setState] = useState<AsyncState>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setState('loading');
    setError(null);

    fetcher()
      .then((result) => {
        if (!active) return;
        setData(result);
        setState('success');
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiErr =
          err instanceof ApiError ? err : new ApiError('GENERIC_500', 'خطای ناشناخته');
        if (apiErr.code === 'AUTH_003' || apiErr.httpStatus === 401) {
          // Unauthorized → پاک‌سازی نشست منقضی و Redirect به صفحه ورودِ متناظر با
          // ناحیه فعلی: کاربر ادمین به /admin/login و مشتری به /login (تا ادمین در
          // صفحه ورود مشتری گیر نکند).
          authStorage.clear();
          const isAdminArea =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
          router.replace(isAdminArea ? '/admin/login' : '/login');
          return;
        }
        setError(apiErr);
        setState(apiErr.code === 'AUTH_004' || apiErr.httpStatus === 403 ? 'forbidden' : 'error');
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  return { state, data, error, reload };
}
