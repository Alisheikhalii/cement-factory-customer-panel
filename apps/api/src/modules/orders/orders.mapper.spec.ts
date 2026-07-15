import { Prisma } from '@prisma/client';
import { OrderStatus, ProductType } from '@cement/shared-types';
import { buildOrderSumRow, toOrderDto } from './orders.mapper';
import type { OrderWithRelations } from './orders.repository';

/** تست نگاشت سفارش → DTO (فاز ۷e پوشش) — تبدیل Decimal/تاریخ/enum. */
describe('orders.mapper', () => {
  const row = {
    id: 'o1',
    orderNumber: 'ORD-1001',
    orderDate: new Date('2026-06-15T00:00:00Z'),
    productId: 'p1',
    product: { name: 'سیمان پاکتی تیپ ۲', type: 'BAGGED' },
    status: 'IN_USE',
    totalQty: new Prisma.Decimal(100),
    deliveredQty: new Prisma.Decimal(40),
    remainingQty: new Prisma.Decimal(60),
    basePrice: new Prisma.Decimal(1000),
    baseAmount: new Prisma.Decimal(100000),
    deliveredAmount: new Prisma.Decimal(40000),
    vatAmount: new Prisma.Decimal(9000),
    priceWithFactors: new Prisma.Decimal(1090),
    amountWithFactors: new Prisma.Decimal(109000),
    remainingAmount: new Prisma.Decimal(65400),
    _count: { loadingRequests: 3 },
  } as unknown as OrderWithRelations;

  it('همه فیلدها با نوع درست نگاشت می‌شوند', () => {
    const dto = toOrderDto(row);
    expect(dto).toMatchObject({
      id: 'o1',
      orderNumber: 'ORD-1001',
      orderDate: '2026-06-15T00:00:00.000Z',
      productName: 'سیمان پاکتی تیپ ۲',
      productType: ProductType.BAGGED,
      status: OrderStatus.IN_USE,
      totalQty: 100,
      deliveredQty: 40,
      remainingQty: 60,
      loadingRequestCount: 3,
    });
  });

  it('buildOrderSumRow جمع‌های null (نتیجه خالی) را صفر می‌کند', () => {
    expect(
      buildOrderSumRow({
        totalQty: null,
        deliveredQty: null,
        remainingQty: null,
        amountWithFactors: null,
        deliveredAmount: null,
        remainingAmount: null,
      }),
    ).toEqual({
      totalQty: 0,
      deliveredQty: 0,
      remainingQty: 0,
      amountWithFactors: 0,
      deliveredAmount: 0,
      remainingAmount: 0,
    });
  });
});
