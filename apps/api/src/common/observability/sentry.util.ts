import { Logger } from '@nestjs/common';

/**
 * اتصال اختیاری Sentry (فاز ۷ — بخش ۱۳ PRD، رهگیری خطا در Production).
 *
 * کاملاً env-driven: اگر `SENTRY_DSN` خالی باشد همهٔ توابع no-op هستند (توسعه/تست
 * بدون وابستگی). بستهٔ `@sentry/node` تنبل require می‌شود (الگوی mssql/ioredis/
 * nodemailer): فعال‌سازی واقعی فقط `pnpm add @sentry/node` + مقدار DSN در .env
 * می‌خواهد — بدون تغییر کد.
 */

const logger = new Logger('Sentry');

interface SentryLike {
  init(options: { dsn: string; environment?: string; tracesSampleRate?: number }): void;
  captureException(exception: unknown): unknown;
}

let sentry: SentryLike | null = null;

/** راه‌اندازی Sentry در bootstrap. بدون DSN یا بدون بسته → غیرفعال با Log شفاف. */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    logger.log('SENTRY_DSN تنظیم نشده — رهگیری خطای Sentry غیرفعال است.');
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require('@sentry/node');
  } catch {
    logger.warn(
      'SENTRY_DSN تنظیم شده اما بستهٔ «@sentry/node» نصب نیست — `pnpm add @sentry/node` را اجرا کنید.',
    );
    return;
  }
  sentry?.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  });
  logger.log('Sentry فعال شد.');
}

/** گزارش استثنا به Sentry (اگر فعال باشد) — برای خطاهای ۵۰۰ در Exception Filter. */
export function captureException(exception: unknown): void {
  sentry?.captureException(exception);
}

/** فقط برای تست: تزریق پیاده‌سازی ساختگی/بازنشانی وضعیت ماژول. */
export function setSentryForTesting(instance: SentryLike | null): void {
  sentry = instance;
}
