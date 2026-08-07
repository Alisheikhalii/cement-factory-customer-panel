/**
 * قالب‌بندی اعداد/تاریخ فارسی — یک منبع واحد برای همه صفحات (DRY، بخش ۱۰.۷).
 */

/**
 * نمایانگر «مقدار در دسترس نیست».
 * قرارداد سراسری پورتال: هر سلول/مقدار null یا undefined با همین نشانه نمایش داده
 * می‌شود، نه صفر و نه رشتهٔ خالی — چون صفر یک مقدار واقعی و گمراه‌کننده است.
 */
export const EMPTY_VALUE = '—';

/** عدد با جداکننده هزارگان فارسی. مقدار null/undefined → «—». */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }
  return value.toLocaleString('fa-IR');
}

/** مبلغ ریالی با پسوند «ریال». */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }
  return `${value.toLocaleString('fa-IR')} ریال`;
}

/**
 * تبدیل ISO string به تاریخ جلالی خوانا (مثلاً ۱۴۰۳/۰۵/۲۱).
 * از Intl با تقویم persian استفاده می‌کند (بدون وابستگی اضافه).
 */
export function formatJalaliDate(iso: string | null | undefined): string {
  if (!iso) {
    return EMPTY_VALUE;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_VALUE;
  }
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** متن آزاد؛ خالی/null → «—». برای ستون‌های غیرعددی جدول. */
export function formatText(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return EMPTY_VALUE;
  }
  return value;
}
