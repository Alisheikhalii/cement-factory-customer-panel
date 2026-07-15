import {
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AppException } from '../../../common/exceptions/app.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard سراسری احراز هویت (بخش ۶.۱ PRD).
 * همه مسیرها را محافظت می‌کند مگر آن‌هایی که با `@Public()` علامت خورده‌اند.
 * توکن نامعتبر/منقضی → AUTH_003.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new AppException('AUTH_003');
    }
    return user;
  }
}
