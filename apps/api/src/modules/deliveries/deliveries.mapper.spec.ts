import { Prisma } from '@prisma/client';
import { buildDeliverySumRow, groupDeliveries } from './deliveries.mapper';
import type { DeliveryWithRelations } from './deliveries.repository';

function makeRow(overrides: {
  id: string;
  productId: string;
  productName: string;
  deliveryDate: Date;
  qty: number;
  base: number;
  vat: number;
  amount: number;
}): DeliveryWithRelations {
  return {
    id: overrides.id,
    weighingNumber: `W-${overrides.id}`,
    loadingRequestId: `lr-${overrides.id}`,
    deliveryDate: overrides.deliveryDate,
    carrierId: null,
    vehicleNumber: null,
    driverName: null,
    productId: overrides.productId,
    deliveredQty: new Prisma.Decimal(overrides.qty),
    basePrice: new Prisma.Decimal(1000),
    baseAmount: new Prisma.Decimal(overrides.base),
    vatAmount: new Prisma.Decimal(overrides.vat),
    deductions: new Prisma.Decimal(0),
    amountWithFactors: new Prisma.Decimal(overrides.amount),
    status: 'FINALIZED',
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: overrides.productId,
      erpCode: `E-${overrides.productId}`,
      name: overrides.productName,
      type: 'BULK',
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    carrier: null,
    loadingRequest: {
      id: `lr-${overrides.id}`,
      requestNumber: `LR-${overrides.id}`,
    } as DeliveryWithRelations['loadingRequest'],
  } as DeliveryWithRelations;
}

describe('deliveries.mapper — grouping', () => {
  const rows = [
    makeRow({ id: '1', productId: 'p1', productName: 'سیمان فله', deliveryDate: new Date(2024, 4, 1), qty: 10, base: 100, vat: 9, amount: 109 }),
    makeRow({ id: '2', productId: 'p1', productName: 'سیمان فله', deliveryDate: new Date(2024, 4, 20), qty: 5, base: 50, vat: 4, amount: 54 }),
    makeRow({ id: '3', productId: 'p2', productName: 'سیمان پاکتی', deliveryDate: new Date(2024, 5, 2), qty: 8, base: 80, vat: 7, amount: 87 }),
  ];

  it('سرجمع محصول: دو گروه با جمع درست مقدار', () => {
    const groups = groupDeliveries(rows, 'by-product');
    expect(groups).toHaveLength(2);
    const p1 = groups.find((g) => g.groupKey === 'p1');
    expect(p1?.deliveredQty).toBe(15);
    expect(p1?.amountWithFactors).toBe(163);
    expect(p1?.groupLabel).toBe('سیمان فله');
  });

  it('سرجمع تاریخ: گروه‌بندی بر اساس ماه جلالی', () => {
    const groups = groupDeliveries(rows, 'by-date');
    // اردیبهشت (دو رکورد) و خرداد (یک رکورد)
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const total = groups.reduce((s, g) => s + g.deliveredQty, 0);
    expect(total).toBe(23);
  });

  it('ردیف جمع کل روی همه‌ی مقادیر Decimal', () => {
    const sum = buildDeliverySumRow({
      deliveredQty: new Prisma.Decimal(23),
      baseAmount: new Prisma.Decimal(230),
      vatAmount: new Prisma.Decimal(20),
      deductions: new Prisma.Decimal(0),
      amountWithFactors: new Prisma.Decimal(250),
    });
    expect(sum.deliveredQty).toBe(23);
    expect(sum.amountWithFactors).toBe(250);
  });
});
