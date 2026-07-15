import type { ConfigService } from '@nestjs/config';
import { SqlServerErpAdapter, type ErpSqlClient } from './sql-server.adapter';
import { ErpConnectionError } from './adapter-config.util';
import { ErpMappingError } from '../dto/erp-record.mapper';

/**
 * تست SqlServerErpAdapter با Client ساختگی (بخش ۱۲.۳ / ۱۸ PRD) — بدون دیتابیس
 * واقعی. اثبات می‌کند: Query درست ساخته می‌شود، پارامترها امن (Parameterized)
 * پاس می‌شوند، نگاشت DTO انجام و خطاها شفاف بسته‌بندی می‌شوند.
 */

function config(extra: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    ERP_SQL_HOST: 'erp-db.local',
    ERP_SQL_DATABASE: 'ERP',
    ERP_SQL_USER: 'portal',
    ERP_SQL_PASSWORD: 'secret',
    ...extra,
  };
  return { get: (key: string, def?: unknown): unknown => values[key] ?? def } as unknown as ConfigService;
}

interface Call {
  sql: string;
  params: Record<string, unknown>;
}

function makeAdapter(rows: Record<string, unknown>[] | Error): {
  adapter: SqlServerErpAdapter;
  calls: Call[];
} {
  const calls: Call[] = [];
  const client: ErpSqlClient = {
    query: (sql, params = {}): Promise<Record<string, unknown>[]> => {
      calls.push({ sql, params });
      if (rows instanceof Error) {
        return Promise.reject(rows);
      }
      return Promise.resolve(rows);
    },
  };
  const adapter = new SqlServerErpAdapter(config(), () => Promise.resolve(client));
  return { adapter, calls };
}

const productRow = { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲', type: 'BAGGED' };

describe('SqlServerErpAdapter', () => {
  it('getProducts از View پیش‌فرض می‌خواند و DTO می‌سازد', async () => {
    const { adapter, calls } = makeAdapter([productRow]);
    const products = await adapter.getProducts();
    expect(calls[0]?.sql).toBe('SELECT * FROM portal_products');
    expect(products).toEqual([productRow]);
  });

  it('نام View از env قابل تغییر است (بدون تغییر کد)', async () => {
    const calls: Call[] = [];
    const client: ErpSqlClient = {
      query: (sql, params = {}): Promise<Record<string, unknown>[]> => {
        calls.push({ sql, params });
        return Promise.resolve([]);
      },
    };
    const adapter = new SqlServerErpAdapter(
      config({ ERP_SQL_VIEW_PRODUCTS: 'dbo.vw_PortalProducts' }),
      () => Promise.resolve(client),
    );
    await adapter.getProducts();
    expect(calls[0]?.sql).toBe('SELECT * FROM dbo.vw_PortalProducts');
  });

  it('getOrders فیلترها را به‌صورت Parameterized پاس می‌دهد (نه الحاق رشته)', async () => {
    const { adapter, calls } = makeAdapter([]);
    const since = new Date('2026-07-01T00:00:00Z');
    await adapter.getOrders("C1'; DROP TABLE x;--", since);
    const call = calls[0];
    expect(call?.sql).toBe(
      'SELECT * FROM portal_orders WHERE customerCode = @customerCode AND orderDate >= @since',
    );
    // مقدار خطرناک فقط در params است، نه داخل SQL.
    expect(call?.sql).not.toContain('DROP TABLE');
    expect(call?.params).toEqual({ customerCode: "C1'; DROP TABLE x;--", since });
  });

  it('getInventory بدون ردیف → ماندهٔ صفر (نه خطا)', async () => {
    const { adapter } = makeAdapter([]);
    await expect(adapter.getInventory('C1', 'P1')).resolves.toEqual({
      customerCode: 'C1',
      productCode: 'P1',
      remainingAllowance: 0,
    });
  });

  it('submitLoadingRequest شناسهٔ برگشتی پروسیجر را برمی‌گرداند', async () => {
    const { adapter, calls } = makeAdapter([{ erpReferenceId: 42 }]);
    const result = await adapter.submitLoadingRequest({
      requestNumber: 'LR-000001',
      customerCode: 'C1',
      productCode: 'P1',
      requestedQty: 10,
      vehicleType: 'TRAILER',
      loadType: 'FIXED',
      requestDate: '2026-07-14T00:00:00.000Z',
      destinationCity: 'شیراز',
      recipientMobile: '09120000000',
    });
    expect(result).toEqual({ erpReferenceId: '42' });
    expect(calls[0]?.sql).toContain('EXEC portal_submit_loading_request');
    expect(calls[0]?.params['requestNumber']).toBe('LR-000001');
  });

  it('نبود erpReferenceId در خروجی پروسیجر → ErpConnectionError', async () => {
    const { adapter } = makeAdapter([{}]);
    await expect(
      adapter.submitLoadingRequest({
        requestNumber: 'LR-000002',
        customerCode: 'C1',
        productCode: 'P1',
        requestedQty: 10,
        vehicleType: 'TRAILER',
        loadType: 'FIXED',
        requestDate: '2026-07-14T00:00:00.000Z',
        destinationCity: 'شیراز',
        recipientMobile: '09120000000',
      }),
    ).rejects.toThrow(ErpConnectionError);
  });

  it('خطای درایور → ErpConnectionError با نام عملیات', async () => {
    const { adapter } = makeAdapter(new Error('ECONNREFUSED'));
    await expect(adapter.getProducts()).rejects.toThrow(ErpConnectionError);
    await expect(adapter.getProducts()).rejects.toThrow('getProducts');
  });

  it('دادهٔ خراب ERP → ErpMappingError (نگاشت، نه اتصال)', async () => {
    const { adapter } = makeAdapter([{ erpCode: 'X', name: 'Y', type: 'POWDER' }]);
    await expect(adapter.getProducts()).rejects.toThrow(ErpMappingError);
  });

  it('شکست ساخت Client کش نمی‌شود — تلاش بعدی دوباره وصل می‌شود', async () => {
    let attempts = 0;
    const client: ErpSqlClient = {
      query: (): Promise<Record<string, unknown>[]> => Promise.resolve([productRow]),
    };
    const adapter = new SqlServerErpAdapter(config(), () => {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error('login failed'))
        : Promise.resolve(client);
    });
    await expect(adapter.getProducts()).rejects.toThrow(ErpConnectionError);
    await expect(adapter.getProducts()).resolves.toHaveLength(1);
    expect(attempts).toBe(2);
  });
});
