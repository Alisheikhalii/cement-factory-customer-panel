'use client';

import { useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import type {
  DeliveryDto,
  DeliveryGroupData,
  DeliveryGroupRow,
  DeliveryListData,
} from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { formatJalaliDate, formatNumber } from '../../lib/format';
import { PortalShell } from '../../components/shared/PortalShell';
import { DataStateView } from '../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../components/shared/SmartTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ExportButtons } from '../../components/shared/ExportButtons';

type View = 'detail' | 'by-product' | 'by-date';

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'detail', label: 'ریز تحویل' },
  { key: 'by-product', label: 'سرجمع محصول' },
  { key: 'by-date', label: 'سرجمع تاریخ' },
];

export default function DeliveriesPage(): React.ReactElement {
  const user = useRequireCustomer();
  const [view, setView] = useState<View>('detail');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('view', view);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return params.toString();
  }, [view, page, pageSize]);

  const { state, data, reload } = useApiData<{
    data: DeliveryListData | DeliveryGroupData;
    total: number;
  }>(
    async () => {
      const res = await apiClient.getWithMeta<DeliveryListData | DeliveryGroupData>(
        `/deliveries?${queryString}`,
      );
      return { data: res.data, total: res.meta?.total ?? res.data.rows.length };
    },
    [queryString],
  );

  const isGrouped = view !== 'detail';
  const rows = data?.data.rows ?? [];
  const sum = data?.data.sumRow;

  const detailColumns: SmartColumn<DeliveryDto>[] = [
    { key: 'weighingNumber', header: 'شماره توزین' },
    {
      key: 'loadingRequestNumber',
      header: 'اعلام بار',
      render: (d) => d.loadingRequestNumber ?? '—',
    },
    { key: 'deliveryDate', header: 'تاریخ', render: (d) => formatJalaliDate(d.deliveryDate) },
    { key: 'carrierName', header: 'باربری', render: (d) => d.carrierName ?? '—' },
    { key: 'vehicleNumber', header: 'شماره ماشین', render: (d) => d.vehicleNumber ?? '—' },
    { key: 'driverName', header: 'راننده', render: (d) => d.driverName ?? '—' },
    { key: 'productName', header: 'محصول' },
    {
      key: 'deliveredQty',
      header: 'تحویل',
      numeric: true,
      render: (d) => formatNumber(d.deliveredQty),
      sumRender: () => formatNumber(sum?.deliveredQty ?? 0),
    },
    {
      key: 'baseAmount',
      header: 'مبلغ پایه',
      numeric: true,
      render: (d) => formatNumber(d.baseAmount),
      sumRender: () => formatNumber(sum?.baseAmount ?? 0),
    },
    {
      key: 'vatAmount',
      header: 'ارزش‌افزوده',
      numeric: true,
      render: (d) => formatNumber(d.vatAmount),
      sumRender: () => formatNumber(sum?.vatAmount ?? 0),
    },
    {
      key: 'amountWithFactors',
      header: 'مبلغ با عوامل',
      numeric: true,
      render: (d) => formatNumber(d.amountWithFactors),
      sumRender: () => formatNumber(sum?.amountWithFactors ?? 0),
    },
    { key: 'status', header: 'وضعیت', render: (d) => <StatusBadge status={d.status} /> },
  ];

  const groupColumns: SmartColumn<DeliveryGroupRow & { id: string }>[] = [
    { key: 'groupLabel', header: view === 'by-product' ? 'محصول' : 'ماه' },
    {
      key: 'deliveredQty',
      header: 'تحویل',
      numeric: true,
      render: (g) => formatNumber(g.deliveredQty),
      sumRender: () => formatNumber(sum?.deliveredQty ?? 0),
    },
    {
      key: 'baseAmount',
      header: 'مبلغ پایه',
      numeric: true,
      render: (g) => formatNumber(g.baseAmount),
      sumRender: () => formatNumber(sum?.baseAmount ?? 0),
    },
    {
      key: 'vatAmount',
      header: 'ارزش‌افزوده',
      numeric: true,
      render: (g) => formatNumber(g.vatAmount),
      sumRender: () => formatNumber(sum?.vatAmount ?? 0),
    },
    {
      key: 'amountWithFactors',
      header: 'مبلغ با عوامل',
      numeric: true,
      render: (g) => formatNumber(g.amountWithFactors),
      sumRender: () => formatNumber(sum?.amountWithFactors ?? 0),
    },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <PortalShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          <Truck className="h-5 w-5" />
          تحویل
        </h2>
        <ExportButtons
          excelPath={`/deliveries/export/excel?${queryString}`}
          excelName="deliveries.xlsx"
          pdfPath={`/deliveries/print/pdf?${queryString}`}
          pdfName="deliveries.pdf"
        />
      </div>

      <div className="glass-card mb-4 inline-flex rounded-xl p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => {
              setView(v.key);
              setPage(1);
            }}
            className={`interactive-element rounded-lg px-3 py-1.5 text-sm transition-all ${
              view === v.key
                ? 'bg-gradient-to-l from-primary-container to-secondary font-bold text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={10}>
        {isGrouped ? (
          <SmartTable
            columns={groupColumns}
            rows={(rows as DeliveryGroupRow[]).map((g) => ({ ...g, id: g.groupKey }))}
            hasSumRow
          />
        ) : (
          <SmartTable
            columns={detailColumns}
            rows={rows as DeliveryDto[]}
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
        )}
      </DataStateView>
    </PortalShell>
  );
}
