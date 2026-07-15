import { Injectable } from '@nestjs/common';
import type { ContactMessageInput, ContactMessageResponse } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { MailerService } from '../../common/services/mailer.service';

/**
 * سرویس فرم تماس عمومی (بخش ۹.۱۰.۴).
 *
 * اصل استقلال (۹.۱۰.۱): این بخش کاملاً از دیتابیس/AuditLog/RBAC پروژه جداست؛
 * پیام فقط به‌صورت ایمیل به آدرس رسمی کارخانه ارسال می‌شود و هیچ رکوردی در DB
 * ساخته نمی‌شود.
 *
 * Rate Limiting (بخش ۹.۱۰.۴ + CONTACT_001): چون Endpoint بدون Auth است، برای
 * جلوگیری از Spam، تعداد ارسال از هر IP در یک پنجرهٔ زمانی محدود می‌شود. پیاده‌سازی
 * درون‌حافظه‌ای و ساده است (کافی برای یک نمونه؛ در Production پشت Reverse Proxy با
 * Rate Limit سطح Edge و/یا `@nestjs/throttler` با Redis تقویت می‌شود — فاز ۷).
 */
@Injectable()
export class PublicContactService {
  /** حداکثر پیام مجاز از هر IP در پنجرهٔ زمانی. */
  private readonly MAX_PER_WINDOW = 3;
  /** طول پنجرهٔ Rate Limit بر حسب میلی‌ثانیه (۱۰ دقیقه). */
  private readonly WINDOW_MS = 10 * 60 * 1000;
  /** سقف نرم تعداد IP ردگیری‌شده؛ عبور از آن، پاک‌سازی رکوردهای منقضی را فعال می‌کند. */
  private readonly MAX_TRACKED_IPS = 10_000;
  /** زمان ارسال‌های اخیر به تفکیک IP (برای Rate Limiting درون‌حافظه‌ای). */
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly mailer: MailerService) {}

  /**
   * ثبت (=ارسال ایمیل) پیام تماس. `now` تزریق‌پذیر برای تست پنجرهٔ Rate Limit.
   * خطای CONTACT_001 وقتی سقف پنجره رد شود.
   */
  async submit(
    input: ContactMessageInput,
    ip: string,
    now: number = Date.now(),
  ): Promise<ContactMessageResponse> {
    this.enforceRateLimit(ip, now);

    const recipient = process.env.CONTACT_FORM_RECIPIENT ?? 'info@nyrizcement.example';
    const replyTo = this.looksLikeEmail(input.phoneOrEmail)
      ? input.phoneOrEmail
      : undefined;

    await this.mailer.send({
      to: recipient,
      // نام کاربر در سرآیند Subject می‌رود؛ کاراکترهای کنترلی (CR/LF) حذف می‌شوند تا
      // وقتی MailerService به SMTP واقعی (nodemailer) وصل شد، امکان Email Header
      // Injection وجود نداشته باشد. DTO فقط طول را چک می‌کند، نه CR/LF.
      subject: `پیام جدید از فرم تماس سایت — ${stripControlChars(input.name)}`,
      text: [
        `نام: ${input.name}`,
        `راه ارتباطی: ${input.phoneOrEmail}`,
        '',
        'متن پیام:',
        input.message,
      ].join('\n'),
      replyTo: replyTo ? stripControlChars(replyTo) : undefined,
    });

    return { sent: true };
  }

  /** آیا رشته شبیه ایمیل است؟ (برای تنظیم Reply-To؛ اعتبارسنجی سخت‌گیرانه لازم نیست). */
  private looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  /** اعمال Rate Limit درون‌حافظه‌ای؛ در صورت عبور از سقف → CONTACT_001. */
  private enforceRateLimit(ip: string, now: number): void {
    const windowStart = now - this.WINDOW_MS;
    // پاک‌سازی فرصت‌طلبانهٔ IPهای منقضی تا نقشهٔ درون‌حافظه‌ای روی Endpoint عمومیِ
    // بدون Auth بی‌نهایت رشد نکند (نشت حافظه). فقط وقتی از سقف نرم عبور کند.
    if (this.hits.size > this.MAX_TRACKED_IPS) {
      for (const [key, times] of this.hits) {
        const live = times.filter((t) => t > windowStart);
        if (live.length === 0) {
          this.hits.delete(key);
        } else {
          this.hits.set(key, live);
        }
      }
    }
    const recent = (this.hits.get(ip) ?? []).filter((t) => t > windowStart);
    if (recent.length >= this.MAX_PER_WINDOW) {
      this.hits.set(ip, recent);
      throw new AppException('CONTACT_001');
    }
    recent.push(now);
    this.hits.set(ip, recent);
  }
}

/**
 * حذف کاراکترهای کنترلی (CR/LF و سایر C0/DEL) از مقادیری که در سرآیند ایمیل قرار
 * می‌گیرند — پیشگیری از Email Header Injection. با مقایسهٔ کد نویسه پیاده شده تا
 * هیچ کاراکتر کنترلیِ نامرئی در سورس ذخیره نشود.
 */
function stripControlChars(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) {
      out += ch;
    }
  }
  return out.trim();
}
