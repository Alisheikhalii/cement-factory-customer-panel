'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import type { LoginResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { authStorage } from '../../../lib/auth-storage';
import { companyInfo } from '../../../lib/company-info';
import { adminLoginSchema, type AdminLoginForm } from '../../../lib/auth-schemas';

/**
 * صفحه ورود ادمین — `/admin/login` (بخش ۶.۲ و ۹.۹ PRD).
 * همان زبان طراحی شیشه‌ای مرجع ورود؛ پنل تک‌ستونه با آیکن سپر مدیریتی.
 */
export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onTouched',
  });

  const canSubmit = Boolean(watch('username')) && Boolean(watch('password')) && !isSubmitting;

  async function onSubmit(values: AdminLoginForm): Promise<void> {
    setServerError(null);
    try {
      const res = await apiClient.post<LoginResponse>('/admin/login', values);
      authStorage.save(res.accessToken, res.user, res.csrfToken);
      router.push('/admin');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'خطا در ورود؛ دوباره تلاش کنید');
    }
  }

  return (
    <main className="dashboard-bg min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-lg">
        <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">داشبورد مدیریت</h1>
          <p className="text-sm text-on-surface-variant mt-1">{companyInfo.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="username" className="block text-sm font-medium text-on-surface mb-1.5">
              نام کاربری
            </label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                id="username"
                placeholder="نام کاربری ادمین"
                className="input-glass w-full py-3 pr-11 pl-3 text-on-surface"
                {...register('username')}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-danger mt-1.5">{errors.username.message}</p>
            )}
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="رمز عبور"
                className="input-glass w-full py-3 pr-11 pl-11 text-on-surface"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger mt-1.5">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-danger/10 border border-danger/25 px-3 py-2.5 text-sm text-danger animate-fade-up">
              {serverError}
            </div>
          )}

          <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              className="gradient-btn interactive-element w-full flex items-center justify-center gap-2 py-3 text-white font-bold"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ورود
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
