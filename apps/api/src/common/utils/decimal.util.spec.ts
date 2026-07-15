import { Prisma } from '@prisma/client';
import { toNum, toNumOrNull } from './decimal.util';

/**
 * تست ابزار تبدیل Decimal پریزما (فاز ۷e — پوشش واحدهای خالص).
 * قرارداد بخش ۱۱.۱۱: toNum برای نمایش (نبود مقدار = ۰)، toNumOrNull برای KPIها
 * (نبود مقدار = null تا با صفر واقعی اشتباه نشود).
 */
describe('decimal.util', () => {
  describe('toNum', () => {
    it('Decimal را به number تبدیل می‌کند', () => {
      expect(toNum(new Prisma.Decimal('1234.56'))).toBe(1234.56);
    });

    it('null/undefined → صفر', () => {
      expect(toNum(null)).toBe(0);
      expect(toNum(undefined)).toBe(0);
    });

    it('مقدار عددی خام (غیر Decimal) هم پذیرفته می‌شود', () => {
      expect(toNum(42 as unknown as Prisma.Decimal)).toBe(42);
    });
  });

  describe('toNumOrNull', () => {
    it('Decimal را به number تبدیل می‌کند', () => {
      expect(toNumOrNull(new Prisma.Decimal('0'))).toBe(0);
    });

    it('null/undefined → null (نه صفر — تمایز KPI بدون داده از صفر واقعی)', () => {
      expect(toNumOrNull(null)).toBeNull();
      expect(toNumOrNull(undefined)).toBeNull();
    });
  });
});
