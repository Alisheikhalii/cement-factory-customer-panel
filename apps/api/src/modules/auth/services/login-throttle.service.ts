import { Injectable } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  /** زمان اولین تلاش ناموفق در پنجره فعلی (ms) */
  windowStart: number;
  /** تا این زمان قفل است (ms epoch) یا null */
  lockedUntil: number | null;
}

/**
 * محدودسازی تلاش ورود (بخش ۹.۱ PRD): حداکثر ۵ تلاش ناموفق در ۱۵ دقیقه،
 * سپس قفل موقت ۱۵ دقیقه‌ای حساب.
 *
 * ⚠️ پیاده‌سازی فاز ۱ درون‌حافظه‌ای است (تک‌نمونه). در فاز ۷ (سخت‌سازی) طبق
 * بخش ۱۳.۱ به Redis منتقل می‌شود تا در استقرار چندنمونه‌ای هم درست کار کند.
 * کلید = username (کد ملی برای مشتری، شناسه ادمین).
 */
@Injectable()
export class LoginThrottleService {
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;
  private readonly lockMs = 15 * 60 * 1000;
  private readonly store = new Map<string, AttemptRecord>();

  /** آیا این کلید هم‌اکنون قفل است؟ (قبل از بررسی رمز فراخوانی می‌شود) */
  isLocked(key: string, now: number): boolean {
    const record = this.store.get(key);
    if (!record?.lockedUntil) {
      return false;
    }
    if (now >= record.lockedUntil) {
      // قفل منقضی شده؛ پاک‌سازی
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** ثبت تلاش ناموفق؛ در صورت عبور از سقف، حساب را قفل می‌کند. */
  registerFailure(key: string, now: number): void {
    const record = this.store.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now, lockedUntil: null });
      return;
    }

    record.count += 1;
    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockMs;
    }
    this.store.set(key, record);
  }

  /** ورود موفق: شمارنده پاک می‌شود. */
  reset(key: string): void {
    this.store.delete(key);
  }
}
