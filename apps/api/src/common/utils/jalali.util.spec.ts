import { Prisma } from '@prisma/client';
import {
  currentJalaaliMonthStart,
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
});
