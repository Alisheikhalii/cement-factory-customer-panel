'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User, Lock, Loader2 } from 'lucide-react';
import type { LoginResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { authStorage } from '../../../lib/auth-storage';
import { companyInfo } from '../../../lib/company-info';
import { adminLoginSchema, type AdminLoginForm } from '../../../lib/auth-schemas';

/**
 * صفحه ورود ادمین — `/admin/login` (بخش ۶.۲ و ۹.۹ PRD).
 * جدا از ورود مشتری؛ نام کاربری شناسه دلخواه ادمین است (نه کد ملی).
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
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">داشبورد مدیریت</h1>
          <p className="text-sm text-slate-500 mt-1">{companyInfo.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              نام کاربری
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="username"
                placeholder="نام کاربری ادمین"
                className="w-full rounded-lg border border-slate-300 py-2.5 pr-10 pl-3 text-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700 outline-none"
                {...register('username')}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              رمز عبور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="رمز عبور"
                className="w-full rounded-lg border border-slate-300 py-2.5 pr-10 pl-10 text-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700 outline-none"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-white font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            ورود
          </button>
        </form>
      </div>
    </main>
  );
}
