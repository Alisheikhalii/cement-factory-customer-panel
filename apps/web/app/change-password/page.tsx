'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Loader2, Factory } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';

/**
 * صفحهٔ اجباری تغییر رمز اولیه — `/change-password` (BR-26).
 *
 * این صفحه برای مشتریانی است که `mustResetPassword=true` دارند.
 * — بدون PortalShell، بدون ناوبری؛ فقط فرم تغییر رمز.
 * — پس از تغییر موفق، نسخهٔ به‌روزشدهٔ user را در authStorage ذخیره و
 *   کاربر را به /dashboard هدایت می‌کند.
 * — اگر کاربر لاگین نباشد، useRequireCustomer در مسیرهای دیگر رسیدگی می‌کند؛
 *   اینجا فقط حالت «لاگین‌شده اما باید رمز عوض کند» را می‌پوشاند.
 */
export default function ChangePasswordPage(): React.ReactElement {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('رمز جدید باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (currentPassword === newPassword) {
      setError('رمز جدید نباید با رمز فعلی یکسان باشد');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch<{ changed: true }>('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      // پرچم را در authStorage پاک می‌کنیم تا route guard دیگر ریدایرکت نکند.
      const stored = authStorage.getUser();
      if (stored) {
        authStorage.save(authStorage.getToken() ?? '', {
          ...stored,
          mustResetPassword: false,
        });
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا؛ دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 6 && !loading;

  return (
    <main className="dashboard-bg min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-lg animate-fade-up">
        {/* هدر */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-white shadow-md">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{companyInfo.name}</p>
            <p className="text-xs text-on-surface-variant">پورتال الکترونیک مشتریان</p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-on-surface mb-1">تغییر رمز عبور اولیه</h1>
        <p className="text-sm text-on-surface-variant mb-7">
          برای استفاده از سامانه لازم است رمز عبور اولیهٔ خود را تغییر دهید.
        </p>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* رمز فعلی */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-on-surface mb-1.5">
              رمز عبور فعلی
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی را وارد کنید"
                className="input-glass w-full py-3 pr-11 pl-11 text-on-surface"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                aria-label={showCurrent ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* رمز جدید */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-on-surface mb-1.5">
              رمز عبور جدید
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز جدید (حداقل ۶ کاراکتر)"
                className="input-glass w-full py-3 pr-11 pl-11 text-on-surface"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                aria-label={showNew ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">حداقل ۶ کاراکتر</p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/25 px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="gradient-btn interactive-element w-full flex items-center justify-center gap-2 py-3 text-white font-bold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            تغییر رمز و ورود به سامانه
          </button>
        </form>
      </div>
    </main>
  );
}
