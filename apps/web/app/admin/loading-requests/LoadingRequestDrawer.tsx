'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { AdminLoadingRequestDetail } from '@cement/shared-types';
import { LoadingRequestStatus } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { formatJalaliDate, formatNumber } from '../../../lib/format';
import { StatusBadge } from '../../../components/shared/StatusBadge';

/**
 * Drawer جزئیات کامل درخواست اعلام بار (بخش ۹.۹.۳). شامل مانده موجودی (BR-25)
 * و دکمه‌های تایید/رد. رد نیازمند دلیل اجباری است (BR-11 → ADMIN_002).
 */
export function LoadingRequestDrawer({
  id,
  onClose,
  onReviewed,
}: {
  id: string;
  onClose: () => void;
  onReviewed: () => void;
}): React.ReactElement {
  const { state, data, reload } = useApiData<AdminLoadingRequestDetail>(
    () => apiClient.get<AdminLoadingRequestDetail>(`/admin/loading-requests/${id}`),
    [id],
  );

  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPending = data?.status === LoadingRequestStatus.SUBMITTED;

  async function approve(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      await apiClient.patch(`/admin/loading-requests/${id}/approve`);
      onReviewed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تایید ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function reject(): Promise<void> {
    if (reason.trim() === '') {
      setError('برای رد درخواست، ذکر دلیل الزامی است');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await apiClient.patch(`/admin/loading-requests/${id}/reject`, { reason: reason.trim() });
      onReviewed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'رد درخواست ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/30 backdrop-blur-sm">
      <div className="glass-panel h-full w-full max-w-lg overflow-auto border-r border-white/40 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/40 px-5 py-4">
          <h3 className="text-lg font-bold text-on-surface">جزئیات درخواست اعلام بار</h3>
          <button
            onClick={onClose}
            className="interactive-element rounded-lg p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-on-surface"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {state === 'loading' && (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          )}

          {state === 'error' && (
            <div className="text-center text-sm text-slate-500">
              <p className="mb-3">خطا در دریافت اطلاعات.</p>
              <button onClick={reload} className="rounded-lg border border-slate-300 px-4 py-2">
                تلاش مجدد
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold text-slate-800">{data.requestNumber}</span>
                <StatusBadge status={data.status} />
              </div>

              <dl className="space-y-2.5 text-sm">
                <Row label="مشتری" value={`${data.customer.name} (${data.customer.customerCode})`} />
                <Row label="شماره سفارش" value={data.orderNumber} />
                <Row label="محصول" value={`${data.productName} (${data.productType})`} />
                <Row label="نوع وسیله نقلیه" value={data.vehicleType} />
                <Row label="نوع بار" value={data.loadType} />
                <Row label="شهر مقصد" value={data.destinationCity} />
                <Row label="آدرس تکمیلی" value={data.additionalAddress ?? '—'} />
                <Row label="کد پستی مقصد" value={data.destinationPostalCode ?? '—'} />
                <Row label="موبایل تحویل‌گیرنده" value={data.recipientMobile} />
                <Row label="تاریخ درخواستی بارگیری" value={formatJalaliDate(data.requestDate)} />
                <Row label="تاریخ ثبت" value={formatJalaliDate(data.submittedAt)} />
                <Row
                  label="مقدار درخواستی"
                  value={formatNumber(data.requestedQty)}
                  emphasize
                />
                <Row
                  label="مانده موجودی سفارش (لحظه بررسی)"
                  value={formatNumber(data.orderRemainingQty)}
                  emphasize
                />
                {data.reviewedByNote && (
                  <Row label="دلیل رد" value={data.reviewedByNote} />
                )}
              </dl>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
              )}

              {isPending && !rejectMode && (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={approve}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    تایید
                  </button>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    رد
                  </button>
                </div>
              )}

              {isPending && rejectMode && (
                <div className="mt-6">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    دلیل رد (الزامی)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    placeholder="دلیل رد درخواست را وارد کنید…"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={reject}
                      disabled={busy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      ثبت رد
                    </button>
                    <button
                      onClick={() => {
                        setRejectMode(false);
                        setReason('');
                        setError(null);
                      }}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className={`text-left ${emphasize ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </dd>
    </div>
  );
}
