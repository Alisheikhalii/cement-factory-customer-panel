import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Role, type AuthUser } from '@cement/shared-types';
import { AppException } from '../../../common/exceptions/app.exception';

/**
 * Guard مسیرهای مشتری (بخش ۶.۲ PRD — مهم‌ترین قانون امنیتی).
 *
 * تضمین می‌کند:
 *  1. فقط نقش CUSTOMER به مسیرهای داده‌ی مشتری دسترسی دارد (ادمین رد می‌شود).
 *  2. توکن دارای `customerId` معتبر است.
 *
 * ⚠️ خودِ Data Scoping (فیلتر Query بر اساس customerId) در سرویس‌ها با استفاده از
 * `@CurrentUser().customerId` انجام می‌شود، نه از پارامتر URL/Body. این Guard تضمین
 * می‌کند که customerId قابل‌اعتماد (از JWT) همیشه موجود است.
 */
@Injectable()
export class CustomerScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role !== Role.CUSTOMER || !user.customerId) {
      throw new AppException('AUTH_004');
    }
    return true;
  }
}
