import { BadRequestException, HttpException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { GlobalExceptionFilter } from './global-exception.filter';
import { setSentryForTesting } from '../observability/sentry.util';

/**
 * تست Global Exception Filter (بخش ۱۱.۱۱ — فاز ۷e پوشش).
 * اثبات می‌کند: AppException/HttpException/خطای ناشناخته هر سه به قالب استاندارد
 * تبدیل می‌شوند و فقط خطاهای ≥۵۰۰ به Sentry گزارش می‌شوند.
 */
describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  function run(exception: unknown): { status: number; body: unknown } {
    const result: { status: number; body: unknown } = { status: 0, body: null };
    const response = {
      status: (code: number): { json: (b: unknown) => void } => {
        result.status = code;
        return {
          json: (b: unknown): void => {
            result.body = b;
          },
        };
      },
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    filter.catch(exception, host);
    return result;
  }

  afterEach(() => setSentryForTesting(null));

  it('AppException → کد/پیام/وضعیت خودِ خطا', () => {
    const { status, body } = run(new AppException('AUTH_004'));
    expect(status).toBe(403);
    expect(body).toMatchObject({ success: false, error: { code: 'AUTH_004' } });
  });

  it('HttpException (ValidationPipe) → HTTP_<status> و پیام‌های آرایه‌ای join می‌شوند', () => {
    const { status, body } = run(
      new BadRequestException({ message: ['فیلد الف الزامی است', 'فیلد ب نامعتبر است'] }),
    );
    expect(status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'HTTP_400', message: 'فیلد الف الزامی است؛ فیلد ب نامعتبر است' },
    });
  });

  it('خطای ناشناخته → GENERIC_500 (بدون افشای جزئیات داخلی)', () => {
    const { status, body } = run(new Error('internal secret detail'));
    expect(status).toBe(500);
    const errorBody = body as { error: { code: string; message: string } };
    expect(errorBody.error.code).toBe('GENERIC_500');
    expect(errorBody.error.message).not.toContain('internal secret detail');
  });

  it('فقط ≥۵۰۰ به Sentry گزارش می‌شود', () => {
    const captured: unknown[] = [];
    setSentryForTesting({
      init: (): void => undefined,
      captureException: (e): unknown => {
        captured.push(e);
        return undefined;
      },
    });
    run(new AppException('AUTH_004')); // 403 → نباید گزارش شود
    expect(captured).toHaveLength(0);
    const boom = new Error('boom');
    run(boom); // 500 → گزارش
    expect(captured).toEqual([boom]);
  });

  it('HttpException با پاسخ رشته‌ای هم پشتیبانی می‌شود', () => {
    const { status, body } = run(new HttpException('یافت نشد', 404));
    expect(status).toBe(404);
    expect(body).toMatchObject({ error: { code: 'HTTP_404', message: 'یافت نشد' } });
  });
});
