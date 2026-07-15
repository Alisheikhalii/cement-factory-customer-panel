import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { ConfigService } from '@nestjs/config';
import { FileBasedErpAdapter } from './file-based.adapter';
import { parseCsv, toCsv } from './csv.util';

/**
 * تست FileBasedErpAdapter روی پوشهٔ موقت واقعی (بخش ۱۲.۳ / ۱۸ PRD).
 * اثبات می‌کند: خواندن CSVهای `in/`، فیلترها، نبودِ فایل = دادهٔ خالی، و نوشتن
 * اتمی خروجی‌ها در `out/`.
 */

function config(dir: string): ConfigService {
  const values: Record<string, string> = { ERP_FILE_EXCHANGE_DIR: dir };
  return { get: (key: string, def?: unknown): unknown => values[key] ?? def } as unknown as ConfigService;
}

describe('FileBasedErpAdapter', () => {
  let dir: string;
  let adapter: FileBasedErpAdapter;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-exchange-'));
    await fs.mkdir(path.join(dir, 'in'), { recursive: true });
    adapter = new FileBasedErpAdapter(config(dir));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function writeIn(name: string, columns: string[], records: Record<string, unknown>[]): Promise<void> {
    await fs.writeFile(path.join(dir, 'in', name), toCsv(columns, records), 'utf8');
  }

  it('getProducts فایل CSV را می‌خواند و DTO می‌سازد', async () => {
    await writeIn('products.csv', ['erpCode', 'name', 'type'], [
      { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲', type: 'BAGGED' },
      { erpCode: '2001240004', name: 'سیمان فله', type: 'BULK' },
    ]);
    const products = await adapter.getProducts();
    expect(products).toHaveLength(2);
    expect(products[0]).toEqual({
      erpCode: '2001240001',
      name: 'سیمان پاکتی تیپ ۲',
      type: 'BAGGED',
    });
  });

  it('نبودِ فایل ورودی → آرایهٔ خالی (ERP هنوز منتشر نکرده)', async () => {
    await expect(adapter.getDeliveries()).resolves.toEqual([]);
    await expect(adapter.getCustomers()).resolves.toEqual([]);
  });

  it('getInventory ردیف مشتری/محصول را پیدا می‌کند؛ نبودنش = ماندهٔ صفر', async () => {
    await writeIn('inventory.csv', ['customerCode', 'productCode', 'remainingAllowance'], [
      { customerCode: 'C1', productCode: 'P1', remainingAllowance: 120 },
    ]);
    await expect(adapter.getInventory('C1', 'P1')).resolves.toEqual({
      customerCode: 'C1',
      productCode: 'P1',
      remainingAllowance: 120,
    });
    await expect(adapter.getInventory('C2', 'P1')).resolves.toEqual({
      customerCode: 'C2',
      productCode: 'P1',
      remainingAllowance: 0,
    });
  });

  it('getInvoices به مشتری و بازهٔ [from, to) محدود می‌شود', async () => {
    const cols = ['customerCode', 'docNumber', 'date', 'operationType', 'amount', 'status', 'source'];
    await writeIn('invoices.csv', cols, [
      { customerCode: 'C1', docNumber: 'D1', date: '2026-06-15', operationType: 'واریز', amount: 100, status: 'OK', source: 'TRANSACTION' },
      { customerCode: 'C1', docNumber: 'D2', date: '2026-07-01', operationType: 'واریز', amount: 200, status: 'OK', source: 'TRANSACTION' },
      { customerCode: 'C2', docNumber: 'D3', date: '2026-06-20', operationType: 'واریز', amount: 300, status: 'OK', source: 'TRANSACTION' },
    ]);
    const invoices = await adapter.getInvoices(
      'C1',
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-07-01T00:00:00Z'),
    );
    expect(invoices.map((i) => i.docNumber)).toEqual(['D1']);
  });

  it('getOrders فیلتر customerCode/since را اعمال می‌کند', async () => {
    const cols = [
      'erpOrderId', 'orderNumber', 'customerCode', 'productCode', 'orderDate',
      'totalQty', 'deliveredQty', 'remainingQty', 'basePrice', 'baseAmount',
      'deliveredAmount', 'vatAmount', 'priceWithFactors', 'amountWithFactors',
      'remainingAmount', 'status',
    ];
    const base = {
      totalQty: 10, deliveredQty: 0, remainingQty: 10, basePrice: 1, baseAmount: 10,
      deliveredAmount: 0, vatAmount: 1, priceWithFactors: 1, amountWithFactors: 11,
      remainingAmount: 11, status: 'OPEN', productCode: 'P1',
    };
    await writeIn('orders.csv', cols, [
      { ...base, erpOrderId: 'O1', orderNumber: 'N1', customerCode: 'C1', orderDate: '2026-05-01' },
      { ...base, erpOrderId: 'O2', orderNumber: 'N2', customerCode: 'C1', orderDate: '2026-07-01' },
      { ...base, erpOrderId: 'O3', orderNumber: 'N3', customerCode: 'C2', orderDate: '2026-07-01' },
    ]);
    const orders = await adapter.getOrders('C1', new Date('2026-06-01T00:00:00Z'));
    expect(orders.map((o) => o.erpOrderId)).toEqual(['O2']);
  });

  it('submitLoadingRequest فایل CSV در out/ می‌نویسد (بدون فایل .tmp باقی‌مانده)', async () => {
    const result = await adapter.submitLoadingRequest({
      requestNumber: 'LR-000001',
      customerCode: 'C1',
      productCode: 'P1',
      requestedQty: 10,
      vehicleType: 'TRAILER',
      loadType: 'FIXED',
      requestDate: '2026-07-14T00:00:00.000Z',
      destinationCity: 'شیراز، صدرا',
      recipientMobile: '09120000000',
    });
    expect(result).toEqual({ erpReferenceId: 'FILE-LR-000001' });
    const outPath = path.join(dir, 'out', 'loading-request-LR-000001.csv');
    const written = parseCsv(await fs.readFile(outPath, 'utf8'));
    expect(written[0]).toMatchObject({
      requestNumber: 'LR-000001',
      destinationCity: 'شیراز، صدرا', // کامای فارسی/نقل‌قول باید سالم رفت‌وبرگشت شود
    });
    const leftovers = (await fs.readdir(path.join(dir, 'out'))).filter((f) => f.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });

  it('syncLoadingStatus فایل وضعیت می‌نویسد', async () => {
    await adapter.syncLoadingStatus('LR-000002', 'LOADED', 'بارگیری شد');
    const outPath = path.join(dir, 'out', 'loading-status-LR-000002.csv');
    const written = parseCsv(await fs.readFile(outPath, 'utf8'));
    expect(written).toEqual([
      { requestNumber: 'LR-000002', status: 'LOADED', note: 'بارگیری شد' },
    ]);
  });
});
