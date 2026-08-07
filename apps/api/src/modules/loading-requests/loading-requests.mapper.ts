import type {
  AdminLoadingRequestDetail,
  AdminLoadingRequestRow,
  LoadingRequestDto,
  LoadingRequestSumRow,
  SelectableOrderDto,
} from '@cement/shared-types';
import { LoadingRequestStatus } from '@cement/shared-types';
import type { Prisma } from '@prisma/client';
import { toNum } from '../../common/utils/decimal.util';
import type {
  AdminLoadingRequestDetailRow,
  AdminLoadingRequestWithContext,
  LoadingRequestWithRelations,
  SelectableOrderRow,
} from './loading-requests.repository';

function toStatus(status: string): LoadingRequestStatus {
  return LoadingRequestStatus[status as keyof typeof LoadingRequestStatus];
}

/** ردیف سفارش قابل انتخاب در فرم اعلام بار (بخش ۹.۵) — بدون هیچ فیلد مالی. */
export function toSelectableOrderDto(row: SelectableOrderRow): SelectableOrderDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    productId: row.productId,
    productName: row.product.name,
    remainingQty: toNum(row.remainingQty),
  };
}

export function toLoadingRequestDto(row: LoadingRequestWithRelations): LoadingRequestDto {
  const requestedQty = toNum(row.requestedQty);
  const deliveredQty = row.delivery ? toNum(row.delivery.deliveredQty) : 0;
  return {
    id: row.id,
    requestNumber: row.requestNumber,
    submittedAt: row.submittedAt.toISOString(),
    requestDate: row.requestDate.toISOString(),
    productId: row.productId,
    productName: row.product.name,
    carrierName: row.carrier?.name ?? null,
    requestedQty,
    deliveredQty,
    remainingQty: Math.max(requestedQty - deliveredQty, 0),
    status: toStatus(row.status),
    reviewedByNote: row.reviewedByNote,
    hasDelivery: row.delivery !== null,
    deliveryId: row.delivery?.id ?? null,
  };
}

export function buildLoadingRequestSumRow(
  sums: { requestedQty: Prisma.Decimal | null },
  deliveredTotal: number,
): LoadingRequestSumRow {
  return {
    requestedQty: toNum(sums.requestedQty),
    deliveredQty: deliveredTotal,
  };
}

// ==================== کارتابل ادمین (فاز ۴.۵) ====================

/** برچسب فارسی نوع محصول (۹.۹.۳). */
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  BAGGED: 'پاکتی',
  BULK: 'فله',
};

/** برچسب فارسی نوع خودرو (۹.۹.۳). */
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  TRAILER: 'تریلی',
  FLATBED: 'کفی',
  DUMP: 'کمپرسی',
  TEN_WHEEL: 'ده‌چرخ',
};

/** برچسب فارسی نوع بار (۹.۹.۳). */
const LOAD_TYPE_LABELS: Record<string, string> = {
  FIXED: 'فیکس',
  NON_FIXED: 'غیرفیکس',
};

/** ردیف کارتابل ادمین (بخش ۹.۹.۳). */
export function toAdminLoadingRequestRow(
  row: AdminLoadingRequestWithContext,
): AdminLoadingRequestRow {
  return {
    id: row.id,
    requestNumber: row.requestNumber,
    customerName: row.customer.name,
    orderNumber: row.order.orderNumber,
    productName: row.product.name,
    requestedQty: toNum(row.requestedQty),
    requestDate: row.requestDate.toISOString(),
    status: toStatus(row.status),
    submittedAt: row.submittedAt.toISOString(),
    // مقصد/تحویل‌گیرنده: فیلدهای اسکالر همین رکورد، پس Query اضافه‌ای لازم نیست.
    destinationCity: row.destinationCity,
    additionalAddress: row.additionalAddress,
    destinationPostalCode: row.destinationPostalCode,
    recipientMobile: row.recipientMobile,
  };
}

/** جزئیات کامل درخواست برای Drawer ادمین + مانده موجودی (بخش ۹.۹.۳ / BR-25). */
export function toAdminLoadingRequestDetail(
  row: AdminLoadingRequestDetailRow,
): AdminLoadingRequestDetail {
  return {
    id: row.id,
    requestNumber: row.requestNumber,
    productName: row.product.name,
    productType: PRODUCT_TYPE_LABELS[row.product.type] ?? row.product.type,
    vehicleType: VEHICLE_TYPE_LABELS[row.vehicleType] ?? row.vehicleType,
    loadType: LOAD_TYPE_LABELS[row.loadType] ?? row.loadType,
    destinationCity: row.destinationCity,
    additionalAddress: row.additionalAddress,
    destinationPostalCode: row.destinationPostalCode,
    recipientMobile: row.recipientMobile,
    requestedQty: toNum(row.requestedQty),
    orderRemainingQty: toNum(row.order.remainingQty),
    status: toStatus(row.status),
    requestDate: row.requestDate.toISOString(),
    submittedAt: row.submittedAt.toISOString(),
    reviewedByNote: row.reviewedByNote,
    customer: {
      name: row.customer.name,
      customerCode: row.customer.customerCode,
    },
    orderNumber: row.order.orderNumber,
  };
}
