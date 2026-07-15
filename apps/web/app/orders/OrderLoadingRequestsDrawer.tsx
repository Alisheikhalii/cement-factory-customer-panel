'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { OrderStatus, type LoadingRequestListData, type OrderDto } from '@cement/shared-types';
import { apiClient } from '../../lib/api';
import { useApiData } from '../../lib/use-api-data';
import { formatJalaliDate, formatNumber } from '../../lib/format';
import { DataStateView } from '../../components/shared/DataStateView';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { NewLoadingRequestForm } from '../loading-requests/NewLoadingRequestForm';

/**
 * Drawer نمایش اعلام‌بارهای یک سفارش (بخش ۹.۴) + نقطه ورود ثبت اعلام‌بار جدید
 * روی همین سفارش (فقط برای سفارش‌های «در حال استفاده» دارای مانده).
 */
export function OrderLoadingRequestsDrawer({
  order,
  onClose,
}: {
  order: OrderDto;
  onClose: () => void;
}): React.ReactElement {
  const [showNewForm, setShowNewForm] = useState(false);

  const { state, data, reload } = useApiData<LoadingRequestListData>(
    () => apiClient.get<LoadingRequestListData>(`/orders/${order.id}/loading-requests`),
    [order.id],
  );

  const rows = data?.rows ?? [];
  const canCreate = order.status === OrderStatus.IN_USE && order.remainingQty > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="glass-panel h-full w-full max-w-md overflow-auto border-r border-white/40 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-on-surface">اعلام‌بارهای سفارش {order.orderNumber}</h3>
          <button
            onClick={onClose}
            className="interactive-element rounded-lg p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-on-surface"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowNewForm(true)}
            className="gradient-btn interactive-element mb-4 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            ثبت درخواست اعلام بار جدید
          </button>
        )}

        <DataStateView
          state={state}
          isEmpty={rows.length === 0}
          onRetry={reload}
          emptyMessage="هیچ اعلام باری روی این سفارش ثبت نشده است"
        >
          <ul className="space-y-3">
            {rows.map((lr) => (
              <li key={lr.id} className="glass-card rounded-xl p-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">{lr.requestNumber}</span>
                  <StatusBadge status={lr.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-on-surface-variant">
                  <span>تاریخ اعلام: {formatJalaliDate(lr.requestDate)}</span>
                  <span>مقدار: {formatNumber(lr.requestedQty)}</span>
                  <span>تحویل‌شده: {formatNumber(lr.deliveredQty)}</span>
                  <span>مانده: {formatNumber(lr.remainingQty)}</span>
                </div>
                {lr.reviewedByNote && (
                  <p className="mt-2 rounded-lg border border-danger/25 bg-danger/10 p-2 text-xs text-danger">
                    {lr.reviewedByNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </DataStateView>

        {!canCreate && (
          <p className="mt-4 text-xs text-on-surface-variant/70">
            ثبت اعلام بار جدید فقط برای سفارش‌های «در حال استفاده» با مانده بزرگ‌تر از صفر
            امکان‌پذیر است.
          </p>
        )}
      </aside>

      {showNewForm && (
        <NewLoadingRequestForm
          order={order}
          onClose={() => setShowNewForm(false)}
          onSuccess={() => {
            setShowNewForm(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
