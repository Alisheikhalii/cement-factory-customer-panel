import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtPayload } from '@cement/shared-types';
import { AppException } from '../../../common/exceptions/app.exception';
import { UserRepository } from '../../../common/repositories/user.repository';
import { toSharedRole } from '../../../common/utils/role.util';

/**
 * استراتژی احراز هویت با Access Token (Header: Authorization: Bearer).
 * پس از تایید امضا، کاربر را از DB بارگذاری می‌کند تا مطمئن شود هنوز فعال و
 * حذف‌نشده است؛ سپس AuthUser امن را به Request تزریق می‌کند.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET تعریف نشده است');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      // حساب حذف/غیرفعال شده حتی با توکن معتبر رد می‌شود
      throw new AppException('AUTH_003');
    }
    if (user.customer && !user.customer.isActive) {
      throw new UnauthorizedException('حساب مشتری غیرفعال است');
    }

    return {
      userId: user.id,
      username: user.username,
      role: toSharedRole(user.role),
      customerId: user.customerId,
      fullName: user.fullName,
      mustResetPassword: user.mustResetPassword,
    };
  }
}
