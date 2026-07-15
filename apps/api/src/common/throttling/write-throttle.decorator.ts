import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Rate Limiting سخت‌گیرانه‌تر برای مسیرهای Write (بخش ۱۳ PRD:
 * «Rate Limiting روی Login و فرم‌های Write»).
 *
 * سقف عمومی برنامه ۱۲۰ درخواست در دقیقه است؛ این دکوراتور روی هندلرهای
 * تغییردهنده‌ی وضعیت (POST/PATCH/PUT/DELETE) آن را به ۲۰ درخواست در دقیقه
 * به‌ازای هر IP کاهش می‌دهد. کلید محدودیت شامل مسیر است، پس هر endpoint
 * سهمیه‌ی مستقل خود را دارد.
 */
export const WRITE_THROTTLE_TTL_MS = 60_000;
export const WRITE_THROTTLE_LIMIT = 20;

export const WriteThrottle = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    Throttle({
      default: { ttl: WRITE_THROTTLE_TTL_MS, limit: WRITE_THROTTLE_LIMIT },
    }),
  );
