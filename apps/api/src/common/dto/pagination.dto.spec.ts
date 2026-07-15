// class-validator/class-transformer دکوراتورهای PaginationQueryDto هنگام import
// این ماژول اجرا می‌شوند و به Reflect.getMetadata نیاز دارند؛ polyfill باید اول باشد.
import 'reflect-metadata';
import { resolvePagination } from './pagination.dto';

/**
 * تست نرمال‌سازی صفحه‌بندی مشترک (بخش ۱۱.۱۱ / ۹.۰ — فاز ۷e پوشش).
 */
describe('resolvePagination', () => {
  it('بدون ورودی → پیش‌فرض page=1, pageSize=20', () => {
    expect(resolvePagination({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it('skip از page/pageSize محاسبه می‌شود', () => {
    expect(resolvePagination({ page: 3, pageSize: 10 })).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10,
    });
  });

  it('مقادیر صفر/منفی به پیش‌فرض بازمی‌گردند (دفاع در عمق پس از ValidationPipe)', () => {
    expect(resolvePagination({ page: 0, pageSize: -5 })).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });
});
