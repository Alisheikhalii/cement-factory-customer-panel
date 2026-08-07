import 'reflect-metadata';
import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { ListCustomersQueryDto } from './list-customers-query.dto';

/**
 * این تست دقیقاً همان باگی را قفل می‌کند که جعبهٔ جستجوی صفحهٔ مشتریان را از کار
 * انداخته بود: `search` در هیچ DTOای اعلام نشده بود و `forbidNonWhitelisted` سراسری
 * هر `?search=` را ۴۰۰ می‌کرد — با آنکه منطق جستجو در Repository کامل بود.
 *
 * Pipe با همان تنظیمات `main.ts` ساخته می‌شود تا تست، رفتار واقعی زمان اجرا را بسنجد
 * نه یک پیکربندی دلخواه.
 */
describe('ListCustomersQueryDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const meta: ArgumentMetadata = {
    type: 'query',
    metatype: ListCustomersQueryDto,
  };

  it('پارامتر search را می‌پذیرد (رگرسیون: پیش‌تر ۴۰۰ می‌داد)', async () => {
    const result = (await pipe.transform(
      { page: '2', pageSize: '50', search: 'رضا' },
      meta,
    )) as ListCustomersQueryDto;

    expect(result.search).toBe('رضا');
    // page/pageSize باید به عدد تبدیل شوند (رشتهٔ Query → number).
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
  });

  it('بدون search هم معتبر است (search اختیاری)', async () => {
    const result = (await pipe.transform({ page: '1' }, meta)) as ListCustomersQueryDto;

    expect(result.search).toBeUndefined();
    expect(result.page).toBe(1);
  });

  it('پارامتر ناشناخته همچنان رد می‌شود (whitelist شل نشده است)', async () => {
    // مهم است که رفع باگ، دروازه را برای هر پارامتر دلخواهی باز نکرده باشد.
    await expect(pipe.transform({ unknownParam: 'x' }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('search بلندتر از ۱۰۰ کاراکتر رد می‌شود', async () => {
    await expect(pipe.transform({ search: 'ا'.repeat(101) }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('قیدهای صفحه‌بندی ارث‌بری‌شده همچنان اعمال می‌شوند (pageSize > 100)', async () => {
    await expect(pipe.transform({ pageSize: '101' }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
