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

/**
 * سفارش قابل انتخاب در Dropdown فرم اعلام بار (بخش ۹.۵).
 *
 * ⚠️ عمداً هیچ ستون مالی ندارد: در دورهٔ پایلوت پرچم `ORDERS_ENABLED` خاموش است تا
 * مشتری بخش سفارشات (با مبالغ) را نبیند؛ فرم اعلام بار فقط به شناسه/شماره/محصول و
 * مانده نیاز دارد، پس همان حداقل برگردانده می‌شود و قصد آن پرچم نقض نمی‌شود (BR-18).
 */
export interface SelectableOrderDto {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  remainingQty: number;
}

/**
 * محصول قابل انتخاب در فرم اعلام بار وقتی `FEATURE_PILOT_PRODUCT_SELECTION` روشن است.
 *
 * در این حالت مشتری «سفارش» انتخاب نمی‌کند (چون تا اتصال ERP ممکن است هیچ سفارشی
 * نداشته باشد)؛ فقط محصول را انتخاب می‌کند و سفارشِ مرجع سمت Backend حل می‌شود.
 * ⚠️ عمداً هیچ فیلد مالی و هیچ «مانده»‌ای ندارد.
 */
export interface SelectableProductDto {
  id: string;
  name: string;
}

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
  /**
   * سفارش انتخابی. در حالت عادی (PRD) اجباری است.
   * ⚠️ وقتی `FEATURE_PILOT_PRODUCT_SELECTION` روشن باشد مشتری سفارش انتخاب نمی‌کند و
   * این فیلد ارسال نمی‌شود؛ Backend سفارشِ مرجع را از `productId` حل می‌کند. با خاموش
   * بودن پرچم، نبودِ این فیلد خطای ORDER_001 می‌دهد، پس رفتار قبلی حفظ می‌شود.
   */
  orderId?: string;
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

/**
 * بدنهٔ تایید گروهی اعلام بار در کارتابل ادمین.
 * فقط شناسه‌ها؛ خودِ Transition همان `approve` تک‌رکوردی است (بدون مسیر کد موازی).
 */
export interface BulkApproveLoadingRequestsInput {
  ids: string[];
}

/** یک ردیفِ رد‌شده در تایید گروهی، با دلیلِ خوانا برای نمایش به ادمین. */
export interface BulkApproveSkippedItem {
  id: string;
  /** پیام خطای همان درخواست (مثلاً «وضعیت فعلی اجازهٔ این تغییر را نمی‌دهد»). */
  reason: string;
}

/**
 * نتیجهٔ تایید گروهی: هر درخواست مستقل بررسی می‌شود، پس یک ردیفِ نامعتبر
 * (مثلاً ادمین دیگری قبلاً رویش اقدام کرده) کل دسته را شکست نمی‌دهد — فقط
 * در `skipped` گزارش می‌شود.
 */
export interface BulkApproveLoadingRequestsResult {
  approvedCount: number;
  skippedCount: number;
  /** شناسهٔ درخواست‌هایی که با موفقیت SUBMITTED → APPROVED شدند. */
  approvedIds: string[];
  skipped: BulkApproveSkippedItem[];
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
  /** موبایل راننده — اختیاری چون ERP ممکن است ارسال نکند. */
  driverMobile: string | null;
  productId: string;
  productName: string;
  deliveredQty: number;
  /**
   * فیلدهای مالی Nullable هستند: در تحویل ثبت‌دستی این مقادیر در دسترس نیست و
   * `null` می‌ماند (نه صفر). Frontend برای `null` باید «—» نشان دهد، نه عدد.
   */
  basePrice: number | null;
  baseAmount: number | null;
  vatAmount: number | null;
  deductions: number;
  amountWithFactors: number | null;
  status: DeliveryStatus;
}

/**
 * ردیف نمای «سرجمع محصول» یا «سرجمع تاریخ».
 * ستون‌های مالی وقتی هیچ رکورد دارای مقدار نباشد `null` می‌مانند (نه صفر).
 */
export interface DeliveryGroupRow {
  groupKey: string;
  groupLabel: string;
  deliveredQty: number;
  baseAmount: number | null;
  vatAmount: number | null;
  deductions: number;
  amountWithFactors: number | null;
}

/**
 * ردیف جمع کل. جمع فقط روی مقادیر غیر-null محاسبه می‌شود؛ اگر همه رکوردهای بازه
 * `null` باشند (کل دورهٔ پایلوت) خودِ جمع هم `null` است تا Frontend «—» نشان دهد.
 */
export interface DeliverySumRow {
  deliveredQty: number;
  baseAmount: number | null;
  vatAmount: number | null;
  deductions: number;
  amountWithFactors: number | null;
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
