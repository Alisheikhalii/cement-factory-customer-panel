'use client';

import { ChevronRight, ChevronLeft } from 'lucide-react';

/** تعریف یک ستون SmartTable (بخش ۱۰.۷). */
export interface SmartColumn<T> {
  key: string;
  header: string;
  /** رندر سفارشی سلول؛ اگر نباشد، مقدار خام row[key] نمایش داده می‌شود. */
  render?: (row: T) => React.ReactNode;
  numeric?: boolean;
  /** مقدار ردیف جمع برای این ستون (Footer). */
  sumRender?: () => React.ReactNode;
}

export interface SmartTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 50, 100];

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
  onRowClick,
}: {
  columns: SmartColumn<T>[];
  rows: T[];
  hasSumRow?: boolean;
  pagination?: SmartTablePagination;
  onRowClick?: (row: T) => void;
}): React.ReactElement {
  const totalPages = pagination ? Math.max(Math.ceil(pagination.total / pagination.pageSize), 1) : 1;

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="custom-scrollbar max-h-[65vh] overflow-auto">
        <table className="w-full text-right text-sm">
          <thead className="sticky top-0 z-10 bg-surface-container/80 backdrop-blur-md text-on-surface-variant">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap border-b border-outline-variant/50 px-3 py-3 text-xs font-bold ${
                    col.numeric ? 'text-left' : 'text-right'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-outline-variant/30 text-on-surface transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-white/70' : 'hover:bg-white/40'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${
                      col.numeric ? 'text-left tabular-nums' : 'text-right'
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hasSumRow && (
            <tfoot className="sticky bottom-0 bg-surface-container/90 backdrop-blur-md font-bold text-on-surface">
              <tr>
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${
                      col.numeric ? 'text-left tabular-nums' : 'text-right'
                    }`}
                  >
                    {col.sumRender ? col.sumRender() : index === 0 ? 'جمع کل' : ''}
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
