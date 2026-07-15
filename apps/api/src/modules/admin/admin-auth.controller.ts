import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import type { LoginResponse } from '@cement/shared-types';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { CSRF_COOKIE } from '../auth/guards/csrf.guard';
import { AdminLoginDto } from '../auth/dto/admin-login.dto';

const REFRESH_COOKIE = 'refresh_token';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * کنترلر ورود ادمین (بخش ۶.۲ و ۱۱.۱۰ PRD). مسیر: /api/v1/admin/login
 * جدا از ورود مشتری؛ فقط کاربران role=ADMIN اجازه ورود دارند.
 * سایر مسیرهای /admin/* (کارتابل، مشتریان، ...) در فاز ۴.۵ اضافه می‌شوند.
 */
@ApiTags('admin')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود ادمین (username + password، role=ADMIN)' })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.loginAdmin(dto.username, dto.password);

    const user = await this.auth.findUserForCookie(dto.username);
    if (user) {
      res.cookie(REFRESH_COOKIE, this.auth.signRefreshToken(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: SESSION_COOKIE_MAX_AGE,
      });
    }

    // توکن CSRF برای الگوی Double-Submit Cookie (بخش ۱۳ PRD) — Cookie غیر httpOnly
    // + مقدار در Body تا Frontend در هدر X-CSRF-Token بازپس بفرستد.
    const csrfToken = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    return { ...result, csrfToken };
  }
}
