'use client';

import { useMemo, useState } from 'react';
import { ShoppingCart, ListChecks } from 'lucide-react';
import type { OrderDto, OrderListData } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { formatJalaliDate, formatNumber } from '../../lib/format';
import { PortalShell } from '../../components/shared/PortalShell';
import { DataStateView } from '../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../components/shared/SmartTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ExportButtons } from '../../components/shared/ExportButtons';
import { OrderLoadingRequestsDrawer } from './OrderLoadingRequestsDrawer';

export default function OrdersPage(): React.ReactElement {
  const user = useRequireCustomer();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [hasRemaining, setHasRemaining] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState<OrderDto | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    if (hasRemaining) params.set('hasRemaining', 'true');
    return params.toString();
  }, [page, pageSize, status, hasRemaining]);

  const { state, data, reload } = useApiData<{ data: OrderListData; total: number }>(
    async () => {
      const res = await apiClient.getWithMeta<OrderListData>(`/orders?${queryString}`);
      return { data: res.data, total: res.meta?.total ?? res.data.rows.length };
    },
    [queryString],
  );

  const rows = data?.data.rows ?? [];
  const sum = data?.data.sumRow;

  const columns: SmartColumn<OrderDto>[] = [
    {
      key: 'lr',
      header: '',
      render: (o) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDrawerOrder(o);
          }}
          title="اعلام‌بارهای این سفارش"
          className="text-blue-600 hover:text-blue-800"
        >
          <ListChecks className="h-4 w-4" />
        </button>
      ),
    },
    { key: 'orderNumber', header: 'شماره' },
    { key: 'orderDate', header: 'تاریخ', render: (o) => formatJalaliDate(o.orderDate) },
    { key: 'productName', header: 'محصول' },
    { key: 'status', header: 'وضعیت', render: (o) => <StatusBadge status={o.status} /> },
    {
      key: 'totalQty',
      header: 'مقدار',
      numeric: true,
      render: (o) => formatNumber(o.totalQty),
      sumRender: () => formatNumber(sum?.totalQty ?? 0),
    },
    {
      key: 'deliveredQty',
      header: 'حمل‌شده',
      numeric: true,
      render: (o) => formatNumber(o.deliveredQty),
      sumRender: () => formatNumber(sum?.deliveredQty ?? 0),
    },
    {
      key: 'remainingQty',
      header: 'باقیمانده',
      numeric: true,
      render: (o) => formatNumber(o.remainingQty),
      sumRender: () => formatNumber(sum?.remainingQty ?? 0),
    },
    {
      key: 'amountWithFactors',
      header: 'مبلغ با عوامل',
      numeric: true,
      render: (o) => formatNumber(o.amountWithFactors),
      sumRender: () => formatNumber(sum?.amountWithFactors ?? 0),
    },
    {
      key: 'deliveredAmount',
      header: 'مبلغ حمل‌شده',
      numeric: true,
      render: (o) => formatNumber(o.deliveredAmount),
      sumRender: () => formatNumber(sum?.deliveredAmount ?? 0),
    },
    {
      key: 'remainingAmount',
      header: 'مبلغ باقیمانده',
      numeric: true,
      render: (o) => formatNumber(o.remainingAmount),
      sumRender: () => formatNumber(sum?.remainingAmount ?? 0),
    },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <PortalShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ShoppingCart className="h-5 w-5" />
          سفارشات
        </h2>
        <ExportButtons excelPath={`/orders/export/excel?${queryString}`} excelName="orders.xlsx" />
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
          <option value="">همه سفارشات</option>
          <option value="IN_USE">در حال استفاده</option>
          <option value="COMPLETED">تکمیل‌شده</option>
          <option value="EXPIRED">منقضی</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasRemaining}
            onChange={(e) => {
              setHasRemaining(e.target.checked);
              setPage(1);
            }}
          />
          فقط دارای مانده
        </label>
      </div>

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={11}>
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

      {drawerOrder && (
        <OrderLoadingRequestsDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
        />
      )}
    </PortalShell>
  );
}
