import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { type Response } from 'express';
import { ERROR_CODES, type ApiErrorResponse } from '@cement/shared-types';
import { AppException } from '../exceptions/app.exception';
import { captureException } from '../observability/sentry.util';

/**
 * Global Exception Filter — بخش ۴.۱ و ۱۱.۱۱ PRD.
 * همه خطاها را به فرمت یکدست { success:false, error:{code, message} } تبدیل می‌کند.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { httpStatus, code, message } = this.resolve(exception);

    if (httpStatus >= 500) {
      this.logger.error(
        `[${code}] ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // فاز ۷: خطاهای ۵xx (پیش‌بینی‌نشده) به Sentry هم گزارش می‌شوند — اگر فعال باشد.
      captureException(exception);
    } else {
      this.logger.warn(`[${code}] ${message}`);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message },
    };

    response.status(httpStatus).json(body);
  }

  private resolve(exception: unknown): {
    httpStatus: number;
    code: string;
    message: string;
  } {
    if (exception instanceof AppException) {
      return {
        httpStatus: exception.httpStatus,
        code: exception.code,
        message: exception.message,
      };
    }

    // خطاهای اعتبارسنجی/HTTP استاندارد NestJS (مثلاً از ValidationPipe)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : this.extractMessage(res) ?? exception.message;
      return {
        httpStatus: status,
        code: `HTTP_${status}`,
        message,
      };
    }

    // خطای پیش‌بینی‌نشده
    return {
      httpStatus: ERROR_CODES.GENERIC_500.httpStatus,
      code: ERROR_CODES.GENERIC_500.code,
      message: ERROR_CODES.GENERIC_500.message,
    };
  }

  private extractMessage(res: object): string | undefined {
    const maybe = res as { message?: unknown };
    if (Array.isArray(maybe.message)) {
      return maybe.message.map((m) => String(m)).join('؛ ');
    }
    if (typeof maybe.message === 'string') {
      return maybe.message;
    }
    return undefined;
  }
}
