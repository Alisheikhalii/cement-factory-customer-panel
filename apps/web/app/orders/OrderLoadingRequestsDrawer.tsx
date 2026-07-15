'use client';

import { X } from 'lucide-react';
import type { LoadingRequestListData, OrderDto } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { formatJalaliDate, formatNumber } from '../../lib/format';
import { DataStateView } from '../../components/shared/DataStateView';
import { StatusBadge } from '../../components/shared/StatusBadge';

/**
 * Drawer نمایش اعلام‌بارهای یک سفارش (بخش ۹.۴).
 * نقطه ورود ثبت اعلام‌بار جدید در فاز ۳ اینجا اضافه می‌شود.
 */
export function OrderLoadingRequestsDrawer({
  order,
  onClose,
}: {
  order: OrderDto;
  onClose: () => void;
}): React.ReactElement {
  const { state, data, reload } = useApiData<LoadingRequestListData>(
    () => apiClient.get<LoadingRequestListData>(`/orders/${order.id}/loading-requests`),
    [order.id],
  );

  const rows = data?.rows ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-auto bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">اعلام‌بارهای سفارش {order.orderNumber}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <DataStateView
          state={state}
          isEmpty={rows.length === 0}
          onRetry={reload}
          emptyMessage="هیچ اعلام باری روی این سفارش ثبت نشده است"
        >
          <ul className="space-y-3">
            {rows.map((lr) => (
              <li key={lr.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{lr.requestNumber}</span>
                  <StatusBadge status={lr.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                  <span>تاریخ اعلام: {formatJalaliDate(lr.requestDate)}</span>
                  <span>مقدار: {formatNumber(lr.requestedQty)}</span>
                  <span>تحویل‌شده: {formatNumber(lr.deliveredQty)}</span>
                  <span>مانده: {formatNumber(lr.remainingQty)}</span>
                </div>
                {lr.reviewedByNote && (
                  <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                    {lr.reviewedByNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </DataStateView>

        <p className="mt-4 text-xs text-slate-400">
          ثبت درخواست اعلام بار جدید در فاز ۳ فعال می‌شود.
        </p>
      </aside>
    </div>
  );
}
