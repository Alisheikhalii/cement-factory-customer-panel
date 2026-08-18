'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ClipboardList, Loader2, X } from 'lucide-react';
import { LoadingRequestStatus } from '@cement/shared-types';
import type {
  AdminLoadingRequestRow,
  BulkApproveLoadingRequestsResult,
} from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { formatJalaliDate, formatNumber } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { ExportButtons } from '../../../components/shared/ExportButtons';
import { JalaliDateInput } from '../../../components/shared/JalaliDateInput';
import { SmartTable, type SmartColumn } from '../../../components/shared/SmartTable';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { LoadingRequestDrawer } from './LoadingRequestDrawer';

export default function AdminLoadingRequestsPage(): React.ReactElement {
  const user = useRequireAdmin();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // پیش‌فرض کارتابل روی «در انتظار بررسی» (بخش ۹.۹.۳).
  const [status, setStatus] = useState<string>(LoadingRequestStatus.SUBMITTED);
  // بازهٔ «تاریخ ثبت» برای گرفتن خروجی یک روز مشخص. خالی = بدون محدودیت تاریخ.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // مرتب‌سازی سمت سرور؛ پیش‌فرض همان «جدیدترین ثبت اول» کارتابل.
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // انتخاب چندتایی برای تایید گروهی — فقط ردیف‌های همین صفحهٔ فیلترشده.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    return params.toString();
  }, [page, pageSize, status, from, to, sortBy, sortDir]);

  /**
   * مسیر خروجی Excel: همان فیلتر/مرتب‌سازی جدول، ولی بدون صفحه‌بندی — فایل باید کل
   * نتیجهٔ فیلترشده را داشته باشد، نه فقط صفحهٔ جاری را.
   */
  const excelQuery = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.delete('page');
    params.delete('pageSize');
    return params.toString();
  }, [queryString]);

  const { state, data, reload } = useApiData<{ rows: AdminLoadingRequestRow[]; total: number }>(
    async () => {
      const res = await apiClient.getWithMeta<AdminLoadingRequestRow[]>(
        `/admin/loading-requests?${queryString}`,
      );
      return { rows: res.data, total: res.meta?.total ?? res.data.length };
    },
    [queryString],
  );

  const rows = data?.rows ?? [];

  /**
   * با هر تغییر فیلتر/صفحه/مرتب‌سازی انتخاب پاک می‌شود.
   *
   * لازم است چون «تایید انتخاب‌شده‌ها» فقط باید روی ردیف‌هایی اجرا شود که ادمین
   * همان لحظه می‌بیند؛ نگه داشتن انتخاب بین صفحه‌ها یعنی تایید ردیف‌های نادیده.
   */
  useEffect(() => {
    setSelectedIds([]);
    setBulkError(null);
  }, [queryString]);

  const selectedCount = selectedIds.length;

  /**
   * تایید گروهی: یک درخواست به Backend که برای هر شناسه همان Transition تک‌رکوردی
   * (`SUBMITTED → APPROVED`) را اجرا می‌کند. ردیفی که دیگر SUBMITTED نیست skip
   * می‌شود و در خلاصه گزارش می‌شود، پس کل دسته شکست نمی‌خورد.
   */
  async function bulkApprove(): Promise<void> {
    if (selectedCount === 0) return;
    setBulkError(null);
    setBulkSummary(null);
    setBulkBusy(true);
    try {
      const result = await apiClient.patch<BulkApproveLoadingRequestsResult>(
        '/admin/loading-requests/bulk-approve',
        { ids: selectedIds },
      );
      // خلاصه پیش از reload ساخته می‌شود: شمارهٔ درخواست‌ها از ردیف‌های همین صفحه
      // خوانده می‌شود و ردیف‌های تاییدشده بعد از reload از فیلتر SUBMITTED می‌روند.
      setBulkSummary(summarizeBulkApprove(result, rows));
      setSelectedIds([]);
      reload();
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : 'تایید گروهی ناموفق بود');
    } finally {
      setBulkBusy(false);
    }
  }

  const columns: SmartColumn<AdminLoadingRequestRow>[] = [
    { key: 'requestNumber', header: 'شماره درخواست', sortable: true },
    { key: 'customerName', header: 'نام مشتری', sortable: true },
    { key: 'orderNumber', header: 'شماره سفارش' },
    { key: 'productName', header: 'محصول' },
    {
      key: 'requestedQty',
      header: 'مقدار درخواستی',
      numeric: true,
      sortable: true,
      render: (r) => formatNumber(r.requestedQty),
    },
    {
      key: 'requestDate',
      header: 'تاریخ بارگیری',
      sortable: true,
      render: (r) => formatJalaliDate(r.requestDate),
    },
    {
      key: 'submittedAt',
      header: 'تاریخ ثبت',
      sortable: true,
      render: (r) => formatJalaliDate(r.submittedAt),
    },
    {
      key: 'status',
      header: 'وضعیت',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: 'destinationCity', header: 'شهر مقصد' },
    { key: 'additionalAddress', header: 'آدرس تکمیلی' },
    { key: 'destinationPostalCode', header: 'کد پستی' },
    { key: 'recipientMobile', header: 'موبایل گیرنده' },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <AdminShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          <ClipboardList className="h-5 w-5" />
          کارتابل اعلام بار
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input-glass px-3 py-2 text-sm"
          >
            <option value={LoadingRequestStatus.SUBMITTED}>در انتظار بررسی</option>
            <option value="">همه وضعیت‌ها (تاریخچه)</option>
            <option value={LoadingRequestStatus.APPROVED}>تایید‌شده</option>
            <option value={LoadingRequestStatus.REJECTED}>رد‌شده</option>
            <option value={LoadingRequestStatus.LOADED}>بارگیری‌شده</option>
            <option value={LoadingRequestStatus.CANCELED}>لغو‌شده</option>
          </select>
          {/* بازهٔ «تاریخ ثبت»: برای گرفتن خروجی اعلام‌بارهای یک روز مشخص، هر دو را
              روی همان تاریخ بگذارید (سمت سرور تا پایان همان روز بسته می‌شود).
              تقویم شمسی است ولی مقدار ارسالی به سرور همان میلادی YYYY-MM-DD می‌ماند. */}
          <label className="flex items-center gap-1 text-xs text-on-surface-variant">
            از تاریخ ثبت
            <JalaliDateInput
              value={from}
              onChange={(v) => {
                setFrom(v);
                setPage(1);
              }}
              placeholder="انتخاب تاریخ"
              clearable
              inputClassName="input-glass w-28 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-on-surface-variant">
            تا
            <JalaliDateInput
              value={to}
              onChange={(v) => {
                setTo(v);
                setPage(1);
              }}
              placeholder="انتخاب تاریخ"
              clearable
              inputClassName="input-glass w-28 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <ExportButtons
            excelPath={`/admin/loading-requests/export/excel?${excelQuery}`}
            excelName="admin-loading-requests.xlsx"
          />
        </div>
      </div>

      <p className="mb-4 text-xs text-on-surface-variant/80">
        برای مشاهده جزئیات کامل و تایید/رد، روی هر ردیف کلیک کنید. خروجی Excel همان فیلتر و
        مرتب‌سازی جدول را دارد، ولی همهٔ ردیف‌ها را شامل می‌شود نه فقط صفحهٔ جاری.
      </p>

      {/* نوار عملیات گروهی: فقط وقتی چیزی انتخاب شده باشد ظاهر می‌شود.
          «رد گروهی» عمداً وجود ندارد چون رد نیازمند دلیل جداگانه برای هر درخواست است (BR-11). */}
      {selectedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50/70 px-4 py-3">
          <span className="text-sm text-green-900">
            {formatNumber(selectedCount)} درخواست انتخاب شده است.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkApprove}
              disabled={bulkBusy}
              className="interactive-element flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {bulkBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              تایید انتخاب‌شده‌ها ({formatNumber(selectedCount)})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={bulkBusy}
              className="interactive-element rounded-lg border border-green-300 px-3 py-2 text-sm text-green-900 hover:bg-green-100 disabled:opacity-50"
            >
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {bulkSummary && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
          <span>{bulkSummary}</span>
          <button
            onClick={() => setBulkSummary(null)}
            className="interactive-element shrink-0 rounded p-0.5 hover:bg-emerald-100"
            aria-label="بستن پیام"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {bulkError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bulkError}
        </p>
      )}

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={13}>
        <SmartTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => setSelectedId(r.id)}
          sort={{
            key: sortBy,
            dir: sortDir,
            onChange: (key, dir) => {
              setSortBy(key);
              setSortDir(dir);
              setPage(1);
            },
          }}
          selection={{
            selectedIds,
            onChange: setSelectedIds,
            // فقط «در انتظار بررسی» واجد تایید است؛ بقیه چک‌باکس غیرفعال می‌گیرند تا
            // دلیلش روشن باشد، نه اینکه ستون خالی بماند.
            isSelectable: (r) => r.status === LoadingRequestStatus.SUBMITTED,
            disabledTitle: 'فقط درخواست‌های «در انتظار بررسی» قابل تایید گروهی هستند',
          }}
          pagination={{
            page,
            pageSize,
            total: data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      </DataStateView>

      {selectedId && (
        <LoadingRequestDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onReviewed={() => {
            setSelectedId(null);
            reload();
          }}
        />
      )}
    </AdminShell>
  );
}

/**
 * خلاصهٔ خوانا از نتیجهٔ تایید گروهی.
 *
 * شمارهٔ درخواست‌های skip‌شده از ردیف‌های بارگذاری‌شدهٔ همین صفحه گرفته می‌شود (نه از
 * سرور) تا یک درخواست اضافه به Backend زده نشود؛ اگر ردیف پیدا نشد، شناسه نمایش
 * داده می‌شود. موارد تاییدشده همان انتخاب منهای موارد گزارش‌شده در `skipped` است.
 */
function summarizeBulkApprove(
  result: BulkApproveLoadingRequestsResult,
  visibleRows: AdminLoadingRequestRow[],
): string {
  const numberById = new Map(visibleRows.map((r) => [r.id, r.requestNumber]));
  const parts = [`${formatNumber(result.approvedCount)} درخواست تایید شد`];
  if (result.skippedCount > 0) {
    const details = result.skipped
      .map((item) => `${numberById.get(item.id) ?? item.id} (${item.reason})`)
      .join('، ');
    parts.push(`${formatNumber(result.skippedCount)} مورد نادیده گرفته شد: ${details}`);
  }
  return parts.join(' — ');
}
