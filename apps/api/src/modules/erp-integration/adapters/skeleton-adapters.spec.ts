import type { ConfigService } from '@nestjs/config';
import { SqlServerErpAdapter } from './sql-server.adapter';
import { RestApiErpAdapter } from './rest-api.adapter';
import { FileBasedErpAdapter } from './file-based.adapter';

/**
 * تست fail-fast پیکربندی Adapterهای واقعی فاز ۶ (بخش ۱۲.۳ / ۲۰.۲ PRD).
 * هدف (همان هدف اسکلت‌های قبلی، حالا در سطح env): اگر Adapter واقعی انتخاب شود
 * اما اتصال آن پیکربندی نشده باشد، در «بوت» با پیام شفافِ فهرست متغیرهای گم‌شده
 * بایستد — نه رفتار خاموش/نادرست در زمان اجرا.
 */

/** ConfigService ساختگی که فقط کلیدهای داده‌شده را دارد. */
function fakeConfig(values: Record<string, string> = {}): ConfigService {
  return {
    get: (key: string, def?: unknown): unknown => values[key] ?? def,
  } as unknown as ConfigService;
}

describe('ERP adapters — fail-fast پیکربندی ناقص', () => {
  it('sql-server بدون ERP_SQL_* در سازنده می‌ایستد و متغیرهای گم‌شده را نام می‌برد', () => {
    expect(() => new SqlServerErpAdapter(fakeConfig())).toThrow('sql-server');
    expect(() => new SqlServerErpAdapter(fakeConfig())).toThrow('ERP_SQL_HOST');
    expect(() => new SqlServerErpAdapter(fakeConfig({ ERP_SQL_HOST: 'db' }))).toThrow(
      'ERP_SQL_DATABASE',
    );
  });

  it('rest-api بدون ERP_REST_* در سازنده می‌ایستد', () => {
    expect(() => new RestApiErpAdapter(fakeConfig())).toThrow('ERP_REST_BASE_URL');
    expect(
      () => new RestApiErpAdapter(fakeConfig({ ERP_REST_BASE_URL: 'http://erp.local' })),
    ).toThrow('ERP_REST_API_KEY');
  });

  it('file-based بدون ERP_FILE_EXCHANGE_DIR در سازنده می‌ایستد', () => {
    expect(() => new FileBasedErpAdapter(fakeConfig())).toThrow('ERP_FILE_EXCHANGE_DIR');
  });

  it('پیام خطا کاربر را به ERP_ADAPTER=mock راهنمایی می‌کند', () => {
    expect(() => new SqlServerErpAdapter(fakeConfig())).toThrow('ERP_ADAPTER=mock');
  });
});
