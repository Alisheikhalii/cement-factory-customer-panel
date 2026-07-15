import {
  computeRequestDate,
  isWithinRequestWindow,
  REQUEST_CUTOFF_HOUR,
} from './loading-request-deadline.util';

/**
 * تست BR-04 با ساعت Mock‌شده (بخش ۱۸: نباید منتظر ساعت واقعی بماند).
 * لحظه‌ها را با offset ایران (+03:30) می‌سازیم تا ساعت محلی ایران کنترل‌شده باشد.
 */

/** یک لحظه UTC که معادل ساعت/دقیقه دلخواه «به وقت ایران» در تاریخ ۱۴۰۳/... باشد. */
function iranMoment(
  y: number,
  m: number,
  d: number,
  iranHour: number,
  iranMinute = 0,
): Date {
  // ساعت ایران = UTC + 3:30 → UTC = ساعت ایران − 3:30.
  const utcMs = Date.UTC(y, m - 1, d, iranHour, iranMinute) - (3 * 60 + 30) * 60 * 1000;
  return new Date(utcMs);
}

describe('BR-04 — مهلت ثبت درخواست (loading-request-deadline.util)', () => {
  it('ساعت مرز ۱۵ است', () => {
    expect(REQUEST_CUTOFF_HOUR).toBe(15);
  });

  describe('isWithinRequestWindow', () => {
    it('قبل از ۱۵:۰۰ ایران → مجاز', () => {
      expect(isWithinRequestWindow(iranMoment(2025, 6, 10, 14, 59))).toBe(true);
    });

    it('صبح زود → مجاز', () => {
      expect(isWithinRequestWindow(iranMoment(2025, 6, 10, 8, 0))).toBe(true);
    });

    it('دقیقاً ۱۵:۰۰ ایران → مهلت تمام (غیرمجاز)', () => {
      expect(isWithinRequestWindow(iranMoment(2025, 6, 10, 15, 0))).toBe(false);
    });

    it('بعد از ۱۵:۰۰ ایران → غیرمجاز', () => {
      expect(isWithinRequestWindow(iranMoment(2025, 6, 10, 18, 30))).toBe(false);
    });
  });

  describe('computeRequestDate — همیشه «فردا»', () => {
    it('تاریخ درخواستی ۲۴ ساعت بعد از نیمه‌شب امروز ایران است', () => {
      const now = iranMoment(2025, 6, 10, 10, 0);
      const requestDate = computeRequestDate(now);
      // نیمه‌شب امروز ایران بر حسب UTC:
      const todayMidnightIranUtc =
        Date.UTC(2025, 5, 10, 0, 0) - (3 * 60 + 30) * 60 * 1000;
      const expected = todayMidnightIranUtc + 24 * 60 * 60 * 1000;
      expect(requestDate.getTime()).toBe(expected);
    });

    it('نزدیک نیمه‌شب ایران هم «فردا» را درست می‌دهد (نه پس‌فردا)', () => {
      const now = iranMoment(2025, 6, 10, 23, 45);
      const requestDate = computeRequestDate(now);
      const todayMidnightIranUtc =
        Date.UTC(2025, 5, 10, 0, 0) - (3 * 60 + 30) * 60 * 1000;
      const expected = todayMidnightIranUtc + 24 * 60 * 60 * 1000;
      expect(requestDate.getTime()).toBe(expected);
    });
  });
});
