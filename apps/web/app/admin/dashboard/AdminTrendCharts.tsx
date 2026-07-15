'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AdminDeliveryTrendPoint,
  AdminLoadingRequestTrendPoint,
} from '@cement/shared-types';

/** نمودار خطی تحویل روزانه کل کارخانه (بخش ۹.۹.۱ بخش ۳ — Recharts). */
export function DeliveryTrendChart({
  points,
}: {
  points: AdminDeliveryTrendPoint[];
}): React.ReactElement {
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString('fa-IR'), 'تحویل']}
            labelStyle={{ direction: 'rtl' }}
          />
          <Line type="monotone" dataKey="delivered" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** نمودار میله‌ای انباشته ثبت اعلام بار به تفکیک وضعیت (بخش ۹.۹.۱ بخش ۴). */
export function LoadingRequestTrendChart({
  points,
}: {
  points: AdminLoadingRequestTrendPoint[];
}): React.ReactElement {
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip labelStyle={{ direction: 'rtl' }} />
          <Legend wrapperStyle={{ direction: 'rtl', fontSize: 12 }} />
          <Bar dataKey="approved" name="تایید‌شده" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" name="در انتظار" stackId="a" fill="#f59e0b" />
          <Bar dataKey="rejected" name="رد‌شده" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
