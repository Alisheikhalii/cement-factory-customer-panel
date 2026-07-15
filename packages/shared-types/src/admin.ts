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
  customerCode: string;
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
  customerCode: string;
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
 * پاسخ ایجاد مشتری: مشتری ساخته‌شده + رمز موقت تولیدشده (BR-26).
 * رمز موقت فقط همین‌جا یک‌بار برگردانده می‌شود تا ادمین به مشتری اطلاع دهد.
 */
export interface CreateCustomerResult {
  customer: AdminCustomerDto;
  temporaryPassword: string;
}

/** پاسخ بازنشانی رمز مشتری (رمز موقت جدید). */
export interface ResetCustomerPasswordResult {
  temporaryPassword: string;
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
    customerCode: string;
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
