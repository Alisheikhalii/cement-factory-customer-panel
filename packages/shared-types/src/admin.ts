/**
 * DTOهای داشبورد ادمین — بخش ۹.۹ و ۱۱.۱۰ PRD.
 * منبع واحد قرارداد Front/Back (instruction.md §3).
 */

import type {
  ComplaintStatus,
  LoadingRequestStatus,
  SurveyStatus,
} from './enums';

// ==================== ADMIN DASHBOARD (۹.۹.۱ / ۱۱.۱۰) ====================

export interface AdminDashboardKpis {
  totalCustomers: number;
  activeOrders: number;
  pendingLoadingRequests: number;
  todayDelivered: number;
  weekDelivered: number;
  pendingComplaints: number;
  activeSurvey: { id: string; title: string; answerCount: number } | null;
  onlineUsers: number;
}

/** یک ردیف فید Latest Activities از AuditLog (۹.۹.۱ بخش ۲). */
export interface AdminActivityDto {
  id: string;
  text: string;
  createdAt: string;
}

export interface AdminDeliveryTrendPoint {
  label: string;
  delivered: number;
}

/** نمودار روزانه ثبت اعلام بار به تفکیک وضعیت (۹.۹.۱ بخش ۴). */
export interface AdminLoadingRequestTrendPoint {
  label: string;
  approved: number;
  rejected: number;
  pending: number;
}

// ==================== ADMIN CUSTOMERS (۹.۹.۲ / ۱۱.۱۰) ====================

export interface AdminCustomerDto {
  id: string;
  /** `null` = کد تفصیل هنوز ثبت نشده (اختیاری است)؛ در جدول «—» نمایش می‌یابد. */
  customerCode: string | null;
  name: string;
  nationalId: string | null;
  economicCode: string | null;
  mobile: string;
  address: string | null;
  postalCode: string | null;
  creditLimit: number | null;
  isActive: boolean;
  createdAt: string;
}

/** بدنه ایجاد مشتری جدید توسط ادمین (BR-26/BR-28). */
export interface CreateCustomerInput {
  /**
   * کد تفصیل — اختیاری. در لحظهٔ ثبت همیشه از ERP در دست نیست؛ اگر داده نشود
   * مشتری با `customerCode = null` ثبت می‌شود و بعداً تکمیل می‌گردد.
   */
  customerCode?: string;
  name: string;
  nationalId: string;
  economicCode?: string;
  mobile: string;
  address?: string;
  postalCode?: string;
  creditLimit?: number;
}

/** بدنه ویرایش مشتری (فیلدهای قابل‌تغییر؛ کد ملی/کد تفصیل تغییرناپذیر). */
export interface UpdateCustomerInput {
  name?: string;
  economicCode?: string;
  mobile?: string;
  address?: string;
  postalCode?: string;
  creditLimit?: number;
}

/**
 * پاسخ ایجاد مشتری: مشتری ساخته‌شده + رمز اولیه (BR-26/BR-28).
 * رمز اولیه برابر کد ملی مشتری است و همین‌جا یک‌بار برگردانده می‌شود تا ادمین اطلاع دهد.
 * نام فیلد `temporaryPassword` حفظ شده چون «موقت» بودنش سر جای خود است: مشتری
 * در اولین ورود مجبور به تغییر آن است.
 */
export interface CreateCustomerResult {
  customer: AdminCustomerDto;
  temporaryPassword: string;
}

/** پاسخ بازنشانی رمز مشتری (رمز موقت جدید). */
export interface ResetCustomerPasswordResult {
  temporaryPassword: string;
}

/** پاسخ حذف نرم مشتری (بخش ۵.۲) — رکورد فیزیکی حذف نمی‌شود. */
export interface DeleteCustomerResult {
  deleted: true;
}

// ==================== ADMIN LOADING REQUESTS (۹.۹.۳ / ۱۱.۱۰) ====================

