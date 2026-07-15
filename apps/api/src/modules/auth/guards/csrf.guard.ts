import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { AppException } from '../../../common/exceptions/app.exception';

/** نام Cookie نگهدارندهٔ توکن CSRF (غیر httpOnly تا Frontend آن را بخواند). */
export const CSRF_COOKIE = 'csrf_token';
/** نام هدری که Frontend باید توکن را در آن بازپس بفرستد. */
export const CSRF_HEADER = 'x-csrf-token';

/**
 * محافظت CSRF با الگوی Double-Submit Cookie (بخش ۱۳ PRD).
 *
 * توکن هنگام ورود در یک Cookie (غیر httpOnly) و همچنین در Body پاسخ برگردانده می‌شود.
 * در مسیرهای حساس مبتنی بر Cookie (refresh/logout) این Guard بررسی می‌کند که مقدار
 * هدر `X-CSRF-Token` دقیقاً با مقدار Cookie برابر باشد. یک سایت مهاجم می‌تواند مرورگر
 * را وادار به ارسال Cookie کند، اما نمی‌تواند مقدار آن را بخواند یا هدر سفارشی را
 * (که Preflight لازم دارد و CORS ما فقط مبدأ مجاز را می‌پذیرد) تنظیم کند → درخواست رد می‌شود.
 * ناسازگاری یا نبود توکن → AUTH_005.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { cookies?: Record<string, string> }>();

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const rawHeader = req.headers[CSRF_HEADER];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      throw new AppException('AUTH_005');
    }
    return true;
  }
}

/** مقایسهٔ زمان‌ثابت برای جلوگیری از Timing Attack. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ab, bb);
}
