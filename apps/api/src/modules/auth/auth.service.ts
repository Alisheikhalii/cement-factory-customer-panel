import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { AuthUser, JwtPayload, LoginResponse } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import {
  UserRepository,
  type UserWithCustomer,
} from '../../common/repositories/user.repository';
import { toSharedRole } from '../../common/utils/role.util';
import { LoginThrottleService } from './services/login-throttle.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';

/**
 * نتیجهٔ داخلی ورود/تمدید در لایهٔ سرویس: توکن دسترسی + کاربر.
 * `csrfToken` مسئولیت لایهٔ Controller است (Double-Submit Cookie، بخش ۱۳ PRD)،
 * چون سرویس از Cookie/Response بی‌خبر است.
 */
export type AuthTokens = Omit<LoginResponse, 'csrfToken'>;

/**
 * سرویس احراز هویت (بخش ۶ و ۱۱.۱ PRD).
 * مسئول ورود مشتری/ادمین، صدور JWT، تمدید، تغییر/بازیابی رمز.
 * هیچ‌گاه مستقیماً PrismaClient تزریق نمی‌کند (از UserRepository استفاده می‌کند).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly throttle: LoginThrottleService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** ورود مشتری با کد ملی (Username). */
  loginCustomer(nationalId: string, password: string): Promise<AuthTokens> {
    return this.authenticate(nationalId, password, Role.CUSTOMER);
  }

  /** ورود ادمین با شناسه دلخواه. */
  loginAdmin(username: string, password: string): Promise<AuthTokens> {
    return this.authenticate(username, password, Role.ADMIN);
  }

  /**
   * هسته مشترک ورود: بررسی قفل، اعتبار رمز، تطابق نقش، صدور توکن.
   * پیام خطای یکسان برای «کاربر ناموجود» و «رمز غلط» تا فیلد اشتباه افشا نشود (بخش ۹.۱).
   */
  private async authenticate(
    username: string,
    password: string,
    expectedRole: Role,
  ): Promise<AuthTokens> {
    const now = Date.now();

    if (this.throttle.isLocked(username, now)) {
      throw new AppException('AUTH_002');
    }

    const user = await this.users.findByUsername(username);
    const passwordOk =
      user !== null && (await this.passwords.compare(password, user.passwordHash));

    // نقش باید دقیقاً مطابق مسیر ورود باشد: مشتری از /auth/login، ادمین از /admin/login
    if (!user || !passwordOk || user.role !== expectedRole) {
      this.throttle.registerFailure(username, now);
      throw new AppException('AUTH_001');
    }

    // `isDeleted` مشتری هم بررسی می‌شود: حذف نرم مشتری، User را غیرفعال می‌کند اما
    // اگر روزی حساب دستی فعال شود، مشتریِ حذف‌شده نباید از این مسیر وارد شود.
    if (
      !user.isActive ||
      (user.customer && (!user.customer.isActive || user.customer.isDeleted))
    ) {
      throw new AppException('AUTH_001');
    }

    this.throttle.reset(username);
    await this.users.markLoggedIn(user.id, new Date(now));

    return {
      accessToken: this.signAccessToken(user),
      user: this.toAuthUser(user),
    };
  }

  /** تمدید Access Token از روی Refresh Token معتبر. */
  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new AppException('AUTH_003');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.requireSecret('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new AppException('AUTH_003');
    }

    const user = await this.users.findById(payload.sub);
    if (
      !user ||
      !user.isActive ||
      (user.customer && (!user.customer.isActive || user.customer.isDeleted))
    ) {
      throw new AppException('AUTH_003');
    }

    return {
      accessToken: this.signAccessToken(user),
      user: this.toAuthUser(user),
    };
  }

  /** تغییر رمز کاربر لاگین‌شده (نیازمند رمز فعلی). */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppException('AUTH_003');
    }
    const ok = await this.passwords.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppException('AUTH_001');
    }
    const hash = await this.passwords.hash(newPassword);
    await this.users.updatePassword(user.id, hash);
  }

  /**
   * شروع فراموشی رمز: شناسایی با کد ملی → صدور OTP به موبایل ثبت‌شده.
   * برای جلوگیری از افشای وجود/نبود حساب، همیشه پاسخ موفق با موبایل Mask‌شده
   * و هم‌فرمت برمی‌گردد؛ اگر حساب نبود، یک Mask جعلیِ قطعی و هم‌شکل (`...####`)
   * تولید می‌شود تا شکل پاسخ برای حساب موجود/ناموجود یکسان بماند (ضدشمارش).
   */
  async forgotPassword(nationalId: string): Promise<{ maskedMobile: string }> {
    const user = await this.users.findByUsername(nationalId);
    const now = Date.now();

    if (user?.customer?.mobile && user.role === Role.CUSTOMER) {
      this.otp.issue(nationalId, user.customer.mobile, now);
      return { maskedMobile: this.otp.maskMobile(user.customer.mobile) };
    }
    // پاسخ خنثی اما هم‌فرمت با حالت واقعی (بدون افشای نبود حساب)
    return { maskedMobile: this.otp.pseudoMask(nationalId) };
  }

  /** تایید OTP و تنظیم رمز جدید. */
  async resetPassword(nationalId: string, otp: string, newPassword: string): Promise<void> {
    const now = Date.now();
    if (!this.otp.verify(nationalId, otp, now)) {
      throw new AppException('AUTH_001', 'کد تایید نامعتبر یا منقضی شده است');
    }
    const user = await this.users.findByUsername(nationalId);
    if (!user) {
      throw new AppException('AUTH_003');
    }
    const hash = await this.passwords.hash(newPassword);
    await this.users.updatePassword(user.id, hash);
    this.throttle.reset(nationalId);
  }

  /** صدور Refresh Token (برای قرار گرفتن در Cookie httpOnly توسط کنترلر). */
  signRefreshToken(user: UserWithCustomer): string {
    return this.jwt.sign(this.buildPayload(user), {
      secret: this.requireSecret('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });
  }

  /** ورود مجدد کاربر با username برای گرفتن رکورد کامل (برای کنترلر Cookie). */
  findUserForCookie(username: string): Promise<UserWithCustomer | null> {
    return this.users.findByUsername(username);
  }

  private signAccessToken(user: UserWithCustomer): string {
    return this.jwt.sign(this.buildPayload(user), {
      secret: this.requireSecret('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
  }

  private buildPayload(user: UserWithCustomer): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      role: toSharedRole(user.role),
      customerId: user.customerId,
    };
  }

  private toAuthUser(user: UserWithCustomer): AuthUser {
    return {
      userId: user.id,
      username: user.username,
      role: toSharedRole(user.role),
      customerId: user.customerId,
      fullName: user.fullName,
      mustResetPassword: user.mustResetPassword,
    };
  }

  private requireSecret(key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const secret = this.config.get<string>(key);
    if (!secret) {
      throw new Error(`${key} تعریف نشده است`);
    }
    return secret;
  }
}
