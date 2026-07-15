'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  LoadType,
  VehicleType,
  type CreateLoadingRequestInput,
  type DashboardSummaryDto,
  type OrderDto,
} from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';
import { formatNumber } from '../../lib/format';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  [VehicleType.TRAILER]: 'تریلی',
  [VehicleType.FLATBED]: 'کفی',
  [VehicleType.DUMP]: 'کمپرسی',
  [VehicleType.TEN_WHEEL]: 'ده چرخ',
};

const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  [LoadType.FIXED]: 'فیکس (بارگیری کامل کامیون)',
  [LoadType.NON_FIXED]: 'غیرفیکس (تناژ متغیر)',
};

/**
 * فرم ثبت درخواست اعلام بار جدید (بخش ۹.۵ / BR-07).
 *
 * - تاریخ درخواستی همیشه «فردا» است و توسط Backend ست می‌شود (BR-04)؛ اینجا فقط نمایش.
 * - موبایل تحویل‌گیرنده با موبایل حساب مشتری Pre-fill می‌شود ولی قابل ویرایش است (BR-24).
 * - شماره ماشین/راننده هرگز اینجا نیست (BR-09).
 * - خطاهای Backend (LOAD_001..006) عیناً به کاربر نمایش داده می‌شوند.
 */
export function NewLoadingRequestForm({
  order,
  onClose,
  onSuccess,
}: {
  order: OrderDto;
  onClose: () => void;
  onSuccess: () => void;
}): React.ReactElement {
  const [requestedQty, setRequestedQty] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.TRAILER);
  const [loadType, setLoadType] = useState<LoadType>(LoadType.FIXED);
  const [destinationCity, setDestinationCity] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BR-24: Pre-fill موبایل تحویل‌گیرنده با موبایل حساب مشتری.
  useEffect(() => {
    let active = true;
    apiClient
      .get<DashboardSummaryDto>('/dashboard/summary')
      .then((summary) => {
        if (active && summary.userInfo.mobile) {
          setRecipientMobile((current) => current || summary.userInfo.mobile);
        }
      })
      .catch(() => {
        /* اگر Pre-fill ناموفق بود، کاربر دستی وارد می‌کند */
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const qty = Number(requestedQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('مقدار درخواستی باید عددی بزرگ‌تر از صفر باشد');
      return;
    }
    if (!destinationCity.trim()) {
      setError('شهر مقصد بار الزامی است');
      return;
    }
    if (!recipientMobile.trim()) {
      setError('شماره موبایل تحویل‌گیرنده الزامی است');
      return;
    }

    const input: CreateLoadingRequestInput = {
      orderId: order.id,
      productId: order.productId,
      requestedQty: qty,
      vehicleType,
      loadType,
      destinationCity: destinationCity.trim(),
      additionalAddress: additionalAddress.trim() || undefined,
      destinationPostalCode: destinationPostalCode.trim() || undefined,
      recipientMobile: recipientMobile.trim(),
    };

    setSubmitting(true);
    try {
      await apiClient.post('/loading-requests', input);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت درخواست ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-start">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-auto bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">ثبت اعلام بار جدید</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>سفارش:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>محصول:</span>
              <span className="font-medium">{order.productName}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>مانده سفارش:</span>
              <span className="font-medium">{formatNumber(order.remainingQty)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>تاریخ درخواستی:</span>
              <span className="font-medium">فردا</span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-slate-700">مقدار درخواستی</span>
            <input
              type="number"
              min="0"
              step="any"
              value={requestedQty}
              onChange={(e) => setRequestedQty(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">نوع خودرو</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.values(VehicleType).map((v) => (
                <option key={v} value={v}>
                  {VEHICLE_LABELS[v]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">نوع بار</span>
            <select
              value={loadType}
              onChange={(e) => setLoadType(e.target.value as LoadType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.values(LoadType).map((v) => (
                <option key={v} value={v}>
                  {LOAD_TYPE_LABELS[v]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">شهر مقصد بار</span>
            <input
              type="text"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">آدرس تکمیلی و توضیحات (اختیاری)</span>
            <textarea
              value={additionalAddress}
              onChange={(e) => setAdditionalAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">کد پستی مقصد (اختیاری)</span>
            <input
              type="text"
              value={destinationPostalCode}
              onChange={(e) => setDestinationPostalCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-700">موبایل تحویل‌گیرنده</span>
            <input
              type="tel"
              value={recipientMobile}
              onChange={(e) => setRecipientMobile(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="۰۹xxxxxxxxx"
              required
            />
            <span className="mt-1 block text-xs text-slate-400">
              به‌صورت پیش‌فرض موبایل حساب شماست؛ در صورت نیاز شماره راننده/تحویل‌گیرنده را وارد کنید.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'در حال ثبت…' : 'ثبت درخواست'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600"
            >
              انصراف
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
