import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import type {
  AuthUser,
  ForgotPasswordResponse,
  LoginResponse,
  RefreshResponse,
} from '@cement/shared-types';
import { AuthService } from './auth.service';
import { AllowWhilePasswordReset } from './decorators/allow-password-reset.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { CsrfGuard, CSRF_COOKIE } from './guards/csrf.guard';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

/** نام Cookie نگهدارنده Refresh Token (بخش ۶.۱ PRD). */
const REFRESH_COOKIE = 'refresh_token';
/** طول عمر مشترک Cookieهای نشست (۷ روز). */
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

/**
 * Cookie توکن CSRF (بخش ۱۳ PRD). برخلاف Refresh، این Cookie httpOnly نیست تا
 * Frontend بتواند مقدار را (که در Body ورود هم برگردانده می‌شود) در هدر
 * `X-CSRF-Token` بازپس بفرستد. الگوی Double-Submit Cookie در CsrfGuard بررسی می‌شود.
 */
function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * کنترلر احراز هویت مشتری (بخش ۱۱.۱ PRD). مسیر پایه: /api/v1/auth
 * Access Token در Body، Refresh Token در Cookie httpOnly.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود مشتری با کد ملی + رمز عبور' })
  async login(
    @Body() dto: CustomerLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.loginCustomer(dto.nationalId, dto.password);
    const csrfToken = await this.issueSessionCookies(dto.nationalId, res);
    return { ...result, csrfToken };
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تمدید Access Token از روی Refresh Cookie (نیازمند هدر CSRF)' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const token = this.readRefreshCookie(req);
    const result = await this.auth.refresh(token);
    // توکن CSRF نشست ثابت می‌ماند؛ Cookie تمدید می‌شود تا با عمر نشست هم‌راستا بماند.
    const csrfToken = this.readCsrfCookie(req) ?? generateCsrfToken();
    setCsrfCookie(res, csrfToken);
    return { ...result, csrfToken };
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ابطال Refresh Token (پاک‌سازی Cookie، نیازمند هدر CSRF)' })
  logout(@Res({ passthrough: true }) res: Response): { loggedOut: true } {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.clearCookie(CSRF_COOKIE, { path: '/api/v1/auth' });
    return { loggedOut: true };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ارسال OTP به موبایل ثبت‌شده (شناسایی با کد ملی)' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return this.auth.forgotPassword(dto.nationalId);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تایید OTP + تنظیم رمز جدید' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ reset: true }> {
    await this.auth.resetPassword(dto.nationalId, dto.otp, dto.newPassword);
    return { reset: true };
  }

  @Patch('change-password')
  // تنها مسیری که در حالت «اجبار به تغییر رمز اولیه» باز می‌ماند (BR-26)؛
  // در غیر این صورت کاربر در بن‌بست می‌افتد.
  @AllowWhilePasswordReset()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغییر رمز (کاربر لاگین‌شده)' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ changed: true }> {
    await this.auth.changePassword(user.userId, dto.currentPassword, dto.newPassword);
    return { changed: true };
  }

  /** صدور Cookieهای نشست (Refresh httpOnly + CSRF) و بازگرداندن توکن CSRF برای Body. */
  private async issueSessionCookies(username: string, res: Response): Promise<string> {
    const user = await this.auth.findUserForCookie(username);
    if (user) {
      setRefreshCookie(res, this.auth.signRefreshToken(user));
    }
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);
    return csrfToken;
  }

  private readRefreshCookie(req: Request): string | undefined {
    return this.readCookie(req, REFRESH_COOKIE);
  }

  private readCsrfCookie(req: Request): string | undefined {
    return this.readCookie(req, CSRF_COOKIE);
  }

  private readCookie(req: Request, name: string): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[name];
  }
}
