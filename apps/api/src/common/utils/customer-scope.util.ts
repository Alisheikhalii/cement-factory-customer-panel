import type { AuthUser } from '@cement/shared-types';
import { AppException } from '../exceptions/app.exception';

/**
 * استخراج مطمئن customerId از کاربر احرازشده (بخش ۶.۲).
 * اگر کاربر مشتری نباشد یا customerId نداشته باشد، AUTH_004 پرتاب می‌شود.
 * این تنها منبع مجاز customerId در همه ماژول‌های مشتری است — هرگز از Query/Body.
 */
export function requireCustomerId(user: AuthUser): string {
  if (!user.customerId) {
    throw new AppException('AUTH_004');
  }
  return user.customerId;
}
