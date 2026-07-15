import { z } from 'zod';
import { isValidIranianNationalId } from '@cement/shared-types';

/**
 * اسکیمای اعتبارسنجی فرم‌های ورود (بخش ۹.۱ PRD).
 * منطق کد ملی از shared-types می‌آید (بدون کپی — instruction.md §3).
 */

export const customerLoginSchema = z.object({
  nationalId: z
    .string()
    .min(1, 'کد ملی را وارد کنید')
    .refine(isValidIranianNationalId, 'کد ملی معتبر نیست'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3, 'نام کاربری را وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export type CustomerLoginForm = z.infer<typeof customerLoginSchema>;
export type AdminLoginForm = z.infer<typeof adminLoginSchema>;
