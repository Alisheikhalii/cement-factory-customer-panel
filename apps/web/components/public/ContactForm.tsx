'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import type { ContactMessageResponse } from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';

/**
 * فرم «تماس با ما» عمومی (بخش ۹.۱۰.۴) — Client Component.
 * بدون Auth؛ به `POST /public/contact` می‌فرستد. خطای Rate Limit (CONTACT_001)
 * از سرور با پیام کاتالوگ خطا نمایش داده می‌شود.
 */
const contactSchema = z.object({
  name: z.string().min(1, 'نام را وارد کنید').max(120),
  phoneOrEmail: z.string().min(1, 'راه ارتباطی را وارد کنید').max(120),
  message: z.string().min(1, 'متن پیام را وارد کنید').max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

export function ContactForm(): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
  });

  async function onSubmit(values: ContactForm): Promise<void> {
    setServerError(null);
    try {
      const res = await apiClient.post<ContactMessageResponse>('/public/contact', values);
      if (res.sent) {
        setSent(true);
        reset();
      }
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : 'ارسال پیام ناموفق بود؛ دوباره تلاش کنید',
      );
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-green-50 border border-green-200 py-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-success" />
        <p className="font-medium text-slate-800">پیام شما با موفقیت ارسال شد.</p>
        <p className="text-sm text-slate-500">در اسرع وقت با شما تماس خواهیم گرفت.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-2 text-sm text-primary-700 hover:underline"
        >
          ارسال پیام جدید
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          نام و نام خانوادگی
        </label>
        <input
          id="name"
          className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="phoneOrEmail" className="block text-sm font-medium text-slate-700 mb-1">
          موبایل یا ایمیل
        </label>
        <input
          id="phoneOrEmail"
          className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          {...register('phoneOrEmail')}
        />
        {errors.phoneOrEmail && (
          <p className="text-xs text-red-600 mt-1">{errors.phoneOrEmail.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
          متن پیام
        </label>
        <textarea
          id="message"
          rows={5}
          className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-y"
          {...register('message')}
        />
        {errors.message && (
          <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-700 py-2.5 text-white font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        ارسال پیام
      </button>
    </form>
  );
}
