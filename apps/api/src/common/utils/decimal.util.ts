import { Prisma } from '@prisma/client';

/**
 * تبدیل مقدار Decimal پرزیما به number برای سریال‌سازی JSON (بخش ۱۱.۱۱).
 * مقادیر پولی/مقداری در محدوده امن نمایش پورتال قرار دارند.
 */
export function toNum(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

/** نسخه‌ای که برای مقادیر «نبود مقدار» به‌جای صفر، null برمی‌گرداند (KPIها). */
export function toNumOrNull(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}
