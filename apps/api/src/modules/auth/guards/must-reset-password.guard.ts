import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthUser } from '@cement/shared-types';
import { AppException } from '../../../common/exceptions/app.exception';
import { ALLOW_PASSWORD_RESET_KEY } from '../decorators/allow-password-reset.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * لایهٔ دوم اجبار به تغییر رمز اولیه (BR-26).
 *
 * ریدایرکت سمت Frontend تنها یک راهنمایی است؛ کاربر می‌تواند مستقیماً API را صدا
 * بزند. این Guard سراسری، تا وقتی `mustResetPassword=true` است، هر مسیر دیگری جز
 * تغییر رمز را با `AUTH_006` (۴۰۳) رد می‌کند.
 *
 * ⚠️ ترتیب اجرا مهم است: این Guard باید *بعد از* JwtAuthGuard ثبت شود تا
 * `request.user` پر شده باشد. در AuthModule دقیقاً پس از آن ثبت شده است.
 * اگر کاربری روی Request نباشد، تصمیم‌گیری به JwtAuthGuard واگذار می‌شود
 * (مسیر عمومی است یا خودش ۴۰۱ می‌دهد).
 */
@Injectable()
export class MustResetPasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_RESET_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (request.user?.mustResetPassword) {
      throw new AppException('AUTH_006');
    }
    return true;
  }
}
