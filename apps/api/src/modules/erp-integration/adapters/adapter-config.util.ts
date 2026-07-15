import type { ConfigService } from '@nestjs/config';

/**
 * ابزارهای مشترک پیکربندی/خطای Adapterهای واقعی ERP (بخش ۱۲.۳ / ۲۰.۲ PRD).
 * همهٔ اتصال‌ها env-driven هستند تا پس از دریافت اطلاعات کارخانه فقط .env تغییر کند.
 */

/** خطای اتصال/تبادل با ERP — جدا از خطای نگاشت داده (ErpMappingError). */
export class ErpConnectionError extends Error {
  constructor(kind: string, operation: string, detail: string) {
    super(`خطای ارتباط با ERP «${kind}» در عملیات ${operation}: ${detail}`);
    this.name = 'ErpConnectionError';
  }
}

/**
 * خواندن متغیرهای الزامی env؛ اگر هرکدام خالی باشد با پیام شفافِ فهرست موارد
 * گم‌شده fail-fast می‌کند (همان هدف اسکلت‌های قبلی، حالا در سطح پیکربندی).
 */
export function requireEnv(
  config: ConfigService,
  kind: string,
  keys: string[],
): Record<string, string> {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const key of keys) {
    const value = config.get<string>(key, '');
    if (value === '') {
      missing.push(key);
    } else {
      values[key] = value;
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `ERP Adapter «${kind}» انتخاب شده اما پیکربندی آن کامل نیست. ` +
        `متغیرهای env گم‌شده: ${missing.join('، ')}. ` +
        'مقادیر اتصال باید توسط کارخانه ارائه شود (بخش ۱۲.۳ و ۲۰.۲ PRD)؛ ' +
        'تا آن زمان از ERP_ADAPTER=mock استفاده کنید.',
    );
  }
  return values;
}
