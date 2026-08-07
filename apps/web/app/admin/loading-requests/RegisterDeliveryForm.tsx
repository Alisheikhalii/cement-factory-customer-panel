'use client';

import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import type { AdminLoadingRequestDetail } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';

/** بدنه‌ای که به Endpoint ثبت دستی تحویل ارسال می‌شود. */
interface RegisterDeliveryBody {
  weighingNumber: string;
  deliveryDate: string;
  carrierId?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  deliveredQty: number;
}

/** باربری فعالِ قابل انتخاب (از `/admin/loading-requests/carriers`). */
interface ActiveCarrier {
  id: string;
  name: string;
}

/**
 * فرم ثبت دستی تحویل برای یک اعلام بار تاییدشده (Task 3 — فاز پایلوت).
 *
 * ⚠️ هیچ فیلد مالی‌ای در این فرم نیست و نباید اضافه شود: در فاز پایلوت ERP وصل
 * نیست و پورتال قیمت‌گذاری نمی‌کند (BR-18). مبالغ در رکورد Delivery `null` می‌مانند.
 *
 * ارسال فرم همان Transition استاندارد APPROVED → LOADED را اجرا می‌کند (بخش ۸.۱):
 * سرور همان `markLoaded` را صدا می‌زند، پس Delivery ساخته و `remainingQty` سفارش
 * اتمیک کم می‌شود — بدون مسیر کد موازی.
 */
export function RegisterDeliveryForm({
  request,
  onRegistered,
}: {
  request: AdminLoadingRequestDetail;
  onRegistered: () => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weighingNumber, setWeighingNumber] = useState('');
  // پیش‌فرض امروز؛ input[type=date] فرمت YYYY-MM-DD میلادی می‌خواهد.
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  // باربری با شناسه انتخاب می‌شود چون `Delivery.carrierId` کلید خارجی است؛
  // رشتهٔ خالی یعنی «انتخاب نشده» و در بدنه ارسال نمی‌شود.
  const [carrierId, setCarrierId] = useState('');
  const [carriers, setCarriers] = useState<ActiveCarrier[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  // پیش‌فرض = مقدار درخواستی؛ اگر کمتر تحویل شد ادمین اصلاح می‌کند.
  const [deliveredQty, setDeliveredQty] = useState(String(request.requestedQty));

  // فهرست باربری‌ها فقط وقتی فرم باز شد گرفته می‌شود (نه در هر رندر Drawer).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    apiClient
      .get<ActiveCarrier[]>('/admin/loading-requests/carriers')
      .then((rows) => {
        if (!cancelled) setCarriers(rows);
      })
      .catch(() => {
        // باربری اختیاری است؛ اگر فهرست نیامد فرم بدون آن کار می‌کند.
        if (!cancelled) setCarriers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (weighingNumber.trim() === '') {
      setError('شماره توزین الزامی است');
      return;
    }
    const qty = Number(deliveredQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('مقدار تحویل معتبر نیست');
      return;
    }
    if (qty > request.requestedQty) {
      setError('مقدار تحویل نمی‌تواند بیشتر از مقدار اعلام‌شده باشد');
      return;
    }
    if (driverMobile.trim() !== '' && !/^09\d{9}$/.test(driverMobile.trim())) {
      setError('شماره موبایل راننده معتبر نیست');
      return;
    }

    const body: RegisterDeliveryBody = {
      weighingNumber: weighingNumber.trim(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      deliveredQty: qty,
    };
    // فیلدهای اختیاری فقط وقتی پر شده‌اند ارسال می‌شوند تا سرور `null` ثبت کند.
    if (carrierId !== '') body.carrierId = carrierId;
    if (vehicleNumber.trim() !== '') body.vehicleNumber = vehicleNumber.trim();
    if (driverName.trim() !== '') body.driverName = driverName.trim();
    if (driverMobile.trim() !== '') body.driverMobile = driverMobile.trim();

    setBusy(true);
    try {
      await apiClient.post(`/admin/loading-requests/${request.id}/register-delivery`, body);
      onRegistered();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت تحویل ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <Truck className="h-4 w-4" />
        ثبت تحویل (پایلوت)
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
        <Truck className="h-4 w-4" />
        ثبت تحویل (پایلوت)
      </h4>

      <div className="space-y-3">
        <Field label="شماره توزین" htmlFor="rd-weighing" required>
          <input
            id="rd-weighing"
            value={weighingNumber}
            onChange={(e) => setWeighingNumber(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
        </Field>

        <Field label="تاریخ" htmlFor="rd-date" required>
          <input
            id="rd-date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
        </Field>

        <Field label="باربری (اختیاری)" htmlFor="rd-carrier">
          <select
            id="rd-carrier"
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            disabled={busy || carriers.length === 0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          >
            <option value="">
              {carriers.length === 0 ? 'باربری فعالی ثبت نشده است' : 'بدون باربری'}
            </option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="شماره ماشین" htmlFor="rd-vehicle">
          <input
            id="rd-vehicle"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
        </Field>

        <Field label="راننده" htmlFor="rd-driver">
          <input
            id="rd-driver"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
        </Field>

        <Field label="موبایل راننده" htmlFor="rd-driver-mobile">
          <input
            id="rd-driver-mobile"
            type="tel"
            inputMode="numeric"
            value={driverMobile}
            onChange={(e) => setDriverMobile(e.target.value)}
            disabled={busy}
            placeholder="۰۹xxxxxxxxx"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
        </Field>

        <Field label="مقدار تحویل‌شده (تن)" htmlFor="rd-qty" required>
          <input
            id="rd-qty"
            type="number"
            step="0.001"
            min="0.001"
            max={request.requestedQty}
            value={deliveredQty}
            onChange={(e) => setDeliveredQty(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-slate-500">
            پیش‌فرض برابر مقدار اعلام‌شده است؛ اگر کمتر تحویل شد اصلاح کنید.
          </p>
        </Field>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          ثبت تحویل
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
