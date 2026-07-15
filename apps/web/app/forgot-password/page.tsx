'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { ForgotPasswordResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';

/**
 * فراموشی رمز — `/forgot-password` (بخش ۶.۱ PRD).
 * مرحله ۱: کد ملی → ارسال OTP به موبایل ثبت‌شده (Mask‌شده نمایش داده می‌شود).
 * مرحله ۲: OTP + رمز جدید.
 * ⚠️ ارسال واقعی SMS هنوز فعال نیست (بخش ۲۰.۲)؛ در توسعه OTP در لاگ سرور چاپ می‌شود.
 */
export default function ForgotPasswordPage(): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [nationalId, setNationalId] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitStep1(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
        nationalId,
      });
      setMaskedMobile(res.maskedMobile);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا؛ دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { nationalId, otp, newPassword });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا؛ دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <h1 className="text-xl font-bold text-slate-800 mb-6 text-center">بازیابی رمز عبور</h1>

        {step === 1 ? (
          <form onSubmit={submitStep1} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">کد ملی</label>
              <input
                inputMode="numeric"
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی خود را وارد نمایید"
                className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-purple-500 outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !nationalId}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              ارسال کد تایید
            </button>
          </form>
        ) : (
          <form onSubmit={submitStep2} className="space-y-5">
            <p className="text-sm text-slate-600">
              کد تایید به شماره {maskedMobile} ارسال شد.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">کد تایید</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="کد ۶ رقمی"
                className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز جدید (حداقل ۶ کاراکتر)"
                className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-purple-500 outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !otp || newPassword.length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              تنظیم رمز جدید
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-purple-600 hover:underline">
            بازگشت به ورود
          </Link>
        </div>
      </div>
    </main>
  );
}
