import type { ApiMeta } from '@cement/shared-types';

/**
 * پوششی برای پاسخ‌هایی که علاوه بر data باید meta (صفحه‌بندی، بخش ۱۱.۱۱) هم برگردانند.
 * کنترلر این را برمی‌گرداند و TransformInterceptor آن را به
 * `{ success, data, meta }` تبدیل می‌کند. اگر کنترلر مقدار خام برگرداند،
 * فقط `{ success, data }` ساخته می‌شود.
 */
export class ResponseWithMeta<T> {
  constructor(
    readonly data: T,
    readonly meta?: ApiMeta,
  ) {}
}

/** ساخت meta استاندارد صفحه‌بندی. */
export function buildMeta(page: number, pageSize: number, total: number): ApiMeta {
  return { page, pageSize, total };
}
