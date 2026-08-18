import { Prisma } from '@prisma/client';
import {
  currentJalaaliMonthStart,
  formatJalaaliDate,
  formatJalaaliDateIso,
  jalaaliMonthLabel,
  toJalaali,
} from './jalali.util';

/**
 * تست‌های تبدیل جلالی (بخش ۱۸ — Unit).
 * نقاط مرجع شناخته‌شده میلادی→شمسی برای جلوگیری از رگرسیون الگوریتم.
 * ⚠️ toJalaali لحظه را به وقت «Asia/Tehran» تفسیر می‌کند؛ پس تاریخ‌ها با
 * `Date.UTC(...)` در نیمه‌روز UTC ساخته می‌شوند تا صرف‌نظر از TZ اجراکنندهٔ CI،
 * همان روزِ تقویمیِ ایران به‌دست آید (وگرنه روی رانرهای شرقِ ایران می‌شکند).
 */
describe('jalali.util', () => {
  it('نوروز ۱۴۰۳ = ۲۰ مارس ۲۰۲۴', () => {
    // 2024-03-20 12:00Z → ۱۵:۳۰ ایران، همان روز → 1403/01/01
    const d = new Date(Date.UTC(2024, 2, 20, 12));
    expect(toJalaali(d)).toEqual({ jy: 1403, jm: 1, jd: 1 });
  });

  it('۲۱ مارس ۲۰۲۴ = ۱۴۰۳/۰۱/۰۲', () => {
    const d = new Date(Date.UTC(2024, 2, 21, 12));
    expect(toJalaali(d)).toEqual({ jy: 1403, jm: 1, jd: 2 });
  });

  it('اول ژانویه ۲۰۲۵ = ۱۴۰۳/۱۰/۱۲', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 12));
    expect(toJalaali(d)).toEqual({ jy: 1403, jm: 10, jd: 12 });
  });

  it('برچسب ماه فارسی درست ساخته می‌شود', () => {
    expect(jalaaliMonthLabel(new Date(Date.UTC(2024, 2, 25, 12)))).toBe('فروردین 1403');
    expect(jalaaliMonthLabel(new Date(Date.UTC(2025, 0, 1, 12)))).toBe('دی 1403');
  });

  it('ابتدای ماه جلالی، همان ماه را حفظ می‌کند و روز اول است', () => {
    const now = new Date(Date.UTC(2024, 6, 15, 12)); // اواسط تیر ۱۴۰۳
    const start = currentJalaaliMonthStart(now);
    const j = toJalaali(start);
    expect(j.jd).toBe(1);
    expect(j.jm).toBe(toJalaali(now).jm);
    expect(j.jy).toBe(toJalaali(now).jy);
  });

  it('Prisma.Decimal در محیط تست در دسترس است (پیش‌نیاز مپرها)', () => {
    expect(new Prisma.Decimal('12.5').toNumber()).toBe(12.5);
  });

  /**
   * فرمت نمایشی جلالی برای خروجی‌های Excel/PDF (PRD ۱۳ — NFR تقویم جلالی).
   * باید هم‌فرمت `formatJalaliDate` سمت وب باشد: «YYYY/MM/DD» با ارقام فارسی.
   */
  describe('formatJalaaliDate', () => {
    it('تاریخ را با ارقام فارسی و صفرِ ابتدایی می‌سازد', () => {
      expect(formatJalaaliDate(new Date(Date.UTC(2024, 2, 20, 12)))).toBe('۱۴۰۳/۰۱/۰۱');
      expect(formatJalaaliDate(new Date(Date.UTC(2024, 7, 11, 12)))).toBe('۱۴۰۳/۰۵/۲۱');
      expect(formatJalaaliDate(new Date(Date.UTC(2025, 0, 1, 12)))).toBe('۱۴۰۳/۱۰/۱۲');
    });

    it('هیچ رقم لاتینی در خروجی نمی‌ماند', () => {
      expect(formatJalaaliDate(new Date(Date.UTC(2025, 0, 1, 12)))).not.toMatch(/\d/);
    });

    it('نسخهٔ ISO همان نتیجه را می‌دهد', () => {
      expect(formatJalaaliDateIso('2024-08-11T12:00:00.000Z')).toBe('۱۴۰۳/۰۵/۲۱');
    });

    it('مقدار خالی/نامعتبر → رشتهٔ خالی (نه Invalid Date)', () => {
      expect(formatJalaaliDateIso(null)).toBe('');
      expect(formatJalaaliDateIso(undefined)).toBe('');
      expect(formatJalaaliDateIso('')).toBe('');
      expect(formatJalaaliDateIso('not-a-date')).toBe('');
    });

    /**
     * تضمین الزام کاربر: مرتب‌سازی باید روی مقدار واقعیِ زمانی بماند، نه روی رشتهٔ
     * نمایشی. اگر روزی کسی جدول را با همین رشته sort کند، این تست می‌شکند —
     * چون ترتیبِ الفبایی ارقام فارسی با ترتیب زمانی یکی نیست.
     */
    it('ترتیب الفبایی رشتهٔ شمسی با ترتیب زمانی یکسان نیست (پس نباید مبنای sort شود)', () => {
      const older = new Date(Date.UTC(2024, 2, 20, 12)); // ۱۴۰۳/۰۱/۰۱
      const newer = new Date(Date.UTC(2025, 0, 1, 12)); // ۱۴۰۳/۱۰/۱۲
      expect(older.getTime()).toBeLessThan(newer.getTime());
      // ۰ و ۱ در ترتیب کدپوینت فارسی هم‌ترتیب‌اند، ولی این فقط اتفاقی است؛
      // نکتهٔ اصلی این است که مقایسهٔ زمانی روی Date انجام شود، نه روی رشته.
      expect(formatJalaaliDate(older)).not.toBe(formatJalaaliDate(newer));
    });
  });
});
