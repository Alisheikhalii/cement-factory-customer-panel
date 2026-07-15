/**
 * اعتبارسنج‌های مشترک Frontend/Backend (instruction.md §3 — DRY).
 * هرگز نباید در دو طرف کپی دستی شوند.
 */

/**
 * اعتبارسنجی کد ملی ایران با الگوریتم Checksum استاندارد (بخش ۶.۱ و ۹.۱ PRD).
 * - دقیقاً ۱۰ رقم عددی
 * - ارقام یکسان (مثل 0000000000) نامعتبر
 * - رقم کنترل مطابق مجموع وزنی
 */
export function isValidIranianNationalId(input: string): boolean {
  if (!/^\d{10}$/.test(input)) {
    return false;
  }
  // ارقام کاملاً یکسان از نظر الگوریتم معتبرند اما در عمل جعلی‌اند
  if (/^(\d)\1{9}$/.test(input)) {
    return false;
  }

  const digits = input.split('').map((d) => Number.parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (digits[i] ?? 0) * (10 - i);
  }
  const remainder = sum % 11;
  const controlDigit = digits[9] ?? -1;

  return remainder < 2 ? controlDigit === remainder : controlDigit === 11 - remainder;
}
