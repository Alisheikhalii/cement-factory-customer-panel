import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '@cement/shared-types';

/**
 * استخراج کاربر احرازشده از Request (که JwtStrategy تزریق کرده).
 * استفاده: `@CurrentUser() user: AuthUser` در امضای کنترلر.
 *
 * ⚠️ قانون حیاتی امنیتی (بخش ۶.۲): برای Data Scoping همیشه از `user.customerId`
 * این‌جا استفاده کنید، نه از پارامتر URL/Body.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
