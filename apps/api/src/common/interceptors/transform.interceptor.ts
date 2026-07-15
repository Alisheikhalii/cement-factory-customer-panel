import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiSuccessResponse } from '@cement/shared-types';
import { ResponseWithMeta } from '../http/response-with-meta';

/**
 * پیچیدن همه پاسخ‌های موفق در قالب استاندارد بخش ۱۱.۱۱ PRD.
 * - مقدار خام دامنه → `{ success: true, data }`.
 * - `ResponseWithMeta` → `{ success: true, data, meta }` (برای لیست‌های صفحه‌بندی‌شده).
 * خطاها توسط GlobalExceptionFilter به `{ success: false, error }` تبدیل می‌شوند.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((payload): ApiSuccessResponse<T> => {
        if (payload instanceof ResponseWithMeta) {
          return {
            success: true,
            data: payload.data as T,
            ...(payload.meta ? { meta: payload.meta } : {}),
          };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
