import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { RedisThrottlerStorage } from './common/throttling/redis-throttler.storage';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './common/repositories/repositories.module';
import { CommonServicesModule } from './common/common-services.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ErpIntegrationModule } from './modules/erp-integration/erp-integration.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { LoadingRequestsModule } from './modules/loading-requests/loading-requests.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { FinanceModule } from './modules/finance/finance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { AdminModule } from './modules/admin/admin.module';
import { PublicContactModule } from './modules/public-contact/public-contact.module';
import { HealthController } from './health/health.controller';

/**
 * ماژول ریشه برنامه.
 * فاز ۲: ماژول‌های خواندنی سفارشات/اعلام‌بار/تحویل/مالی/داشبورد اضافه شدند.
 * فاز ۳: هسته نوشتن اعلام بار (State Machine + BR-04..BR-11) و ماژول اعلانات (بخش ۱۷).
 * فاز ۴: نظرسنجی و شکایات سمت مشتری.
 * فاز ۴.۵: داشبورد ادمین/Command Center (بخش ۹.۹ / ۱۱.۱۰).
 * فاز ۵.۵: فرم تماس عمومی لندینگ پیج (بخش ۹.۱۰.۴) — مستقل از Auth/DB.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    // Rate Limiting سراسری (بخش ۱۳ PRD). سقف عمومی سخاوتمندانه برای همه مسیرها
    // (شامل خواندنی‌ها)؛ روی مسیرهای Write با @WriteThrottle سخت‌گیرانه‌تر می‌شود
    // و روی /public/contact با override به ۳ درخواست در ساعت محدود می‌گردد.
    // فاز ۷: شمارش در Redis (مشترک بین Instanceها، مقاوم به ری‌استارت) —
    // با Fail-open در قطعی Redis (جزئیات در RedisThrottlerStorage).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        storage: new RedisThrottlerStorage(config),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // در توسعه Pretty، در Production JSON خام (بخش ۱۳ PRD)
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
      },
    }),
    PrismaModule,
    RepositoriesModule,
    CommonServicesModule,
    NotificationsModule,
    ErpIntegrationModule,
    AuthModule,
    OrdersModule,
    LoadingRequestsModule,
    DeliveriesModule,
    FinanceModule,
    DashboardModule,
    ComplaintsModule,
    SurveysModule,
    AdminModule,
    PublicContactModule,
  ],
  controllers: [HealthController],
  providers: [
    // ThrottlerGuard سراسری — قبل از منطق کنترلرها اجرا می‌شود و همه مسیرها را
    // در برابر سیل درخواست محافظت می‌کند (بخش ۱۳ PRD).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
