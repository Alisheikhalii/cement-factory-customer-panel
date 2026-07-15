/**
 * DTOهای پاسخ فاز ۲ (ماژول‌های Read Only) — بخش ۱۱.۲ تا ۱۱.۶ PRD.
 * منبع واحد قرارداد بین Frontend و Backend (instruction.md §3).
 *
 * قرارداد سریال‌سازی:
 *  - همه مقادیر Decimal پرزیما → `number` (تبدیل در Mapperهای Backend).
 *  - همه تاریخ‌ها → ISO string (نمایش جلالی سمت Frontend انجام می‌شود).
 */

import type {
  DeliveryStatus,
  LoadingRequestStatus,
  LoadType,
  OrderStatus,
  ProductType,
  ReceiptStatus,
  VehicleType,
} from './enums';

/** پارامترهای صفحه‌بندی مشترک همه لیست‌ها. */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

/** پوشش خروجی لیستی: ردیف‌ها + ردیف جمع (Footer) — جمع‌ها همیشه سمت Backend محاسبه می‌شوند (بخش ۹.۰). */
export interface ListResult<TRow, TSum> {
  rows: TRow[];
  sumRow: TSum;
}

// ==================== PRODUCT ====================

export interface ProductDto {
  id: string;
  erpCode: string;
  name: string;
  type: ProductType;
}

// ==================== ORDERS (۱۱.۴ / ۹.۴) ====================

export interface OrderDto {
  id: string;
  orderNumber: string;
  orderDate: string;
  productId: string;
  productName: string;
  productType: ProductType;
  status: OrderStatus;
  totalQty: number;
  deliveredQty: number;
  remainingQty: number;
  basePrice: number;
  baseAmount: number;
  deliveredAmount: number;
  vatAmount: number;
  priceWithFactors: number;
  amountWithFactors: number;
  remainingAmount: number;
  loadingRequestCount: number;
}

export interface OrderSumRow {
  totalQty: number;
  deliveredQty: number;
  remainingQty: number;
  amountWithFactors: number;
  deliveredAmount: number;
  remainingAmount: number;
}

export type OrderListData = ListResult<OrderDto, OrderSumRow>;

// ==================== LOADING REQUESTS (۱۱.۵ / ۹.۵ — نمای Read در فاز ۲) ====================

export interface LoadingRequestDto {
  id: string;
  requestNumber: string;
  submittedAt: string;
  requestDate: string;
  productId: string;
  productName: string;
  carrierName: string | null;
  requestedQty: number;
  deliveredQty: number;
  remainingQty: number;
  status: LoadingRequestStatus;
  reviewedByNote: string | null;
  hasDelivery: boolean;
  deliveryId: string | null;
}

export interface LoadingRequestSumRow {
  requestedQty: number;
  deliveredQty: number;
}

export type LoadingRequestListData = ListResult<LoadingRequestDto, LoadingRequestSumRow>;

// ==================== LOADING REQUESTS — نوشتن (فاز ۳: ۹.۵ / ۱۱.۵) ====================

/**
 * بدنه ثبت درخواست اعلام بار جدید توسط مشتری (BR-07).
 * ⚠️ customerId هرگز از این بدنه خوانده نمی‌شود؛ همیشه از JWT (بخش ۶.۲).
 * تاریخ درخواستی هم سمت Backend اجبار می‌شود که «فردا» باشد (BR-04)، نه از ورودی.
 */
export interface CreateLoadingRequestInput {
  orderId: string;
  productId: string;
  requestedQty: number;
  vehicleType: VehicleType;
  loadType: LoadType;
  destinationCity: string;
  additionalAddress?: string;
  destinationPostalCode?: string;
  recipientMobile: string;
  carrierId?: string;
}

/** بدنه رد درخواست توسط ادمین (BR-11: دلیل اجباری). */
export interface RejectLoadingRequestInput {
  reason: string;
}


// ==================== DELIVERIES (۱۱.۶ / ۹.۶) ====================

