'use client';

import {
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  MessageSquareWarning,
  Package,
  Truck,
  Wallet,
} from 'lucide-react';
import type { DashboardSummaryDto, DeliveryTrendDto } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { formatCurrency, formatJalaliDate, formatNumber } from '../../lib/format';
import { PortalShell } from '../../components/shared/PortalShell';
import { DataStateView } from '../../components/shared/DataStateView';
import { KpiCard } from '../../components/shared/KpiCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { SkeletonCards } from '../../components/shared/Skeleton';
import { DeliveryTrendChart } from './DeliveryTrendChart';

export default function DashboardPage(): React.ReactElement {
  const user = useRequireCustomer();

  const summary = useApiData<DashboardSummaryDto>(
    () => apiClient.get<DashboardSummaryDto>('/dashboard/summary'),
    [],
  );
  const trend = useApiData<DeliveryTrendDto>(
    () => apiClient.get<DeliveryTrendDto>('/dashboard/delivery-trend?months=12'),
    [],
  );

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  const d = summary.data;
  const k = d?.kpis;
  const creditPct =
    k && k.creditLimit && k.creditLimit > 0
      ? Math.min(Math.round(((k.creditBalance ?? 0) / k.creditLimit) * 100), 100)
      : null;

  return (
    <PortalShell user={user}>
      <h2 className="mb-4 text-lg font-bold text-slate-800">داشبورد</h2>

      {summary.state === 'loading' ? (
        <SkeletonCards />
      ) : (
        <DataStateView state={summary.state} isEmpty={false} onRetry={summary.reload}>
          {/* KPI Cards (۸ مورد، بخش ۹.۲) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="مانده حساب"
              value={formatCurrency(k?.accountBalance ?? null)}
              icon={Wallet}
              accent="blue"
            />
            <KpiCard
              title="سفارش‌های فعال"
              value={formatNumber(k?.activeOrderCount ?? 0)}
              icon={Package}
              accent="green"
            />
            <KpiCard
              title="باقیمانده سفارش‌ها"
              value={formatNumber(k?.remainingQtyTotal ?? 0)}
              subtitle="مجموع مانده (تن/کیسه)"
              icon={Boxes}
              accent="amber"
            />
            <KpiCard
              title="تحویل ماه جاری"
              value={formatNumber(k?.currentMonthDelivered ?? 0)}
              icon={Truck}
              accent="blue"
            />
            <KpiCard
              title="آخرین اعلام بار"
              value={
                k?.lastLoadingRequest ? (
                  <span className="text-base">{k.lastLoadingRequest.requestNumber}</span>
                ) : (
                  '—'
                )
              }
              subtitle={
                k?.lastLoadingRequest ? (
                  <StatusBadge status={k.lastLoadingRequest.status} />
                ) : undefined
              }
              icon={ClipboardList}
              accent="slate"
            />
            <KpiCard
              title="آخرین صورت‌حساب"
              value={
                k?.lastStatement ? formatCurrency(k.lastStatement.amount) : '—'
              }
              subtitle={k?.lastStatement ? formatJalaliDate(k.lastStatement.date) : undefined}
              icon={FileText}
              accent="slate"
            />
            <KpiCard
              title="وضعیت اعتبار"
              value={creditPct === null ? '—' : `${formatNumber(creditPct)}٪`}
              subtitle={
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${creditPct ?? 0}%` }}
                  />
                </div>
              }
              icon={CreditCard}
              accent="green"
            />
            <KpiCard
              title="آخرین شکایت"
              value={
                k?.lastComplaint ? (
                  <span className="text-base">{k.lastComplaint.subject}</span>
                ) : (
                  '—'
                )
              }
              subtitle={
                k?.lastComplaint ? <StatusBadge status={k.lastComplaint.status} /> : undefined
              }
              icon={MessageSquareWarning}
              accent="red"
            />
          </div>

          {/* نمودار روند تحویل */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">روند تحویل ماهانه</h3>
            {trend.state === 'success' && trend.data ? (
              <DeliveryTrendChart points={trend.data.points} />
            ) : (
              <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
            )}
          </div>

          {/* اطلاعات محصول */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">اطلاعات محصول</h3>
            {d && d.products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-2">کد</th>
                      <th className="py-2">نام</th>
                      <th className="py-2 text-left">مانده برگ فروش</th>
                      <th className="py-2 text-left">اعلام بار امروز</th>
                      <th className="py-2 text-left">تحویل امروز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.products.map((p) => (
                      <tr key={p.productId} className="border-t border-slate-100">
                        <td className="py-2">{p.erpCode}</td>
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-left tabular-nums">
                          {formatNumber(p.remainingAllowance)}
                        </td>
                        <td className="py-2 text-left tabular-nums">
                          {formatNumber(p.todayLoading)}
                        </td>
                        <td className="py-2 text-left tabular-nums">
                          {formatNumber(p.todayDelivery)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">محصولی برای نمایش وجود ندارد.</p>
            )}
          </div>

          {/* اطلاعات کاربری */}
          {d && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">اطلاعات کاربری</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="نام" value={d.userInfo.name} />
                <Info label="کد تفصیل" value={d.userInfo.customerCode} />
                <Info label="کد ملی" value={d.userInfo.nationalId ?? '—'} />
                <Info label="کد اقتصادی" value={d.userInfo.economicCode ?? '—'} />
                <Info label="کد پستی" value={d.userInfo.postalCode ?? '—'} />
                <Info label="موبایل" value={d.userInfo.mobile} />
                <Info label="آدرس" value={d.userInfo.address ?? '—'} />
              </dl>
            </div>
          )}
        </DataStateView>
      )}
    </PortalShell>
  );
}

function Info({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400">{label}:</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
