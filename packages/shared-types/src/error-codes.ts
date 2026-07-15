/**
 * کاتالوگ خطاها — بخش ۱۶ PRD.
 * مرجع واحد Frontend/Backend. هیچ کد خطا نباید جای دیگری Hardcode شود
 * (instruction.md §7 و قانون بخش ۱۶).
 */

export interface ErrorDefinition {
  /** کد یکتای خطا (مثلاً LOAD_002) */
  code: string;
  /** HTTP Status متناظر */
  httpStatus: number;
  /** پیام پیش‌فرض فارسی برای نمایش به کاربر */
  message: string;
}

export const ERROR_CODES = {
  AUTH_001: {
    code: 'AUTH_001',
    httpStatus: 401,
    message: 'نام کاربری یا رمز عبور اشتباه است',
  },
  AUTH_002: {
    code: 'AUTH_002',
    httpStatus: 429,
    message: 'حساب شما موقتاً قفل شده؛ لطفاً ۱۵ دقیقه دیگر تلاش کنید',
  },
  AUTH_003: {
    code: 'AUTH_003',
    httpStatus: 401,
    message: 'نشست شما منقضی شده، دوباره وارد شوید',
  },
  AUTH_004: {
    code: 'AUTH_004',
    httpStatus: 403,
    message: 'شما دسترسی لازم برای این بخش را ندارید',
  },
  AUTH_005: {
    code: 'AUTH_005',
    httpStatus: 403,
    message: 'درخواست نامعتبر است؛ لطفاً صفحه را تازه‌سازی کرده و دوباره وارد شوید',
  },
  ORDER_001: {
    code: 'ORDER_001',
    httpStatus: 404,
    message: 'سفارش مورد نظر یافت نشد',
  },
  LOAD_001: {
    code: 'LOAD_001',
    httpStatus: 422,
    message: 'مقدار درخواستی بیشتر از باقیمانده سفارش شماست',
  },
  LOAD_002: {
    code: 'LOAD_002',
    httpStatus: 422,
    message: 'مهلت ثبت درخواست برای فردا به پایان رسیده است',
  },
  LOAD_003: {
    code: 'LOAD_003',
    httpStatus: 422,
    message: 'تاریخ درخواستی باید فردا باشد',
  },
  LOAD_004: {
    code: 'LOAD_004',
    httpStatus: 409,
    message: 'امکان لغو درخواست بارگیری‌شده وجود ندارد',
  },
  LOAD_005: {
    code: 'LOAD_005',
    httpStatus: 422,
    message: 'موجودی این محصول برای شما کافی نیست',
  },
  LOAD_006: {
    code: 'LOAD_006',
    httpStatus: 422,
    message: 'شماره موبایل تحویل‌گیرنده الزامی است',
  },
  SURVEY_001: {
    code: 'SURVEY_001',
    httpStatus: 409,
    message: 'شما قبلاً به این نظرسنجی پاسخ داده‌اید',
  },
  SURVEY_002: {
    code: 'SURVEY_002',
    httpStatus: 422,
    message: 'لطفاً به همه سوالات پاسخ دهید',
  },
  SURVEY_003: {
    code: 'SURVEY_003',
    httpStatus: 404,
    message: 'این نظرسنجی دیگر فعال نیست',
  },
  COMPLAINT_001: {
    code: 'COMPLAINT_001',
    httpStatus: 422,
    message: 'موضوع و شرح شکایت الزامی است',
  },
  RECEIPT_001: {
    code: 'RECEIPT_001',
    httpStatus: 422,
    message: 'فرمت فایل باید jpg، png یا pdf باشد',
  },
  RECEIPT_002: {
    code: 'RECEIPT_002',
    httpStatus: 413,
    message: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد',
  },
  ADMIN_001: {
    code: 'ADMIN_001',
    httpStatus: 409,
    message: 'مشتری‌ای با این کد ملی از قبل وجود دارد',
  },
  ADMIN_002: {
    code: 'ADMIN_002',
    httpStatus: 422,
    message: 'برای رد درخواست، ذکر دلیل الزامی است',
  },
  CONTACT_001: {
    code: 'CONTACT_001',
    httpStatus: 429,
    message: 'تعداد پیام‌های ارسالی زیاد است؛ لطفاً کمی بعد دوباره تلاش کنید',
  },
  ERP_001: {
    code: 'ERP_001',
    httpStatus: 503,
    message: 'خطا در دریافت اطلاعات؛ لطفاً بعداً تلاش کنید',
  },
  GENERIC_500: {
    code: 'GENERIC_500',
    httpStatus: 500,
    message: 'خطایی رخ داده است؛ لطفاً بعداً تلاش کنید',
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_CODES;
