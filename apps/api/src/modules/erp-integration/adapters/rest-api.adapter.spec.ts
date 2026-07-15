import type { ConfigService } from '@nestjs/config';
import { RestApiErpAdapter, type ErpHttpFetch } from './rest-api.adapter';
import { ErpConnectionError } from './adapter-config.util';

/**
 * تست RestApiErpAdapter با fetch ساختگی (بخش ۱۲.۳ / ۱۸ PRD) — بدون شبکهٔ واقعی.
 * اثبات می‌کند: URL/Query/Header درست ساخته می‌شوند، پاکت‌های مختلف پاسخ پذیرفته
 * و خطاهای HTTP شفاف بسته‌بندی می‌شوند.
 */

function config(extra: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    ERP_REST_BASE_URL: 'https://erp.example.com/api/',
    ERP_REST_API_KEY: 'test-key',
    ...extra,
  };
  return { get: (key: string, def?: unknown): unknown => values[key] ?? def } as unknown as ConfigService;
}

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function makeFetch(
  responder: (call: Call) => { status?: number; body?: unknown } | Error,
): { fetchImpl: ErpHttpFetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: ErpHttpFetch = (url, init) => {
    const call: Call = { url, method: init.method, headers: init.headers, body: init.body };
    calls.push(call);
    const out = responder(call);
    if (out instanceof Error) {
      return Promise.reject(out);
    }
    const status = out.status ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: (): Promise<unknown> => Promise.resolve(out.body),
    });
  };
  return { fetchImpl, calls };
}

const productRow = { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲', type: 'BAGGED' };

describe('RestApiErpAdapter', () => {
  it('getProducts: URL از baseUrl+path ساخته و آرایهٔ خام نگاشت می‌شود', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ body: [productRow] }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    const products = await adapter.getProducts();
    expect(calls[0]?.url).toBe('https://erp.example.com/api/products');
    expect(calls[0]?.headers['Authorization']).toBe('Bearer test-key');
    expect(products).toEqual([productRow]);
  });

  it('پاکت {data: [...]} هم پذیرفته می‌شود', async () => {
    const { fetchImpl } = makeFetch(() => ({ body: { data: [productRow] } }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await expect(adapter.getProducts()).resolves.toHaveLength(1);
  });

  it('مسیر Endpoint از env قابل تغییر است', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ body: [] }));
    const adapter = new RestApiErpAdapter(
      config({ ERP_REST_PATH_PRODUCTS: '/v2/goods' }),
      fetchImpl,
    );
    await adapter.getProducts();
    expect(calls[0]?.url).toBe('https://erp.example.com/api/v2/goods');
  });

  it('getInvoices بازه و کد مشتری را در Query می‌گذارد', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ body: [] }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await adapter.getInvoices(
      'C1',
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-07-01T00:00:00Z'),
    );
    const url = new URL(calls[0]?.url ?? '');
    expect(url.pathname).toBe('/api/invoices');
    expect(url.searchParams.get('customerCode')).toBe('C1');
    expect(url.searchParams.get('from')).toBe('2026-06-01T00:00:00.000Z');
    expect(url.searchParams.get('to')).toBe('2026-07-01T00:00:00.000Z');
  });

  it('getInventory بدون داده → ماندهٔ صفر', async () => {
    const { fetchImpl } = makeFetch(() => ({ body: null }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await expect(adapter.getInventory('C1', 'P1')).resolves.toEqual({
      customerCode: 'C1',
      productCode: 'P1',
      remainingAllowance: 0,
    });
  });

  it('submitLoadingRequest بدنهٔ JSON می‌فرستد و erpReferenceId برمی‌گرداند', async () => {
    const { fetchImpl, calls } = makeFetch(() => ({ body: { erpReferenceId: 'REF-9' } }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
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
    expect(result).toEqual({ erpReferenceId: 'REF-9' });
    expect(calls[0]?.method).toBe('POST');
    expect(JSON.parse(calls[0]?.body ?? '{}')).toMatchObject({ requestNumber: 'LR-000001' });
  });

  it('HTTP غیر ۲xx → ErpConnectionError با کد وضعیت', async () => {
    const { fetchImpl } = makeFetch(() => ({ status: 503, body: {} }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await expect(adapter.getProducts()).rejects.toThrow(ErpConnectionError);
    await expect(adapter.getProducts()).rejects.toThrow('503');
  });

  it('خطای شبکه → ErpConnectionError با نام عملیات', async () => {
    const { fetchImpl } = makeFetch(() => new Error('ECONNRESET'));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await expect(adapter.getCustomers()).rejects.toThrow('getCustomers');
  });

  it('پاسخ غیرآرایه‌ای برای فهرست → خطای شفاف', async () => {
    const { fetchImpl } = makeFetch(() => ({ body: { oops: true } }));
    const adapter = new RestApiErpAdapter(config(), fetchImpl);
    await expect(adapter.getDeliveries()).rejects.toThrow(ErpConnectionError);
  });
});
