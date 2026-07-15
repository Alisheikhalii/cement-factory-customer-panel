import type {
  DeliveryDto,
  DeliveryGroupRow,
  DeliverySumRow,
} from '@cement/shared-types';
import { DeliveryStatus } from '@cement/shared-types';
import type { Prisma } from '@prisma/client';
import { toNum } from '../../common/utils/decimal.util';
import { jalaaliMonthLabel } from '../../common/utils/jalali.util';
import type { DeliveryWithRelations } from './deliveries.repository';

function toStatus(status: string): DeliveryStatus {
  return DeliveryStatus[status as keyof typeof DeliveryStatus];
}

export function toDeliveryDto(row: DeliveryWithRelations): DeliveryDto {
  return {
    id: row.id,
    weighingNumber: row.weighingNumber,
    loadingRequestId: row.loadingRequestId,
    loadingRequestNumber: row.loadingRequest.requestNumber,
    deliveryDate: row.deliveryDate.toISOString(),
    carrierName: row.carrier?.name ?? null,
    vehicleNumber: row.vehicleNumber,
    driverName: row.driverName,
    productId: row.productId,
    productName: row.product.name,
    deliveredQty: toNum(row.deliveredQty),
    basePrice: toNum(row.basePrice),
    baseAmount: toNum(row.baseAmount),
    vatAmount: toNum(row.vatAmount),
    deductions: toNum(row.deductions),
    amountWithFactors: toNum(row.amountWithFactors),
    status: toStatus(row.status),
  };
}

export function buildDeliverySumRow(sums: {
  deliveredQty: Prisma.Decimal | null;
  baseAmount: Prisma.Decimal | null;
  vatAmount: Prisma.Decimal | null;
  deductions: Prisma.Decimal | null;
  amountWithFactors: Prisma.Decimal | null;
}): DeliverySumRow {
  return {
    deliveredQty: toNum(sums.deliveredQty),
    baseAmount: toNum(sums.baseAmount),
    vatAmount: toNum(sums.vatAmount),
    deductions: toNum(sums.deductions),
    amountWithFactors: toNum(sums.amountWithFactors),
  };
}

/** تجمیع «سرجمع محصول» یا «سرجمع تاریخ» روی مجموعه‌ی کامل تحویل‌ها (بخش ۹.۶). */
export function groupDeliveries(
  rows: DeliveryWithRelations[],
  view: 'by-product' | 'by-date',
): DeliveryGroupRow[] {
  const map = new Map<string, DeliveryGroupRow>();
  for (const row of rows) {
    const key =
      view === 'by-product'
        ? row.productId
        : jalaaliMonthLabel(row.deliveryDate);
    const label = view === 'by-product' ? row.product.name : key;
    const existing =
      map.get(key) ??
      ({
        groupKey: key,
        groupLabel: label,
        deliveredQty: 0,
        baseAmount: 0,
        vatAmount: 0,
        deductions: 0,
        amountWithFactors: 0,
      } satisfies DeliveryGroupRow);
    existing.deliveredQty += toNum(row.deliveredQty);
    existing.baseAmount += toNum(row.baseAmount);
    existing.vatAmount += toNum(row.vatAmount);
    existing.deductions += toNum(row.deductions);
    existing.amountWithFactors += toNum(row.amountWithFactors);
    map.set(key, existing);
  }
  return Array.from(map.values());
}
