import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { initSentry } from './common/observability/sentry.util';

async function bootstrap(): Promise<void> {
  // فاز ۷: رهگیری خطا (فقط وقتی SENTRY_DSN تنظیم شده باشد؛ وگرنه no-op).
  initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  // سخت‌سازی هدرهای امنیتی (بخش ۱۳ PRD — Helmet). CSP طوری تنظیم شده که
  // Swagger UI روی /api (اسکریپت/استایل inline) همچنان کار کند.
  // فاز ۷: HSTS در Production فعال است (پشت TLS/Reverse Proxy) تا مرورگر همیشه
  // HTTPS را نگه دارد؛ در توسعه (HTTP محلی) خاموش می‌ماند.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
        },
      },
      strictTransportSecurity:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31_536_000, includeSubDomains: true }
          : false,
      // اجازه بارگیری منابع Swagger از همان مبدا هنگام باز شدن در تب جدید
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // خواندن Refresh Token از Cookie httpOnly (بخش ۶.۱)
  app.use(cookieParser());

  // همه مسیرها زیر /api/v1 (بخش ۱۱ PRD)
  app.setGlobalPrefix('api/v1');

  // DTO Validation سراسری (instruction.md §3): ورودی نامعتبر رد می‌شود
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // فرمت خطای یکدست (بخش ۱۱.۱۱)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // پیچیدن پاسخ‌های موفق در { success, data } (بخش ۱۱.۱۱)
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS برای Frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Swagger (بخش ۳.۲ PRD)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('پورتال سیمان خاکستری نی‌ریز — API')
    .setDescription('مستندات API پورتال مشتریان و داشبورد ادمین')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
