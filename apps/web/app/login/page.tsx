'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, IdCard, Lock, Loader2 } from 'lucide-react';
import type { LoginResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';
import { customerLoginSchema, type CustomerLoginForm } from '../../lib/auth-schemas';

/**
 * صفحه ورود مشتری — `/login` (بخش ۹.۱ PRD).
 * ورود با کد ملی (Username) + رمز عبور. خطای خنثی (بدون افشای فیلد غلط).
 */
export default function CustomerLoginPage(): React.ReactElement {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerLoginForm>({
    resolver: zodResolver(customerLoginSchema),
    mode: 'onTouched',
  });

  const nationalId = watch('nationalId');
  const password = watch('password');
  const canSubmit = Boolean(nationalId) && Boolean(password) && !isSubmitting;

  async function onSubmit(values: CustomerLoginForm): Promise<void> {
    setServerError(null);
    try {
      const res = await apiClient.post<LoginResponse>('/auth/login', values);
      authStorage.save(res.accessToken, res.user, res.csrfToken);
      router.push('/dashboard');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'خطا در ورود؛ دوباره تلاش کنید');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">{companyInfo.name}</h1>
          <p className="text-sm text-slate-500 mt-1">پورتال الکترونیک مشتریان</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 mb-1">
              کد ملی
            </label>
            <div className="relative">
              <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="nationalId"
                inputMode="numeric"
                maxLength={10}
                placeholder="کد ملی خود را وارد نمایید"
                className="w-full rounded-lg border border-slate-300 py-2.5 pr-10 pl-3 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                {...register('nationalId')}
              />
            </div>
            {errors.nationalId && (
              <p className="text-xs text-red-600 mt-1">{errors.nationalId.message}</p>
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
                placeholder="لطفا رمز عبور خود را وارد نمایید"
                className="w-full rounded-lg border border-slate-300 py-2.5 pr-10 pl-10 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
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
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            ورود به سایت
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
              فراموشی رمز عبور
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
