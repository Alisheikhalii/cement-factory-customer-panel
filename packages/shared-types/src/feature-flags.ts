/**
 * Feature Flag های فاز پایلوت یک‌هفته‌ای — منبع واحد Frontend/Backend.
 *
 * هدف: همه تغییرهای پایلوت برگشت‌پذیر باشند بدون حذف یا بازنویسی کد.
 * جزئیات و چک‌لیست خروج از پایلوت: PILOT_MODE.md در ریشه پروژه.
 */

export const FEATURE_FLAGS = {
  /** بخش مالی (بخش ۹.۳ PRD) — در پایلوت «نمایان اما غیرفعال». */
  FINANCE_ENABLED: 'FEATURE_FINANCE_ENABLED',
  /** بخش سفارشات (بخش ۹.۴ PRD) — در پایلوت «نمایان اما غیرفعال». */
  ORDERS_ENABLED: 'FEATURE_ORDERS_ENABLED',
  /** ثبت دستی سفارش توسط ادمین (جای ERP Sync در پایلوت). */
  MANUAL_ORDER_ENTRY: 'FEATURE_MANUAL_ORDER_ENTRY',
  /** ثبت دستی تحویل توسط ادمین (تریگر دستی روی همان State Machine موجود). */
  MANUAL_DELIVERY_ENTRY: 'FEATURE_MANUAL_DELIVERY_ENTRY',
  /**
   * اعمال مهلت ۱۵:۰۰ ثبت اعلام بار (BR-04).
   * در دورهٔ پایلوت خاموش می‌شود تا تست جریان اعلام بار در هر ساعتی از شبانه‌روز
   * ممکن باشد. خاموش‌بودن فقط همین یک قید را برمی‌دارد؛ بقیهٔ اعتبارسنجی‌های
   * اعلام بار (BR-05/BR-06/BR-24) دست‌نخورده اجرا می‌شوند.
   */
  REQUEST_CUTOFF_ENFORCED: 'FEATURE_REQUEST_CUTOFF_ENFORCED',
  /**
   * انتخاب «محصول» به‌جای «سفارش» در فرم اعلام بار (دورهٔ پایلوت).
   *
   * چرا: تا وقتی ERP وصل نیست، مشتری تازه‌تعریف‌شده هیچ ردیف `Order` ندارد، پس
   * Dropdown سفارش‌ها ذاتاً خالی است و مشتری نمی‌تواند اعلام بار ثبت کند. با روشن
   * بودن این پرچم، مشتری فقط محصول را انتخاب می‌کند، مانده نمایش داده نمی‌شود و قید
   * موجودی (BR-05) اعمال نمی‌شود؛ Backend خودش سفارشِ مرجع را پیدا/ایجاد می‌کند.
   *
   * خاموش‌بودن = رفتار اصلی PRD (انتخاب سفارش دارای مانده + BR-05). بقیهٔ
   * اعتبارسنجی‌ها (BR-06 هم‌خوانی محصول، BR-24 موبایل) در هر دو حالت اجرا می‌شوند.
   */
  PILOT_PRODUCT_SELECTION: 'FEATURE_PILOT_PRODUCT_SELECTION',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * مقدار پیش‌فرض هر پرچم وقتی متغیر محیطی تعریف نشده باشد.
 *
 * ⚠️ پیش‌فرض‌ها عمداً «رفتار عادی بعد از پایلوت» است (مالی/سفارشات روشن، ثبت دستی
 * خاموش) تا فراموشی حذف یک متغیر محیطی، سامانه را در حالت پایلوت گیر نکند.
 * مقادیر دورهٔ پایلوت در `.env` صریحاً ست می‌شوند.
 */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  [FEATURE_FLAGS.FINANCE_ENABLED]: true,
  [FEATURE_FLAGS.ORDERS_ENABLED]: true,
  [FEATURE_FLAGS.MANUAL_ORDER_ENTRY]: false,
  [FEATURE_FLAGS.MANUAL_DELIVERY_ENTRY]: false,
  // پیش‌فرض روشن: مهلت BR-04 رفتار عادی سامانه است و فقط در پایلوت خاموش می‌شود.
  [FEATURE_FLAGS.REQUEST_CUTOFF_ENFORCED]: true,
  // پیش‌فرض خاموش: انتخاب سفارش (رفتار PRD) پیش‌فرض است و فقط در پایلوت روشن می‌شود.
  [FEATURE_FLAGS.PILOT_PRODUCT_SELECTION]: false,
};

/** پاسخ Endpoint عمومی `GET /feature-flags` — مصرف Frontend. */
export type FeatureFlagsDto = Record<FeatureFlag, boolean>;
