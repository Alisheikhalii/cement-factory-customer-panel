import { z } from 'zod';
import { isValidIranianNationalId } from '@cement/shared-types';

/**
 * اسکیمای فرم تعریف/ویرایش مشتری (بخش ۹.۹.۲، BR-26/BR-28).
 * هنگام ایجاد، کد ملی و کد تفصیل الزامی‌اند (هویت ورود). هنگام ویرایش این دو
 * تغییرناپذیر و فقط‌خواندنی‌اند، پس اعتبارسنجی نمی‌شوند.
 */
const baseShape = {
  economicCode: z.string().optional(),
  mobile: z
    .string()
    .min(1, 'موبایل الزامی است')
    .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  creditLimit: z.string().optional(),
};

export const createCustomerSchema = z.object({
  customerCode: z.string().min(1, 'کد تفصیل الزامی است'),
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
