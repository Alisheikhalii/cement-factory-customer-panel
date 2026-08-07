/**
 * Enumها — عیناً منطبق بر Prisma Schema بخش ۵.۳ PRD.
 * تغییر نام یا مقدار بدون تایید صریح ممنوع است (instruction.md §3).
 */

export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum ProductType {
  BAGGED = 'BAGGED', // پاکتی
  BULK = 'BULK', // فله
}

export enum OrderStatus {
  IN_USE = 'IN_USE', // در حال استفاده
  COMPLETED = 'COMPLETED', // تکمیل‌شده
  EXPIRED = 'EXPIRED', // منقضی
}

/**
 * منشأ ایجاد سفارش.
 * MANUAL → ثبت دستی توسط ادمین (فاز پایلوت، بدون ERP).
 * ERP_SYNC → همگام‌سازی خودکار از ERP (رفتار پیش‌فرض بعد از پایلوت).
 */
export enum OrderSource {
  MANUAL = 'MANUAL',
  ERP_SYNC = 'ERP_SYNC',
}

export enum VehicleType {
  TRAILER = 'TRAILER', // تریلی
  FLATBED = 'FLATBED', // کفی
  DUMP = 'DUMP', // کمپرسی
  TEN_WHEEL = 'TEN_WHEEL', // ده چرخ
}

export enum LoadType {
  FIXED = 'FIXED', // فیکس
  NON_FIXED = 'NON_FIXED', // غیرفیکس
}

export enum CarrierSetBy {
  CUSTOMER = 'CUSTOMER',
  FACTORY = 'FACTORY',
}

export enum LoadingRequestStatus {
  SUBMITTED = 'SUBMITTED', // ثبت شده
  APPROVED = 'APPROVED', // تایید شده
  REJECTED = 'REJECTED', // رد شده
  LOADED = 'LOADED', // بارگیری شده
  CANCELED = 'CANCELED', // لغو شده
}

export enum DeliveryStatus {
  FINALIZED = 'FINALIZED',
  DISPUTED = 'DISPUTED',
}

export enum FinanceSourceType {
  TRANSACTION = 'TRANSACTION', // تراکنش‌ها
  STATEMENT = 'STATEMENT', // صورت حساب‌ها
  ASSET_REPORT = 'ASSET_REPORT', // گزارش دارایی
  STATUS_STATEMENT = 'STATUS_STATEMENT', // صورت وضعیت
}

export enum ReceiptStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED',
}

export enum SurveyStatus {
  DRAFT = 'DRAFT', // پیش‌نویس
  PUBLISHED = 'PUBLISHED', // منتشرشده
  CLOSED = 'CLOSED', // بسته‌شده
}

export enum ComplaintStatus {
  PENDING = 'PENDING', // در حال بررسی
  ANSWERED = 'ANSWERED', // پاسخ داده شده
}
