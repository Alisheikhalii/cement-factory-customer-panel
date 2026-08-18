'use client';

import { useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { EMPTY_VALUE } from '../../lib/format';

/** تعریف یک ستون SmartTable (بخش ۱۰.۷). */
export interface SmartColumn<T> {
  key: string;
  header: string;
  /** رندر سفارشی سلول؛ اگر نباشد، مقدار خام row[key] نمایش داده می‌شود. */
  render?: (row: T) => React.ReactNode;
  numeric?: boolean;
  /** مقدار ردیف جمع برای این ستون (Footer). */
  sumRender?: () => React.ReactNode;
  /**
   * ستون قابل مرتب‌سازی. فقط وقتی اثر دارد که جدول Prop `sort` هم گرفته باشد؛
   * پس جداولی که مرتب‌سازی ندارند دقیقاً مثل قبل رندر می‌شوند.
   */
  sortable?: boolean;
}

/**
 * وضعیت مرتب‌سازی (اختیاری). مرتب‌سازی سمت سرور انجام می‌شود، نه روی ردیف‌های همین
 * صفحه؛ وگرنه با صفحه‌بندی نتیجه گمراه‌کننده می‌شد (فقط صفحه جاری مرتب می‌شد).
 */
export interface SmartTableSort {
  key: string;
  dir: 'asc' | 'desc';
  onChange: (key: string, dir: 'asc' | 'desc') => void;
}

export interface SmartTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * انتخاب چندتایی ردیف‌ها (اختیاری) برای عملیات گروهی.
 *
 * فقط ردیف‌های «همین صفحهٔ فیلترشده» را پوشش می‌دهد: چک‌باکس سرستون هم دقیقاً روی
 * همان ردیف‌های قابل‌مشاهده عمل می‌کند، نه روی کل نتیجهٔ سرور — وگرنه ادمین چیزی
 * را تایید می‌کرد که ندیده است.
 */
export interface SmartTableSelection<T> {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /**
   * ردیف واجد شرایط انتخاب است؟ ردیف‌های ناواجد چک‌باکسِ غیرفعال می‌گیرند تا
   * دلیلِ نبودِ انتخاب برای ادمین روشن باشد (به‌جای اینکه ستون خالی بماند).
   */
  isSelectable?: (row: T) => boolean;
  /** توضیح چک‌باکس غیرفعال (title) — مثلاً «فقط درخواست‌های در انتظار بررسی». */
  disabledTitle?: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

/**
 * نرمال‌سازی null-safe محتوای یک سلول (رفتار عمومی بخش ۱۰.۷ — نه استثنای پایلوت).
 *
 * هر مقدار «نبودِ داده» با «—» نمایش داده می‌شود، نه صفر و نه سلول خالی. این برای هر
 * دادهٔ ناقصی درست است: صفر یک مقدار واقعی است و نباید جای «نامعلوم» را بگیرد.
 * ⚠️ عدد صفر و `false` مقادیر معتبرند و دست‌نخورده رد می‌شوند.
 */
function nullSafeCell(value: React.ReactNode): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE;
  }
  return value;
}

/**
 * چک‌باکس با حالت سوم «بخشی انتخاب‌شده» (indeterminate).
 *
 * `indeterminate` صفت DOM است و در JSX قابل ست کردن نیست، پس با ref اعمال می‌شود.
 * برچسب با `aria-label` داده می‌شود چون ستون چک‌باکس سرستون متنی ندارد.
 */
function TriStateCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  label,
  title,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  title?: string;
}): React.ReactElement {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
      {...(title === undefined ? {} : { title })}
      className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

/**
 * جدول عمومی با Sticky Header، ردیف جمع، و صفحه‌بندی (بخش ۱۰.۷).
 * یک Props API واحد برای همه صفحات لیستی (DRY) — سفارشات/اعلام‌بار/تحویل/مالی.
 * حالت‌های Loading/Empty/Error توسط DataStateView مدیریت می‌شوند (این کامپوننت فقط Success).
 */
export function SmartTable<T extends { id: string }>({
  columns,
  rows,
  hasSumRow,
  pagination,
  sort,
  selection,
  onRowClick,
}: {
  columns: SmartColumn<T>[];
  rows: T[];
  hasSumRow?: boolean;
  pagination?: SmartTablePagination;
  /** اگر داده نشود، سرستون‌ها مثل قبل متن ساده‌اند (رفتار همه جداول فعلی). */
  sort?: SmartTableSort;
  /** اگر داده نشود، ستون چک‌باکس رندر نمی‌شود (رفتار همه جداول فعلی). */
  selection?: SmartTableSelection<T>;
  onRowClick?: (row: T) => void;
}): React.ReactElement {
  const totalPages = pagination ? Math.max(Math.ceil(pagination.total / pagination.pageSize), 1) : 1;

  // چک‌باکس سرستون فقط ردیف‌های واجد شرایطِ همین صفحه را در نظر می‌گیرد.
  const isSelectable = (row: T): boolean => selection?.isSelectable?.(row) ?? true;
  const selectedIds = new Set(selection?.selectedIds ?? []);
  const eligibleRows = selection ? rows.filter(isSelectable) : [];
  const selectedEligibleCount = eligibleRows.filter((row) => selectedIds.has(row.id)).length;
  const allEligibleSelected =
    eligibleRows.length > 0 && selectedEligibleCount === eligibleRows.length;
  const someEligibleSelected = selectedEligibleCount > 0 && !allEligibleSelected;

  function toggleAll(): void {
    if (!selection) return;
    const eligibleIds = eligibleRows.map((row) => row.id);
    if (allEligibleSelected) {
      // برداشتن انتخاب فقط از ردیف‌های همین صفحه؛ انتخاب‌های دیگر دست‌نخورده می‌مانند.
      const eligibleSet = new Set(eligibleIds);
      selection.onChange(selection.selectedIds.filter((id) => !eligibleSet.has(id)));
      return;
    }
    selection.onChange([...new Set([...selection.selectedIds, ...eligibleIds])]);
  }

  function toggleOne(id: string): void {
    if (!selection) return;
    selection.onChange(
      selectedIds.has(id)
        ? selection.selectedIds.filter((selectedId) => selectedId !== id)
        : [...selection.selectedIds, id],
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="custom-scrollbar max-h-[65vh] overflow-auto">
        <table className="w-full text-right text-sm">
          <thead className="sticky top-0 z-10 bg-surface-container/80 backdrop-blur-md text-on-surface-variant">
            <tr>
              {selection && (
                <th className="w-10 border-b border-outline-variant/50 px-3 py-3">
                  <TriStateCheckbox
                    checked={allEligibleSelected}
                    indeterminate={someEligibleSelected}
                    disabled={eligibleRows.length === 0}
                    onChange={toggleAll}
                    label="انتخاب همه ردیف‌های این صفحه"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sortable = sort !== undefined && col.sortable === true;
                const active = sortable && sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`whitespace-nowrap border-b border-outline-variant/50 px-3 py-3 text-xs font-bold ${
                      col.numeric ? 'text-left' : 'text-right'
                    }`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        // کلیک روی ستون فعال جهت را برعکس می‌کند؛ ستون تازه از نزولی شروع
                        // می‌شود، چون پیش‌فرض کارتابل «جدیدترین اول» است.
                        onClick={() =>
                          sort.onChange(col.key, active && sort.dir === 'desc' ? 'asc' : 'desc')
                        }
                        className={`flex items-center gap-1 transition-colors hover:text-on-surface ${
                          col.numeric ? 'ml-auto flex-row-reverse' : ''
                        } ${active ? 'text-on-surface' : ''}`}
                      >
                        {col.header}
                        {!active && <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        {active && sort.dir === 'asc' && <ChevronUp className="h-3 w-3" />}
                        {active && sort.dir === 'desc' && <ChevronDown className="h-3 w-3" />}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-outline-variant/30 text-on-surface transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-white/70' : 'hover:bg-white/40'
                } ${selection && selectedIds.has(row.id) ? 'bg-primary/5' : ''}`}
              >
                {selection && (
                  // stopPropagation لازم است: کلیک روی چک‌باکس نباید Drawer ردیف را باز کند.
                  <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <TriStateCheckbox
                      checked={selectedIds.has(row.id)}
                      disabled={!isSelectable(row)}
                      onChange={() => toggleOne(row.id)}
                      label="انتخاب این ردیف"
                      {...(isSelectable(row) || selection.disabledTitle === undefined
                        ? {}
                        : { title: selection.disabledTitle })}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${
                      col.numeric ? 'text-left tabular-nums' : 'text-right'
                    }`}
                  >
                    {nullSafeCell(
                      col.render
                        ? col.render(row)
                        : ((row as Record<string, unknown>)[col.key] as React.ReactNode),
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hasSumRow && (
            <tfoot className="sticky bottom-0 bg-surface-container/90 backdrop-blur-md font-bold text-on-surface">
              <tr>
                {selection && <td className="w-10 px-3 py-2.5" />}
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${
                      col.numeric ? 'text-left tabular-nums' : 'text-right'
                    }`}
                  >
                    {col.sumRender
                      ? nullSafeCell(col.sumRender())
                      : index === 0
                        ? 'جمع کل'
                        : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 px-3 py-2.5 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span>تعداد ردیف:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="input-soft rounded-md px-2 py-1"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="mr-2">تعداد کل: {pagination.total.toLocaleString('fa-IR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="interactive-element flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-white/50 px-2.5 py-1.5 transition-colors hover:bg-white/80 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
              قبلی
            </button>
            <span>
              صفحه {pagination.page.toLocaleString('fa-IR')} از{' '}
              {totalPages.toLocaleString('fa-IR')}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="interactive-element flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-white/50 px-2.5 py-1.5 transition-colors hover:bg-white/80 disabled:opacity-50"
            >
              بعدی
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
