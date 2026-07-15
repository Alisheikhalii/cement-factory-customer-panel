import type { AuthUser } from '@cement/shared-types';

/**
 * نگهداری سبک وضعیت احراز هویت سمت کلاینت (فاز ۱).
 * Access Token کوتاه‌عمر در localStorage نگهداری می‌شود؛ Refresh Token در Cookie
 * ی httpOnly است (خارج از دسترس JS — امن‌تر). در فازهای بعد با TanStack Query و
 * یک AuthProvider کامل جایگزین/تکمیل می‌شود.
 */
const TOKEN_KEY = 'cement_access_token';
const USER_KEY = 'cement_auth_user';
const CSRF_KEY = 'cement_csrf_token';

export const authStorage = {
  save(token: string, user: AuthUser, csrfToken?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (csrfToken) {
      localStorage.setItem(CSRF_KEY, csrfToken);
    }
  },
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  /** توکن CSRF نشست (برای هدر X-CSRF-Token در refresh/logout — بخش ۱۳ PRD). */
  getCsrf(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CSRF_KEY);
  },
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CSRF_KEY);
  },
};
