import type { OrderDto, OrderSumRow } from '@cement/shared-types';
import { OrderStatus, ProductType } from '@cement/shared-types';
import { toNum } from '../../common/utils/decimal.util';
import type { OrderWithRelations } from './orders.repository';

function toOrderStatus(status: string): OrderStatus {
  return OrderStatus[status as keyof typeof OrderStatus];
}

function toProductType(type: string): ProductType {
  return ProductType[type as keyof typeof ProductType];
}

export function toOrderDto(row: OrderWithRelations): OrderDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    orderDate: row.orderDate.toISOString(),
    productId: row.productId,
    productName: row.product.name,
    productType: toProductType(row.product.type),
    status: toOrderStatus(row.status),
    totalQty: toNum(row.totalQty),
    deliveredQty: toNum(row.deliveredQty),
    remainingQty: toNum(row.remainingQty),
    basePrice: toNum(row.basePrice),
    baseAmount: toNum(row.baseAmount),
    deliveredAmount: toNum(row.deliveredAmount),
    vatAmount: toNum(row.vatAmount),
    priceWithFactors: toNum(row.priceWithFactors),
    amountWithFactors: toNum(row.amountWithFactors),
    remainingAmount: toNum(row.remainingAmount),
    loadingRequestCount: row._count.loadingRequests,
  };
}

export function buildOrderSumRow(sums: {
  totalQty: import('@prisma/client').Prisma.Decimal | null;
  deliveredQty: import('@prisma/client').Prisma.Decimal | null;
  remainingQty: import('@prisma/client').Prisma.Decimal | null;
  amountWithFactors: import('@prisma/client').Prisma.Decimal | null;
  deliveredAmount: import('@prisma/client').Prisma.Decimal | null;
  remainingAmount: import('@prisma/client').Prisma.Decimal | null;
}): OrderSumRow {
  return {
    totalQty: toNum(sums.totalQty),
    deliveredQty: toNum(sums.deliveredQty),
    remainingQty: toNum(sums.remainingQty),
    amountWithFactors: toNum(sums.amountWithFactors),
    deliveredAmount: toNum(sums.deliveredAmount),
    remainingAmount: toNum(sums.remainingAmount),
  };
}
