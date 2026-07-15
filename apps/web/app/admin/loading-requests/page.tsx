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
import { SmartTable, type SmartColumn } from '../../../components/shared/SmartTable';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { LoadingRequestDrawer } from './LoadingRequestDrawer';

export default function AdminLoadingRequestsPage(): React.ReactElement {
  const user = useRequireAdmin();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // پیش‌فرض کارتابل روی «در انتظار بررسی» (بخش ۹.۹.۳).
  const [status, setStatus] = useState<string>(LoadingRequestStatus.SUBMITTED);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    return params.toString();
  }, [page, pageSize, status]);

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
    { key: 'requestNumber', header: 'شماره درخواست' },
    { key: 'customerName', header: 'نام مشتری' },
    { key: 'orderNumber', header: 'شماره سفارش' },
    { key: 'productName', header: 'محصول' },
    {
      key: 'requestedQty',
      header: 'مقدار درخواستی',
      numeric: true,
      render: (r) => formatNumber(r.requestedQty),
    },
    { key: 'requestDate', header: 'تاریخ بارگیری', render: (r) => formatJalaliDate(r.requestDate) },
    { key: 'submittedAt', header: 'تاریخ ثبت', render: (r) => formatJalaliDate(r.submittedAt) },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.status} /> },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <AdminShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ClipboardList className="h-5 w-5" />
          کارتابل اعلام بار
        </h2>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value={LoadingRequestStatus.SUBMITTED}>در انتظار بررسی</option>
          <option value="">همه وضعیت‌ها (تاریخچه)</option>
          <option value={LoadingRequestStatus.APPROVED}>تایید‌شده</option>
          <option value={LoadingRequestStatus.REJECTED}>رد‌شده</option>
          <option value={LoadingRequestStatus.LOADED}>بارگیری‌شده</option>
          <option value={LoadingRequestStatus.CANCELED}>لغو‌شده</option>
        </select>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        برای مشاهده جزئیات کامل و تایید/رد، روی هر ردیف کلیک کنید.
      </p>

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={8}>
        <SmartTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => setSelectedId(r.id)}
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
