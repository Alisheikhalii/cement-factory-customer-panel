'use client';

import { useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import type {
  FinanceAssetReportDto,
  FinanceStatementDto,
  FinanceStatusStatementListData,
  FinanceTransactionListData,
  PaymentReceiptDto,
} from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { formatCurrency, formatJalaliDate, formatNumber } from '../../lib/format';
import { PortalShell } from '../../components/shared/PortalShell';
import { DataStateView } from '../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../components/shared/SmartTable';
import { ExportButtons } from '../../components/shared/ExportButtons';
import { StatusBadge } from '../../components/shared/StatusBadge';

type Tab = 'transactions' | 'status-statement' | 'statements' | 'asset-report';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'transactions', label: 'تراکنش‌ها' },
  { key: 'status-statement', label: 'صورت وضعیت' },
  { key: 'statements', label: 'صورت‌حساب‌ها' },
  { key: 'asset-report', label: 'گزارش دارایی' },
];

export default function FinancePage(): React.ReactElement {
  const user = useRequireCustomer();
  const [tab, setTab] = useState<Tab>('transactions');

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <PortalShell user={user}>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-on-surface">
        <Wallet className="h-5 w-5" />
        مالی
      </h2>

      <div className="glass-card mb-4 inline-flex flex-wrap gap-1 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`interactive-element rounded-lg px-4 py-2 text-sm transition-all ${
              tab === t.key
                ? 'bg-gradient-to-l from-primary-container to-secondary font-bold text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'status-statement' && <StatusStatementTab />}
      {tab === 'statements' && <StatementsTab />}
      {tab === 'asset-report' && <AssetReportTab />}

      <ReceiptsSection />
    </PortalShell>
  );
}

function TransactionsTab(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [page, pageSize]);

  const { state, data, reload } = useApiData<{
    data: FinanceTransactionListData;
    total: number;
  }>(
    async () => {
      const res = await apiClient.getWithMeta<FinanceTransactionListData>(
        `/finance/transactions?${queryString}`,
      );
      return { data: res.data, total: res.meta?.total ?? res.data.rows.length };
    },
    [queryString],
  );

  const rows = data?.data.rows ?? [];
  const sum = data?.data.sumRow;

  const columns: SmartColumn<(typeof rows)[number]>[] = [
    { key: 'date', header: 'تاریخ', render: (r) => formatJalaliDate(r.date) },
    { key: 'docNumber', header: 'شماره' },
    { key: 'operationType', header: 'نوع عملیات' },
    { key: 'bankName', header: 'بانک', render: (r) => r.bankName ?? '—' },
    { key: 'accountNumber', header: 'شماره حساب', render: (r) => r.accountNumber ?? '—' },
    {
      key: 'amount',
      header: 'مبلغ',
      numeric: true,
      render: (r) => formatNumber(r.amount),
      sumRender: () => formatNumber(sum?.amount ?? 0),
    },
    { key: 'description', header: 'شرح', render: (r) => r.description ?? '—' },
    { key: 'dueDate', header: 'سررسید', render: (r) => formatJalaliDate(r.dueDate) },
    { key: 'status', header: 'وضعیت' },
  ];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ExportButtons
          excelPath={`/finance/transactions/export/excel?${queryString}`}
          excelName="transactions.xlsx"
          pdfPath={`/finance/transactions/export/pdf?${queryString}`}
          pdfName="transactions.pdf"
        />
      </div>
      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={9}>
        <SmartTable
          columns={columns}
          rows={rows}
          hasSumRow
          pagination={{
            page,
            pageSize,
            total: data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (s) => {
              setPageSize(s);
              setPage(1);
            },
          }}
        />
      </DataStateView>
    </div>
  );
}