/** ردیف کارتابل اعلام بار ادمین (۹.۹.۳). */
export interface AdminLoadingRequestRow {
  id: string;
  requestNumber: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  requestedQty: number;
  requestDate: string;
  status: LoadingRequestStatus;
  submittedAt: string;
  /**
   * مقصد و تحویل‌گیرنده — همان فیلدهایی که مشتری در فرم اعلام بار پر می‌کند.
   * در کارتابل ادمین و خروجی Excel نمایش داده می‌شوند تا ادمین برای هماهنگی
   * بارگیری نیازی به باز کردن Drawer هر ردیف نداشته باشد.
   * `null` = مشتری پر نکرده (اختیاری‌اند)؛ در جدول «—» نمایش می‌یابد.
   */
  destinationCity: string;
  additionalAddress: string | null;
  destinationPostalCode: string | null;
  recipientMobile: string;
}

/** جزئیات کامل درخواست برای Drawer ادمین (۹.۹.۳ + BR-25). */
export interface AdminLoadingRequestDetail {
  id: string;
  requestNumber: string;
  productName: string;
  productType: string;
  vehicleType: string;
  loadType: string;
  destinationCity: string;
  additionalAddress: string | null;
  destinationPostalCode: string | null;
  recipientMobile: string;
  requestedQty: number;
  /** مانده موجودی سفارش در لحظه بررسی (BR-25). */
  orderRemainingQty: number;
  status: LoadingRequestStatus;
  requestDate: string;
  submittedAt: string;
  reviewedByNote: string | null;
  customer: {
    name: string;
    /** `null` = کد تفصیل مشتری ثبت نشده (اختیاری است). */
    customerCode: string | null;
  };
  orderNumber: string;
}

// ==================== ADMIN COMPLAINTS (۹.۹.۴ / ۱۱.۱۰) ====================

export interface AdminComplaintDto {
  id: string;
  customerName: string;
  subject: string;
  description: string;
  submittedAt: string;
  status: ComplaintStatus;
  reply: string | null;
  repliedAt: string | null;
}

export interface ReplyComplaintInput {
  reply: string;
}

// ==================== ADMIN SURVEYS (۹.۹.۵ / ۱۱.۱۰) ====================

export interface AdminSurveyListItem {
  id: string;
  title: string;
  status: SurveyStatus;
  questionCount: number;
  answerCount: number;
  createdAt: string;
  publishedAt: string | null;
  closedAt: string | null;
}

/** بدنه ایجاد نظرسنجی (فرم‌ساز ۹.۹.۵). هر سوال حداقل ۲ گزینه. */
export interface CreateSurveyInput {
  title: string;
  description?: string;
  questions: Array<{ text: string; options: string[] }>;
}

/** نتایج آماری یک گزینه (۹.۹.۵ / BR-27). */
export interface SurveyResultOption {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface SurveyResultQuestion {
  questionId: string;
  text: string;
  options: SurveyResultOption[];
}

export interface SurveyResultsDto {
  id: string;
  title: string;
  status: SurveyStatus;
  totalRespondents: number;
  questions: SurveyResultQuestion[];
}

// ==================== ADMIN MANUAL ORDERS (پایلوت یک‌هفته‌ای) ====================

/**
 * بدنه ثبت دستی سفارش توسط ادمین (Task 2 — فاز پایلوت).
 * پشت FEATURE_MANUAL_ORDER_ENTRY=true.
 */
export interface CreateManualOrderInput {
  customerId: string;
  productId: string;
  /** مقدار اولیه سفارش به تن. */
  totalQty: number;
}

/** بدنه ویرایش مقدار سفارش دستی (مثلاً مشتری مقدار خرید را اصلاح کرد). */
export interface UpdateManualOrderQtyInput {
  /** مقدار جدید (باید >= تحویل‌شده تا الان). */
  newTotalQty: number;
}

/** ردیف سفارش دستی برای لیست ادمین (فیلدهای مرتبط با ثبت دستی). */
export interface AdminManualOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  totalQty: number;
  remainingQty: number;
  createdAt: string;
}