export type DeliveryView = 'detail' | 'by-product' | 'by-date';

export interface DeliveryDto {
  id: string;
  weighingNumber: string;
  loadingRequestId: string | null;
  loadingRequestNumber: string | null;
  deliveryDate: string;
  carrierName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  productId: string;
  productName: string;
  deliveredQty: number;
  basePrice: number;
  baseAmount: number;
  vatAmount: number;
  deductions: number;
  amountWithFactors: number;
  status: DeliveryStatus;
}

/** ردیف نمای «سرجمع محصول» یا «سرجمع تاریخ». */
export interface DeliveryGroupRow {
  groupKey: string;
  groupLabel: string;
  deliveredQty: number;
  baseAmount: number;
  vatAmount: number;
  deductions: number;
  amountWithFactors: number;
}

export interface DeliverySumRow {
  deliveredQty: number;
  baseAmount: number;
  vatAmount: number;
  deductions: number;
  amountWithFactors: number;
}

export type DeliveryListData = ListResult<DeliveryDto, DeliverySumRow>;
export type DeliveryGroupData = ListResult<DeliveryGroupRow, DeliverySumRow>;

// ==================== FINANCE (۱۱.۳ / ۹.۳) ====================

export interface FinanceTransactionDto {
  id: string;
  date: string;
  docNumber: string;
  operationType: string;
  bankName: string | null;
  accountNumber: string | null;
  amount: number;
  description: string | null;
  dueDate: string | null;
  status: string;
}

export interface FinanceTransactionSumRow {
  amount: number;
}

export type FinanceTransactionListData = ListResult<
  FinanceTransactionDto,
  FinanceTransactionSumRow
>;

export interface FinanceStatusStatementDto {
  id: string;
  docNumber: string;
  date: string;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export interface FinanceStatusStatementSumRow {
  debit: number;
  credit: number;
}

export type FinanceStatusStatementListData = ListResult<
  FinanceStatusStatementDto,
  FinanceStatusStatementSumRow
>;

export interface FinanceStatementDto {
  id: string;
  docNumber: string;
  date: string;
  description: string | null;
  amount: number;
}

/** گزارش دارایی — کارت‌های خلاصه به‌جای جدول (۹.۳). */
export interface FinanceAssetReportDto {
  creditLimit: number | null;
  creditBalance: number | null;
  currentBalance: number | null;
}

export interface PaymentReceiptDto {
  id: string;
  amount: number | null;
  description: string | null;
  uploadedAt: string;
  status: ReceiptStatus;
  reviewNote: string | null;
}

// ==================== DASHBOARD (۱۱.۲ / ۹.۲) ====================

export interface DashboardKpis {
  accountBalance: number | null;
  activeOrderCount: number;
  remainingQtyTotal: number;
  currentMonthDelivered: number;
  lastLoadingRequest: {
    requestNumber: string;
    status: LoadingRequestStatus;
    submittedAt: string;
  } | null;
  lastStatement: {
    docNumber: string;
    date: string;
    amount: number;
  } | null;
  creditBalance: number | null;
  creditLimit: number | null;
  lastComplaint: {
    subject: string;
    status: string;
    submittedAt: string;
  } | null;
}

export interface DashboardProductRow {
  productId: string;
  erpCode: string;
  name: string;
  type: ProductType;
  remainingAllowance: number;
  todayLoading: number;
  todayDelivery: number;
}

export interface DashboardUserInfo {
  name: string;
  customerCode: string;
  nationalId: string | null;
  economicCode: string | null;
  address: string | null;
  postalCode: string | null;
  mobile: string;
}

export interface DashboardSummaryDto {
  kpis: DashboardKpis;
  products: DashboardProductRow[];
  userInfo: DashboardUserInfo;
}

export interface DeliveryTrendPoint {
  label: string;
  delivered: number;
}

export interface DeliveryTrendDto {
  points: DeliveryTrendPoint[];
}
