/**
 * رویدادهای سیستم که Notification تولید می‌کنند — ماتریس بخش ۱۷ PRD.
 *
 * منطق تصمیم‌گیری «به چه کسی» فقط در `NotificationService` قرار دارد و در
 * Controllerها/Serviceهای مختلف تکرار نمی‌شود (بخش ۱۷).
 */
export enum NotificationEvent {
  /** ثبت درخواست اعلام بار جدید → همه ادمین‌ها (Broadcast). */
  LOADING_REQUEST_SUBMITTED = 'LOADING_REQUEST_SUBMITTED',
  /** تایید درخواست → همان مشتری. */
  LOADING_REQUEST_APPROVED = 'LOADING_REQUEST_APPROVED',
  /** رد درخواست (با دلیل) → همان مشتری. */
  LOADING_REQUEST_REJECTED = 'LOADING_REQUEST_REJECTED',
  /** لغو درخواست توسط مشتری → همه ادمین‌ها. */
  LOADING_REQUEST_CANCELED = 'LOADING_REQUEST_CANCELED',
  /** تکمیل بارگیری (LOADED) → همان مشتری. */
  LOADING_REQUEST_LOADED = 'LOADING_REQUEST_LOADED',
  /** ثبت شکایت جدید → همه ادمین‌ها (فاز ۴). */
  COMPLAINT_SUBMITTED = 'COMPLAINT_SUBMITTED',
  /** پاسخ به شکایت → همان مشتری (فاز ۴.۵). */
  COMPLAINT_ANSWERED = 'COMPLAINT_ANSWERED',
  /** انتشار نظرسنجی جدید → همه مشتریان فعال (Broadcast مشتری، فاز ۴.۵). */
  SURVEY_PUBLISHED = 'SURVEY_PUBLISHED',
  /** بارگذاری فیش واریزی توسط مشتری → همه ادمین‌ها. */
  RECEIPT_UPLOADED = 'RECEIPT_UPLOADED',
  /** ایجاد مشتری جدید توسط ادمین → سایر ادمین‌ها. */
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
}

/** داده لازم برای متن هر Notification مربوط به اعلام بار. */
export interface LoadingRequestEventPayload {
  /** مشتری مرتبط با رویداد (برای ارسال به همان مشتری یا نمایش نام به ادمین). */
  customerId: string;
  customerName: string;
  requestNumber: string;
  /** فقط برای رویداد REJECTED لازم است. */
  reason?: string;
}

/** داده رویداد شکایت (بخش ۱۷). */
export interface ComplaintEventPayload {
  customerId: string;
  customerName: string;
}

/** داده رویداد نظرسنجی (بخش ۱۷) — Broadcast به همه مشتریان فعال. */
export interface SurveyEventPayload {
  surveyTitle: string;
}

/** داده رویداد فیش واریزی (بخش ۱۷). */
export interface ReceiptEventPayload {
  customerName: string;
}

/** داده رویداد ایجاد مشتری جدید (بخش ۱۷). */
export interface CustomerCreatedEventPayload {
  customerName: string;
  adminName: string;
}
