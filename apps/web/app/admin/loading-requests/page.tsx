'use client';

import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { LoadingRequestStatus } from '@cement/shared-types';
import type { AdminLoadingRequestRow } from '@cement/shared-types';
import { apiClient } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { formatJalaliDate, formatNumber } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { ExportButtons } from '../../../components/shared/ExportButtons';
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
              روی همان تاریخ بگذارید (سمت سرور تا پایان همان روز بسته می‌شود). */}
          <label className="flex items-center gap-1 text-xs text-on-surface-variant">
            از تاریخ ثبت
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="input-glass px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-on-surface-variant">
            تا
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="input-glass px-2 py-1.5 text-sm"
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

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={12}>
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
