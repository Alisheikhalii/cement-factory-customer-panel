/**
 * سربرگ مشترک گزارش‌های PDF (بخش ۹.۶).
 * ⚠️ لوگو/نام واقعی نی‌ریز هنوز دریافت نشده؛ فعلاً نام متنی Placeholder.
 * هنگام دریافت لوگوی رسمی، فقط همین فایل به‌روزرسانی می‌شود.
 */
const COMPANY_NAME = 'سامانه خدمات الکترونیک مشتریان سیمان خاکستری نی‌ریز';

export function companyPdfHeader(reportTitle: string): string {
  return `
  <div class="header">
    <div class="title">${COMPANY_NAME}</div>
    <div class="title" style="font-size:13px;margin-top:2px;">${reportTitle}</div>
  </div>`;
}
