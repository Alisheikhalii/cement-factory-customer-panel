'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

/**
 * ورودی انتخاب تاریخ شمسی (جلالی) — جایگزین `input[type="date"]` مرورگر که همیشه
 * تقویم میلادی نشان می‌دهد.
 *
 * PRD بخش ۱۳ (NFR): «تقویم جلالی در همهٔ تاریخ‌ها»، و بخش ۳.۱ که
 * `react-multi-date-picker` را به‌عنوان کتابخانهٔ تاریخ تعیین کرده است.
 *
 * ⚠️ فقط «نمایش» شمسی است. مقداری که این کامپوننت به بیرون می‌دهد و از بیرون
 * می‌گیرد همان رشتهٔ میلادی `YYYY-MM-DD` است — دقیقاً همان قراردادی که
 * `input[type="date"]` داشت. پس Backend، DTOها، فیلترهای Prisma و مرتب‌سازی
 * هیچ تغییری نمی‌بینند و مرتب‌سازی همچنان روی مقدار واقعی زمانی انجام می‌شود،
 * نه روی رشتهٔ شمسیِ نمایش‌داده‌شده.
 */
export function JalaliDateInput({
  value,
  onChange,
  id,
  disabled = false,
  required = false,
  placeholder,
  inputClassName = '',
  containerClassName = '',
  clearable = false,
  portal = false,
}: {
  /** مقدار میلادی به شکل `YYYY-MM-DD`؛ رشتهٔ خالی = انتخاب‌نشده. */
  value: string;
  /** مقدار جدید، همیشه میلادی `YYYY-MM-DD` (یا رشتهٔ خالی وقتی پاک شود). */
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** کلاس فیلد ورودی (مثل `input-glass ...` یا `border-slate-300 ...`). */
  inputClassName?: string;
  containerClassName?: string;
  /** دکمهٔ «پاک کردن» برای فیلترهای اختیاری (مثل بازهٔ تاریخ کارتابل). */
  clearable?: boolean;
  /** برای فرم‌های داخل Drawer/Modal که `overflow` دارند تا تقویم بریده نشود. */
  portal?: boolean;
}): React.ReactElement {
  // تبدیل رشتهٔ میلادی به Date نیمه‌شبِ محلی (نه UTC) تا اختلاف منطقهٔ زمانی
  // باعث یک‌روز جابه‌جایی در تاریخ نمایش‌داده‌شده نشود.
  const selected = useMemo(() => gregorianYmdToLocalDate(value), [value]);

  return (
    <span className={`inline-flex items-center gap-1 ${containerClassName}`}>
      <DatePicker
        id={id}
        value={selected}
        onChange={(picked) => {
          if (picked === null) {
            onChange('');
            return;
          }
          onChange(localDateToGregorianYmd(picked.toDate()));
        }}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        disabled={disabled}
        required={required}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(portal ? { portal: true } : {})}
        editable={false}
        inputClass={inputClassName}
        containerClassName={containerClassName === '' ? undefined : containerClassName}
      />
      {clearable && value !== '' && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="پاک کردن تاریخ"
          title="پاک کردن تاریخ"
          className="rounded p-0.5 text-on-surface-variant hover:bg-black/5 hover:text-on-surface"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

/**
 * `YYYY-MM-DD` میلادی → `Date` نیمه‌شبِ محلی. مقدار نامعتبر/خالی → `null`
 * (تقویم آن را «انتخاب‌نشده» می‌گیرد).
 */
function gregorianYmdToLocalDate(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const parts = ymd.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `Date` → `YYYY-MM-DD` میلادی با اجزای محلی.
 *
 * عمداً از `toISOString()` استفاده نمی‌شود: آن به UTC تبدیل می‌کند و برای تهران
 * (+۳:۳۰) تاریخ را یک روز عقب می‌برد.
 */
function localDateToGregorianYmd(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
