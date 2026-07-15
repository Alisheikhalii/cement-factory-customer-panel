import { ConfigService } from '@nestjs/config';
import { MockErpAdapter } from './mock.adapter';

/**
 * تست واحد MockErpAdapter (بخش ۱۲.۲ + الزام تست بخش ۱۸ PRD).
 * تاخیر مصنوعی را برای سرعت تست صفر می‌کنیم.
 */
describe('MockErpAdapter', () => {
  let adapter: MockErpAdapter;

  beforeEach(() => {
    const config = {
      get: (key: string, def?: unknown) => {
        if (key === 'ERP_MOCK_LATENCY_MIN') return 0;
        if (key === 'ERP_MOCK_LATENCY_MAX') return 0;
        return def;
      },
    } as unknown as ConfigService;
    adapter = new MockErpAdapter(config);
  });

  it('باید ۴ محصول پایه Seed را برگرداند', async () => {
    const products = await adapter.getProducts();
    expect(products).toHaveLength(4);
    expect(products.map((p) => p.erpCode)).toContain('2001240001');
  });

  it('باید هر دو نوع محصول BAGGED و BULK را داشته باشد', async () => {
    const products = await adapter.getProducts();
    const types = new Set(products.map((p) => p.type));
    expect(types.has('BAGGED')).toBe(true);
    expect(types.has('BULK')).toBe(true);
  });

  it('submitLoadingRequest باید erpReferenceId قابل‌ردیابی برگرداند', async () => {
    const result = await adapter.submitLoadingRequest({
      requestNumber: 'REQ-100',
      customerCode: 'C-1',
      productCode: '2001240001',
      requestedQty: 25,
      vehicleType: 'TRAILER',
      loadType: 'FIXED',
      requestDate: new Date().toISOString(),
      destinationCity: 'شیراز',
      recipientMobile: '09120000000',
    });
    expect(result.erpReferenceId).toBe('MOCK-REQ-100');
  });

  it('getCustomers/getOrders/getDeliveries/getInvoices در حالت Mock آرایه برمی‌گردانند', async () => {
    await expect(adapter.getCustomers()).resolves.toEqual([]);
    await expect(adapter.getOrders()).resolves.toEqual([]);
    await expect(adapter.getDeliveries()).resolves.toEqual([]);
    await expect(adapter.getInvoices()).resolves.toEqual([]);
  });
});