function StatusStatementTab(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [page, pageSize]);

  const { state, data, reload } = useApiData<{
    data: FinanceStatusStatementListData;
    total: number;
  }>(
    async () => {
      const res = await apiClient.getWithMeta<FinanceStatusStatementListData>(
        `/finance/status-statement?${queryString}`,
      );
      return { data: res.data, total: res.meta?.total ?? res.data.rows.length };
    },
    [queryString],
  );

  const rows = data?.data.rows ?? [];
  const sum = data?.data.sumRow;

  const columns: SmartColumn<(typeof rows)[number]>[] = [
    { key: 'docNumber', header: 'شماره سند' },
    { key: 'date', header: 'تاریخ', render: (r) => formatJalaliDate(r.date) },
    { key: 'description', header: 'شرح', render: (r) => r.description ?? '—' },
    {
      key: 'debit',
      header: 'بدهکار',
      numeric: true,
      render: (r) => formatNumber(r.debit),
      sumRender: () => formatNumber(sum?.debit ?? 0),
    },
    {
      key: 'credit',
      header: 'بستانکار',
      numeric: true,
      render: (r) => formatNumber(r.credit),
      sumRender: () => formatNumber(sum?.credit ?? 0),
    },
    { key: 'balance', header: 'مانده', numeric: true, render: (r) => formatNumber(r.balance) },
    { key: 'status', header: 'وضعیت' },
  ];

  return (
    <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={7}>
      <SmartTable
        columns={columns}
        rows={rows}
        hasSumRow
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />
    </DataStateView>
  );
}

function StatementsTab(): React.ReactElement {
  const { state, data, reload } = useApiData<FinanceStatementDto[]>(
    () => apiClient.get<FinanceStatementDto[]>('/finance/statements'),
    [],
  );
  const rows = data ?? [];

  return (
    <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={4}>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li
            key={s.id}
            className="glass-card glass-card-hover flex items-center justify-between rounded-xl p-3.5 text-sm"
          >
            <div>
              <span className="font-bold text-on-surface">{s.docNumber}</span>
              <span className="mr-3 text-on-surface-variant/70">{formatJalaliDate(s.date)}</span>
              <span className="mr-3 text-on-surface-variant">{s.description ?? ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-on-surface">{formatCurrency(s.amount)}</span>
              <ExportButtons
                pdfPath={`/finance/statements/${s.id}/pdf`}
                pdfName={`statement-${s.docNumber}.pdf`}
              />
            </div>
          </li>
        ))}
      </ul>
    </DataStateView>
  );
}

function AssetReportTab(): React.ReactElement {
  const { state, data, reload } = useApiData<FinanceAssetReportDto>(
    () => apiClient.get<FinanceAssetReportDto>('/finance/asset-report'),
    [],
  );

  return (
    <DataStateView state={state} isEmpty={false} onRetry={reload}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="سقف اعتبار" value={formatCurrency(data?.creditLimit ?? null)} />
        <SummaryCard title="مانده اعتبار" value={formatCurrency(data?.creditBalance ?? null)} />
        <SummaryCard title="مانده حساب فعلی" value={formatCurrency(data?.currentBalance ?? null)} />
      </div>
    </DataStateView>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }): React.ReactElement {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5">
      <div className="text-sm text-on-surface-variant">{title}</div>
      <div className="mt-2 text-xl font-extrabold text-on-surface">{value}</div>
    </div>
  );
}

function ReceiptsSection(): React.ReactElement {
  const { state, data, reload } = useApiData<PaymentReceiptDto[]>(
    () => apiClient.get<PaymentReceiptDto[]>('/finance/receipts'),
    [],
  );
  const rows = data ?? [];

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-base font-extrabold text-on-surface">فیش‌های واریزی</h3>
      <p className="mb-3 text-xs text-on-surface-variant/70">
        فرم بارگذاری فیش (Drag &amp; Drop) در فاز ۵ تکمیل بصری می‌شود؛ Endpoint بارگذاری هم‌اکنون فعال است.
      </p>
      <DataStateView
        state={state}
        isEmpty={rows.length === 0}
        onRetry={reload}
        emptyMessage="فیشی بارگذاری نشده است"
      >
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="glass-card glass-card-hover flex items-center justify-between rounded-xl p-3.5 text-sm"
            >
              <div>
                <span className="text-on-surface">{formatCurrency(r.amount ?? null)}</span>
                <span className="mr-3 text-on-surface-variant/70">{formatJalaliDate(r.uploadedAt)}</span>
                {r.description && <span className="mr-3 text-on-surface-variant">{r.description}</span>}
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      </DataStateView>
    </section>
  );
}
