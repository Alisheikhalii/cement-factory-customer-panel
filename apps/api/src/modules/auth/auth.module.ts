import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from '../admin/admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoginThrottleService } from './services/login-throttle.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';

/**
 * ماژول احراز هویت (بخش ۶ PRD).
 * JwtAuthGuard را به‌صورت سراسری (APP_GUARD) ثبت می‌کند تا همه مسیرها به‌صورت
 * پیش‌فرض محافظت شوند؛ مسیرهای عمومی با @Public() استثنا می‌شوند.
 * secret ها هنگام sign/verify صریحاً پاس داده می‌شوند (دو Secret مجزا Access/Refresh).
 */
@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PasswordService,
    LoginThrottleService,
    OtpService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
