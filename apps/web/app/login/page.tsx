'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, IdCard, Lock, Loader2, Factory } from 'lucide-react';
import type { LoginResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';
import { authStorage } from '../../lib/auth-storage';
import { companyInfo } from '../../lib/company-info';
import { customerLoginSchema, type CustomerLoginForm } from '../../lib/auth-schemas';

/**
 * صفحه ورود مشتری — `/login` (بخش ۹.۱ PRD).
 * طراحی مطابق مرجع animated_login_page_ngcc_cement: پنل شیشه‌ای دوبخشی
 * (فرم + بنر شناور) روی پس‌زمینه گرادیانت روشن.
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
      // BR-26: اگر رمز اولیه تغییر نکرده، قبل از هر مسیر دیگری به صفحهٔ تغییر رمز بفرست.
      router.push(res.user.mustResetPassword ? '/change-password' : '/dashboard');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'خطا در ورود؛ دوباره تلاش کنید');
    }
  }

  return (
    <main className="dashboard-bg min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden shadow-lg grid lg:grid-cols-2 min-h-[560px]">
        {/* سمت فرم */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 order-2 lg:order-1">
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-white shadow-md">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{companyInfo.name}</p>
                <p className="text-xs text-on-surface-variant">پورتال الکترونیک مشتریان</p>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2">
              ورود به حساب کاربری
            </h1>
            <p className="text-sm text-on-surface-variant mb-8">
              لطفا مشخصات خود را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="nationalId" className="block text-sm font-medium text-on-surface mb-1.5">
                کد ملی
              </label>
              <div className="relative">
                <IdCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
                <input
                  id="nationalId"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="کد ملی خود را وارد نمایید"
                  className="input-glass w-full py-3 pr-11 pl-3 text-on-surface"
                  {...register('nationalId')}
                />
              </div>
              {errors.nationalId && (
                <p className="text-xs text-danger mt-1.5">{errors.nationalId.message}</p>
              )}
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-on-surface">
                  رمز عبور
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary-container hover:text-secondary transition-colors"
                >
                  فراموشی رمز عبور
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="لطفا رمز عبور خود را وارد نمایید"
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
                ورود به سامانه
              </button>
            </div>

            <p
              className="animate-fade-up text-center text-xs text-on-surface-variant"
              style={{ animationDelay: '0.5s' }}
            >
              ورود مدیران از{' '}
              <Link href="/admin/login" className="text-primary-container hover:underline font-medium">
                پنل مدیریت
              </Link>
            </p>
          </form>
        </div>

        {/* سمت بنر */}
        <div className="relative hidden lg:block order-1 lg:order-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary animate-floating scale-110" />
          {/* هاله‌های نور */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-12 text-white">
            <div className="mb-4 inline-flex items-center gap-2 self-start rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-medium border border-white/20">
              سامانه خدمات الکترونیک مشتریان
            </div>
            <h2 className="text-3xl font-extrabold leading-relaxed mb-3">
              {companyInfo.name}
            </h2>
            <p className="text-sm text-white/80 leading-7 max-w-sm">
              مدیریت سفارشات، اعلام بار، حواله‌ها و امور مالی خود را به‌صورت یکپارچه و
              شبانه‌روزی از طریق این سامانه انجام دهید.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
