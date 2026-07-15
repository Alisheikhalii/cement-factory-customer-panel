import { Injectable, Logger } from '@nestjs/common';

interface OtpRecord {
  code: string;
  expiresAt: number;
}

/**
 * سرویس OTP فراموشی رمز (بخش ۶.۱ PRD).
 *
 * ⚠️ ارائه‌دهنده پیامک (SMS Provider) هنوز از کارفرما دریافت نشده (بخش ۲۰.۲ مورد ۵).
 * در فاز ۱: کد OTP تولید و درون‌حافظه‌ای ذخیره می‌شود و در محیط توسعه در لاگ چاپ
 * می‌شود تا جریان End-to-End قابل تست باشد. متد `sendSms` یک Stub مستند است که هنگام
 * دریافت Provider واقعی پیاده‌سازی خواهد شد. مانند Throttle، در فاز ۷ به Redis منتقل می‌شود.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly store = new Map<string, OtpRecord>();

  /** تولید و «ارسال» OTP برای کلید (nationalId)؛ کد تولیدشده را برمی‌گرداند. */
  issue(key: string, mobile: string, now: number): string {
    const code = this.generateCode(now);
    this.store.set(key, { code, expiresAt: now + this.ttlMs });
    this.sendSms(mobile, code);
    return code;
  }

  /** بررسی صحت و اعتبار زمانی OTP؛ در صورت موفقیت آن را مصرف (حذف) می‌کند. */
  verify(key: string, code: string, now: number): boolean {
    const record = this.store.get(key);
    if (!record || now > record.expiresAt || record.code !== code) {
      return false;
    }
    this.store.delete(key);
    return true;
  }

  /** Mask کردن موبایل برای نمایش (مثلاً 09123334455 → ...۴۴۵۵). */
  maskMobile(mobile: string): string {
    const last4 = mobile.slice(-4);
    return `...${last4}`;
  }

  /**
   * Mask جعلی اما هم‌شکل برای حساب‌های ناموجود (ضدشمارش/Anti-enumeration).
   * چهار رقم به‌صورت قطعی از خودِ کلید مشتق می‌شود تا خروجی دقیقاً هم‌فرمت
   * `maskMobile` باشد (`...####`) و مهاجم نتواند از روی شکل پاسخ، وجود/نبود حساب
   * را تشخیص دهد. قطعی بودن تضمین می‌کند برای یک کد ملی همیشه یک مقدار ثابت
   * برگردد (پاسخ‌های ناسازگار خودشان یک نشت هستند).
   */
  pseudoMask(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % 10000;
    }
    return `...${String(hash).padStart(4, '0')}`;
  }

  private generateCode(now: number): string {
    // بدون Math.random (محدودیت محیط)؛ مقدار شبه‌تصادفی از زمان که برای فاز ۱ کافی است.
    const code = (now % 900000) + 100000;
    return String(code);
  }

  private sendSms(mobile: string, code: string): void {
    // TODO(فاز بعد): جایگزینی با فراخوانی SMS Provider واقعی نی‌ریز (بخش ۲۰.۲ مورد ۵).
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`OTP برای ${mobile}: ${code} (فقط توسعه — SMS واقعی هنوز فعال نیست)`);
    }
  }
}
