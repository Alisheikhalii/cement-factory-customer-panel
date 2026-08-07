import type {
  DeliveryDto,
  DeliveryGroupRow,
  DeliverySumRow,
} from '@cement/shared-types';
import { DeliveryStatus } from '@cement/shared-types';
import type { Prisma } from '@prisma/client';
import { toNum, toNumOrNull } from '../../common/utils/decimal.util';
import { jalaaliMonthLabel } from '../../common/utils/jalali.util';
import type { DeliveryWithRelations } from './deliveries.repository';

function toStatus(status: string): DeliveryStatus {
  return DeliveryStatus[status as keyof typeof DeliveryStatus];
}

/**
 * جمع null-safe: `null` یعنی «تا اینجا هیچ مقداری نبوده».
 * اگر همه ورودی‌ها null باشند نتیجه هم null می‌ماند (نه صفر) تا در جدول «—» دیده شود.
 */
function addNullable(acc: number | null, value: number | null): number | null {
  if (value === null) {
    return acc;
  }
  return (acc ?? 0) + value;
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
    driverMobile: row.driverMobile,
    productId: row.productId,
    productName: row.product.name,
    deliveredQty: toNum(row.deliveredQty),
    // مالی‌ها با toNumOrNull: نبودِ مقدار باید null بماند، نه صفر (بخش ۱۰.۷).
    basePrice: toNumOrNull(row.basePrice),
    baseAmount: toNumOrNull(row.baseAmount),
    vatAmount: toNumOrNull(row.vatAmount),
    deductions: toNum(row.deductions),
    amountWithFactors: toNumOrNull(row.amountWithFactors),
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
    // Prisma._sum برای ستون کاملاً null (یا بازه خالی) خودش null برمی‌گرداند و
    // ردیف‌های null را در جمع نادیده می‌گیرد؛ پس همین کافی است.
    baseAmount: toNumOrNull(sums.baseAmount),
    vatAmount: toNumOrNull(sums.vatAmount),
    deductions: toNum(sums.deductions),
    amountWithFactors: toNumOrNull(sums.amountWithFactors),
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
        baseAmount: null,
        vatAmount: null,
        deductions: 0,
        amountWithFactors: null,
      } satisfies DeliveryGroupRow);
    existing.deliveredQty += toNum(row.deliveredQty);
    existing.baseAmount = addNullable(existing.baseAmount, toNumOrNull(row.baseAmount));
    existing.vatAmount = addNullable(existing.vatAmount, toNumOrNull(row.vatAmount));
    existing.deductions += toNum(row.deductions);
    existing.amountWithFactors = addNullable(
      existing.amountWithFactors,
      toNumOrNull(row.amountWithFactors),
    );
    map.set(key, existing);
  }
  return Array.from(map.values());
}
