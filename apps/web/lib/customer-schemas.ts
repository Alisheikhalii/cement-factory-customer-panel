import { z } from 'zod';
import { isValidIranianNationalId } from '@cement/shared-types';

/**
 * اسکیمای فرم تعریف/ویرایش مشتری (بخش ۹.۹.۲، BR-26/BR-28).
 * هنگام ایجاد کد ملی الزامی است (هویت ورود). هنگام ویرایش کد ملی و کد تفصیل
 * تغییرناپذیر و فقط‌خواندنی‌اند، پس اعتبارسنجی نمی‌شوند.
 *
 * ⚠️ «کد تفصیل» در ایجاد هم اختیاری است: در لحظهٔ ثبت مشتری همیشه از ERP در دست
 * نیست و بعداً تکمیل می‌شود.
 */
const baseShape = {
  economicCode: z.string().optional(),
  // فقط «قالب» شماره بررسی می‌شود؛ تکراری بودن شماره بین چند مشتری مجاز است.
  mobile: z
    .string()
    .min(1, 'موبایل الزامی است')
    .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  creditLimit: z.string().optional(),
};

export const createCustomerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(1, 'نام مشتری الزامی است'),
  nationalId: z
    .string()
    .min(1, 'کد ملی الزامی است')
    .refine(isValidIranianNationalId, 'کد ملی معتبر نیست'),
  ...baseShape,
});

export const editCustomerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(1, 'نام مشتری الزامی است'),
  nationalId: z.string().optional(),
  ...baseShape,
});

export type CreateCustomerForm = z.infer<typeof createCustomerSchema>;
