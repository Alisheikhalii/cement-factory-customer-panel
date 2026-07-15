'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DeliveryTrendPoint } from '@cement/shared-types';

/** نمودار میله‌ای روند تحویل ماهانه (بخش ۹.۲/۱۰.۸ — Recharts). */
export function DeliveryTrendChart({
  points,
}: {
  points: DeliveryTrendPoint[];
}): React.ReactElement {
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString('fa-IR'), 'تحویل']}
            labelStyle={{ direction: 'rtl' }}
          />
          <Bar dataKey="delivered" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
