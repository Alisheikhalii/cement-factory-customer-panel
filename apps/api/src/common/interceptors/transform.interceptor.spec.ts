import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import { buildMeta, ResponseWithMeta } from '../http/response-with-meta';

/**
 * تست قالب استاندارد پاسخ موفق (بخش ۱۱.۱۱ — فاز ۷e پوشش).
 * مقدار خام → {success, data}؛ ResponseWithMeta → {success, data, meta}.
 */
describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor<unknown>();
  const context = {} as ExecutionContext;

  function handler(payload: unknown): CallHandler<unknown> {
    return { handle: () => of(payload) };
  }

  it('مقدار خام دامنه در {success:true, data} پیچیده می‌شود', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(context, handler({ id: '1' })),
    );
    expect(result).toEqual({ success: true, data: { id: '1' } });
  });

  it('ResponseWithMeta → meta صفحه‌بندی هم اضافه می‌شود', async () => {
    const payload = new ResponseWithMeta([1, 2], buildMeta(2, 10, 42));
    const result = await lastValueFrom(interceptor.intercept(context, handler(payload)));
    expect(result).toEqual({
      success: true,
      data: [1, 2],
      meta: { page: 2, pageSize: 10, total: 42 },
    });
  });

  it('ResponseWithMeta بدون meta → فقط {success, data}', async () => {
    const payload = new ResponseWithMeta('x');
    const result = await lastValueFrom(interceptor.intercept(context, handler(payload)));
    expect(result).toEqual({ success: true, data: 'x' });
    expect(Object.keys(result)).not.toContain('meta');
  });
});
