import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Role, type AuthUser } from '@cement/shared-types';
import { AppException } from '../../../common/exceptions/app.exception';

/**
 * Guard مسیرهای ادمین (بخش ۶.۲ PRD): فقط نقش ADMIN اجازه دارد.
 * روی کنترلرهای زیر پیشوند /admin/* اعمال می‌شود.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role !== Role.ADMIN) {
      throw new AppException('AUTH_004');
    }
    return true;
  }
}
