/**
 * قالب‌بندی اعداد/تاریخ فارسی — یک منبع واحد برای همه صفحات (DRY، بخش ۱۰.۷).
 */

/** عدد با جداکننده هزارگان فارسی. مقدار null/undefined → «—». */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString('fa-IR');
}

/** مبلغ ریالی با پسوند «ریال». */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toLocaleString('fa-IR')} ریال`;
}

/**
 * تبدیل ISO string به تاریخ جلالی خوانا (مثلاً ۱۴۰۳/۰۵/۲۱).
 * از Intl با تقویم persian استفاده می‌کند (بدون وابستگی اضافه).
 */
export function formatJalaliDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
