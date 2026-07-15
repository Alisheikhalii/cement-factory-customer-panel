'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  ClipboardList,
  MessageSquareWarning,
  Package,
  PackageCheck,
  Truck,
  Users,
  Wifi,
} from 'lucide-react';
import type {
  AdminActivityDto,
  AdminDashboardKpis,
  AdminDeliveryTrendPoint,
  AdminLoadingRequestTrendPoint,
} from '@cement/shared-types';
import { apiClient } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { formatNumber } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { KpiCard } from '../../../components/shared/KpiCard';
import { SkeletonCards } from '../../../components/shared/Skeleton';
import { DeliveryTrendChart, LoadingRequestTrendChart } from './AdminTrendCharts';

const ACTIVITIES_POLL_MS = 10_000;

export default function AdminDashboardPage(): React.ReactElement {
  const user = useRequireAdmin();

  const summary = useApiData<AdminDashboardKpis>(
    () => apiClient.get<AdminDashboardKpis>('/admin/dashboard/summary'),
    [],
  );
  const deliveryTrend = useApiData<AdminDeliveryTrendPoint[]>(
    () => apiClient.get<AdminDeliveryTrendPoint[]>('/admin/dashboard/delivery-trend?range=daily'),
    [],
  );
  const loadingTrend = useApiData<AdminLoadingRequestTrendPoint[]>(
    () =>
      apiClient.get<AdminLoadingRequestTrendPoint[]>(
        '/admin/dashboard/loading-request-trend?range=daily',
      ),
    [],
  );

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  const k = summary.data;

  return (
    <AdminShell user={user}>
      <h2 className="mb-4 text-lg font-bold text-slate-800">مرکز فرماندهی</h2>

      {/* بخش ۱ — KPI Cards (بخش ۹.۹.۱) */}
      {summary.state === 'loading' ? (
        <SkeletonCards />
      ) : (
        <DataStateView state={summary.state} isEmpty={false} onRetry={summary.reload}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="کل مشتریان"
              value={formatNumber(k?.totalCustomers ?? 0)}
              icon={Users}
              accent="blue"
            />
            <KpiCard
              title="سفارش‌های فعال"
              value={formatNumber(k?.activeOrders ?? 0)}
              icon={Package}
              accent="green"
            />
            <KpiCard
              title="اعلام بار در انتظار"
              value={formatNumber(k?.pendingLoadingRequests ?? 0)}
              subtitle="در انتظار بررسی"
              icon={ClipboardList}
              accent="amber"
            />
            <KpiCard
              title="کاربران آنلاین"
              value={formatNumber(k?.onlineUsers ?? 0)}
              subtitle="۱۵ دقیقه اخیر"
              icon={Wifi}
              accent="slate"
            />
            <KpiCard
              title="تحویل امروز"
              value={formatNumber(k?.todayDelivered ?? 0)}
              icon={Truck}
              accent="blue"
            />
            <KpiCard
              title="تحویل هفته جاری"
              value={formatNumber(k?.weekDelivered ?? 0)}
              icon={Truck}
              accent="green"
            />
            <KpiCard
              title="شکایات پاسخ‌نداده"
              value={formatNumber(k?.pendingComplaints ?? 0)}
              icon={MessageSquareWarning}
              accent="red"
            />
            <KpiCard
              title="نظرسنجی فعال"
              value={
                k?.activeSurvey ? (
                  <span className="text-base">{k.activeSurvey.title}</span>
                ) : (
                  '—'
                )
              }
              subtitle={
                k?.activeSurvey ? `${formatNumber(k.activeSurvey.answerCount)} پاسخ` : 'بدون نظرسنجی فعال'
              }
              icon={PackageCheck}
              accent="slate"
            />
          </div>
        </DataStateView>
      )}

      {/* بخش ۳ و ۴ — نمودارها */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">روند تحویل روزانه (۳۰ روز اخیر)</h3>
          {deliveryTrend.state === 'success' && deliveryTrend.data ? (
            <DeliveryTrendChart points={deliveryTrend.data} />
          ) : (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            روند ثبت اعلام بار (به تفکیک وضعیت)
          </h3>
          {loadingTrend.state === 'success' && loadingTrend.data ? (
            <LoadingRequestTrendChart points={loadingTrend.data} />
          ) : (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
      </div>

      {/* بخش ۲ — Latest Activities Feed */}
      <ActivitiesFeed />
    </AdminShell>
  );
}

/** فید فعالیت زنده از AuditLog با Polling هر ۱۰ ثانیه (بخش ۹.۹.۱ بخش ۲). */
function ActivitiesFeed(): React.ReactElement {
  const [activities, setActivities] = useState<AdminActivityDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function poll(): Promise<void> {
      try {
        const data = await apiClient.get<AdminActivityDto[]>('/admin/dashboard/activities?limit=20');
        if (active) {
          setActivities(data);
          setLoaded(true);
        }
      } catch {
        if (active) setLoaded(true);
      }
    }
    poll();
    const timer = setInterval(poll, ACTIVITIES_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Activity className="h-4 w-4" />
        آخرین فعالیت‌ها
      </h3>
      {!loaded ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-slate-400">فعالیتی برای نمایش وجود ندارد.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-slate-700">{a.text}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(a.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
