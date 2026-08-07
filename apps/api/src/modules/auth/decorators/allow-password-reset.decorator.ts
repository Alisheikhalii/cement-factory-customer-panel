import { SetMetadata } from '@nestjs/common';

/** کلید Metadata برای مسیرهای مجاز در حالت «اجبار به تغییر رمز». */
export const ALLOW_PASSWORD_RESET_KEY = 'allowWhilePasswordReset';

/**
 * مسیرهایی که حتی وقتی `mustResetPassword=true` است باید در دسترس بمانند
 * (بخش BR-26). عملاً فقط خودِ تغییر رمز؛ در غیر این صورت کاربر در بن‌بست
 * می‌افتد: نمی‌تواند رمز را عوض کند چون مسیرش هم بسته است.
 *
 * استفاده: `@AllowWhilePasswordReset()` بالای متد یا کنترلر.
 * توجه: مسیرهای `@Public()` خودبه‌خود مستثنا هستند و نیازی به این دکوراتور ندارند.
 */
export const AllowWhilePasswordReset = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_PASSWORD_RESET_KEY, true);
