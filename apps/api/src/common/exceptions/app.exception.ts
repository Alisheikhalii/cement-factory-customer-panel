import { ERROR_CODES, type ErrorCode } from '@cement/shared-types';

/**
 * کلاس پایه تمام خطاهای دامنه‌ای برنامه (بخش ۱۶ PRD).
 * هیچ خطای سفارشی نباید کد/پیام را Hardcode کند؛ همه از ERROR_CODES می‌آیند.
 * GlobalExceptionFilter این را به فرمت استاندارد بخش ۱۱.۱۱ تبدیل می‌کند.
 */
export class AppException extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(errorCode: ErrorCode, overrideMessage?: string) {
    const def = ERROR_CODES[errorCode];
    super(overrideMessage ?? def.message);
    this.name = 'AppException';
    this.code = def.code;
    this.httpStatus = def.httpStatus;
  }
}
