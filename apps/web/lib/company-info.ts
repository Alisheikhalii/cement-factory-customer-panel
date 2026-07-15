/**
 * اطلاعات تماس/برند کارخانه (بخش ۹.۱ PRD).
 * مقادیر واقعی دریافت‌شده از کارفرما (تیر ۱۴۰۵). هنگام تغییر اطلاعات تماس،
 * فقط همین فایل به‌روزرسانی می‌شود (نه Component ها).
 */
export const companyInfo = {
  name: 'سیمان خاکستری نی‌ریز',
  shortName: 'سیمان نی‌ریز',
  address: 'فارس - کیلومتر 30 جاده نی‌ریز - سیرجان',
  phones: ['07153836991'],
  /** شماره پشتیبانی فروش (کارت پایین سایدبار). */
  supportPhone: '07153836991',
  email: 'info@nyrizcement.example',
  website: 'https://nyrizcement.example',
} as const;
