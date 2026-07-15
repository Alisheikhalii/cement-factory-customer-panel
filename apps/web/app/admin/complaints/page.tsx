'use client';

import { useMemo, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { ComplaintStatus } from '@cement/shared-types';
import type { AdminComplaintDto } from '@cement/shared-types';
import { apiClient } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { formatJalaliDate } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../../components/shared/SmartTable';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { ComplaintReplyModal } from './ComplaintReplyModal';

export default function AdminComplaintsPage(): React.ReactElement {
  const user = useRequireAdmin();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<AdminComplaintDto | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    return params.toString();
  }, [page, pageSize, status]);

  const { state, data, reload } = useApiData<{ rows: AdminComplaintDto[]; total: number }>(
    async () => {
      const res = await apiClient.getWithMeta<AdminComplaintDto[]>(`/admin/complaints?${queryString}`);
      return { rows: res.data, total: res.meta?.total ?? res.data.length };
    },
    [queryString],
  );

  const rows = data?.rows ?? [];

  const columns: SmartColumn<AdminComplaintDto>[] = [
    { key: 'customerName', header: 'مشتری' },
    { key: 'subject', header: 'موضوع' },
    {
      key: 'description',
      header: 'شرح',
      render: (r) => (
        <span className="line-clamp-1 max-w-xs text-slate-500">{r.description}</span>
      ),
    },
    { key: 'submittedAt', header: 'تاریخ', render: (r) => formatJalaliDate(r.submittedAt) },
    { key: 'status', header: 'وضعیت', render: (r) => <StatusBadge status={r.status} /> },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <AdminShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          <MessageSquareWarning className="h-5 w-5" />
          مدیریت شکایات
        </h2>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input-glass px-3 py-2 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value={ComplaintStatus.PENDING}>در حال بررسی</option>
          <option value={ComplaintStatus.ANSWERED}>پاسخ داده‌شده</option>
        </select>
      </div>

      <p className="mb-4 text-xs text-on-surface-variant/80">برای مشاهده و پاسخ، روی هر ردیف کلیک کنید.</p>

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={5}>
        <SmartTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => setSelected(r)}
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

      {selected && (
        <ComplaintReplyModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onReplied={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </AdminShell>
  );
}
