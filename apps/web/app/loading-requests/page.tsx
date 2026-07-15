'use client';

import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { LoadingRequestStatus } from '@cement/shared-types';
import type { LoadingRequestDto, LoadingRequestListData } from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { formatJalaliDate, formatNumber } from '../../lib/format';
import { PortalShell } from '../../components/shared/PortalShell';
import { DataStateView } from '../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../components/shared/SmartTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ExportButtons } from '../../components/shared/ExportButtons';

/** وضعیت‌هایی که BR-10 اجازه لغو می‌دهد. */
const CANCELABLE: LoadingRequestStatus[] = [
  LoadingRequestStatus.SUBMITTED,
  LoadingRequestStatus.APPROVED,
];

export default function LoadingRequestsPage(): React.ReactElement {
  const user = useRequireCustomer();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    return params.toString();
  }, [page, pageSize, status]);

  const { state, data, reload } = useApiData<{ data: LoadingRequestListData; total: number }>(
    async () => {
      const res = await apiClient.getWithMeta<LoadingRequestListData>(
        `/loading-requests?${queryString}`,
      );
      return { data: res.data, total: res.meta?.total ?? res.data.rows.length };
    },
    [queryString],
  );

  const rows = data?.data.rows ?? [];
  const sum = data?.data.sumRow;

  async function handleCancel(id: string): Promise<void> {
    if (!window.confirm('آیا از لغو این درخواست اعلام بار مطمئن هستید؟')) {
      return;
    }
    setActionError(null);
    setCancelingId(id);
    try {
      await apiClient.post(`/loading-requests/${id}/cancel`);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'لغو درخواست ناموفق بود');
    } finally {
      setCancelingId(null);
    }
  }

  const columns: SmartColumn<LoadingRequestDto>[] = [
    { key: 'requestNumber', header: 'شماره' },
    { key: 'submittedAt', header: 'تاریخ ثبت', render: (r) => formatJalaliDate(r.submittedAt) },
    { key: 'productName', header: 'محصول' },
    { key: 'carrierName', header: 'باربری', render: (r) => r.carrierName ?? 'کارخانه تعیین کند' },
    { key: 'requestDate', header: 'تاریخ اعلام', render: (r) => formatJalaliDate(r.requestDate) },
    {
      key: 'requestedQty',
      header: 'مقدار اعلام',
      numeric: true,
      render: (r) => formatNumber(r.requestedQty),
      sumRender: () => formatNumber(sum?.requestedQty ?? 0),
    },
    {
      key: 'deliveredQty',
      header: 'تحویل‌شده',
      numeric: true,
      render: (r) => formatNumber(r.deliveredQty),
      sumRender: () => formatNumber(sum?.deliveredQty ?? 0),
    },
    {
      key: 'remainingQty',
      header: 'مانده',
      numeric: true,
      render: (r) => formatNumber(r.remainingQty),
    },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'عملیات',
      render: (r) =>
        CANCELABLE.includes(r.status) ? (
          <button
            onClick={() => handleCancel(r.id)}
            disabled={cancelingId === r.id}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelingId === r.id ? '…' : 'لغو'}
          </button>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <PortalShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ClipboardList className="h-5 w-5" />
          اعلام بار
        </h2>
        <ExportButtons
          excelPath={`/loading-requests/export/excel?${queryString}`}
          excelName="loading-requests.xlsx"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="SUBMITTED">ثبت‌شده</option>
          <option value="APPROVED">تایید‌شده</option>
          <option value="REJECTED">رد‌شده</option>
          <option value="LOADED">بارگیری‌شده</option>
          <option value="CANCELED">لغو‌شده</option>
        </select>
        <p className="text-xs text-slate-500">
          برای ثبت درخواست جدید، از صفحه «سفارش‌ها» سفارش موردنظر را باز کنید. لغو درخواست‌های
          ثبت‌شده/تاییدشده از ستون «عملیات» انجام می‌شود (BR-10).
        </p>
      </div>

      {actionError && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{actionError}</p>
      )}

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={10}>
        <SmartTable
          columns={columns}
          rows={rows}
          hasSumRow
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
    </PortalShell>
  );
}
