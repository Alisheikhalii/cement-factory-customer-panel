'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, Loader2, X } from 'lucide-react';
import {
  FEATURE_FLAGS,
  LoadType,
  VehicleType,
  type CreateLoadingRequestInput,
  type DashboardSummaryDto,
  type OrderDto,
  type SelectableOrderDto,
  type SelectableProductDto,
} from '@cement/shared-types';
import { apiClient, ApiError } from '../../lib/api';
import { useFeatureFlag } from '../../lib/feature-flags';
import { formatJalaliDate, formatNumber } from '../../lib/format';

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

/** ساعت پایان پنجره ثبت درخواست به وقت تهران (BR-04). */
const REQUEST_CUTOFF_HOUR = 15;

/** آیا «الان» به وقت تهران بعد از ساعت ۱۵ است؟ (هشدار سمت کلاینت؛ Backend منبع نهایی است.) */
function isAfterCutoffTehran(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  );
  return hour >= REQUEST_CUTOFF_HOUR;
}

/** تاریخ «فردا» به وقت تهران برای نمایش شمسی (BR-04 — تاریخ نهایی را Backend ست می‌کند). */
function tomorrowTehranIso(): string {
  const now = new Date();
  const tehranNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
  tehranNow.setDate(tehranNow.getDate() + 1);
  return tehranNow.toISOString();
}

/** سفارشِ از پیش انتخاب‌شده (کشوی سفارش) را به همان شکل ردیف‌های Dropdown درمی‌آورد. */
function toSelectable(order: OrderDto): SelectableOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    productId: order.productId,
    productName: order.productName,
    remainingQty: order.remainingQty,
  };
}

/**
 * یک گزینهٔ Dropdown «سفارش (برگ فروش)».
 *
 * دو منبع دارد و شکل واحد آن‌ها را یکی می‌کند تا بقیهٔ فرم شرطی نشود:
 * - حالت عادی (PRD): از سفارش‌های دارای مانده؛ `orderId` دارد و مانده نمایش می‌یابد.
 * - حالت `FEATURE_PILOT_PRODUCT_SELECTION`: از محصولات؛ `orderId` ندارد و
 *   `remainingQty = null` است، یعنی «مانده‌ای نمایش/اعمال نمی‌شود».
 */
interface OrderChoice {
  value: string;
  label: string;
  productId: string;
  productName: string;
  orderId?: string;
  remainingQty: number | null;
}

function orderToChoice(row: SelectableOrderDto): OrderChoice {
  return {
    value: row.id,
    label: `${row.orderNumber} — ${row.productName} (مانده: ${formatNumber(row.remainingQty)})`,
    productId: row.productId,
    productName: row.productName,
    orderId: row.id,
    remainingQty: row.remainingQty,
  };
}

function productToChoice(row: SelectableProductDto): OrderChoice {
  return {
    value: row.id,
    label: row.name,
    productId: row.id,
    productName: row.name,
    remainingQty: null,
  };
}

/**
 * فرم/مودال ثبت درخواست اعلام بار جدید (بخش ۹.۵ / ۷.۲ — BR-04..BR-09, BR-24).
 *
 * - اگر `order` داده شود (از کشوی سفارش)، سفارش قفل است؛ وگرنه Dropdown سفارش‌های
 *   دارای مانده (remainingQty > 0) نمایش داده می‌شود (بخش ۹.۵).
 * - محصول به‌صورت خودکار از سفارش انتخابی می‌آید (BR-06) و قابل تغییر نیست.
 * - مقدار درخواستی به‌صورت Real-time با مانده سفارش اعتبارسنجی می‌شود (BR-05).
 * - تاریخ درخواستی همیشه «فردا» است و توسط Backend ست می‌شود (BR-04)؛ اینجا فقط نمایش قفل.
 * - بعد از ساعت ۱۵ تهران، فرم غیرفعال و هشدار نمایش داده می‌شود (BR-04؛ Backend هم LOAD_002 می‌دهد).
 * - موبایل تحویل‌گیرنده با موبایل حساب مشتری Pre-fill می‌شود ولی قابل ویرایش است (BR-24).
 * - باربری فعلاً «کارخانه تعیین کند» (پیش‌فرض BR-08)؛ لیست باربری‌ها در Backend موجود نیست.
 * - شماره ماشین/راننده هرگز اینجا نیست (BR-09).
 * - خطاهای Backend (LOAD_001..006) عیناً به کاربر نمایش داده می‌شوند.
 */
export function NewLoadingRequestForm({
  order,
  onClose,
  onSuccess,
}: {
  /** سفارش از پیش انتخاب‌شده (از کشوی سفارش)؛ اگر نباشد Dropdown نمایش داده می‌شود. */
  order?: OrderDto;
  onClose: () => void;
  onSuccess: () => void;
}): React.ReactElement {
  const [orders, setOrders] = useState<OrderChoice[]>(
    order ? [orderToChoice(toSelectable(order))] : [],
  );
  const [ordersLoading, setOrdersLoading] = useState(!order);
  /**
   * خطای دریافت فهرست سفارش‌ها، جدا از `error` فرم نگه داشته می‌شود تا پیام
   * «سفارش فعالی ندارید» به‌اشتباه روی یک درخواست ناموفق نمایش داده نشود.
   */
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(order?.id ?? '');
  const [requestedQty, setRequestedQty] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.TRAILER);
  const [loadType, setLoadType] = useState<LoadType>(LoadType.FIXED);
  const [destinationCity, setDestinationCity] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // در دورهٔ پایلوت پرچم مهلت خاموش است تا تست در هر ساعتی ممکن باشد؛ آن‌وقت نه
  // هشدار نمایش داده می‌شود و نه فرم قفل می‌شود. Backend همان پرچم را می‌خواند.
  const cutoffEnforced = useFeatureFlag(FEATURE_FLAGS.REQUEST_CUTOFF_ENFORCED);
  const afterCutoff = cutoffEnforced && isAfterCutoffTehran();
  // در دورهٔ پایلوت مشتری به‌جای «سفارش دارای مانده»، مستقیماً محصول را انتخاب می‌کند
  // (تا اتصال ERP ممکن است هیچ سفارشی نداشته باشد). Backend همین پرچم را می‌خواند و
  // خودش سفارشِ مرجع را حل می‌کند، پس اینجا هیچ محصولی Hard-code نمی‌شود.
  const productSelection = useFeatureFlag(FEATURE_FLAGS.PILOT_PRODUCT_SELECTION);
  const tomorrowLabel = useMemo(() => formatJalaliDate(tomorrowTehranIso()), []);

  const selectedOrder = orders.find((o) => o.value === selectedOrderId) ?? null;
  const qtyNumber = Number(requestedQty);
  // `remainingQty === null` یعنی حالت انتخاب محصول: مانده‌ای برای مقایسه وجود ندارد.
  const qtyTooHigh =
    selectedOrder !== null &&
    selectedOrder.remainingQty !== null &&
    Number.isFinite(qtyNumber) &&
    qtyNumber > selectedOrder.remainingQty;

  // ۹.۵: فقط سفارش‌های «در حال استفاده» با مانده > 0 قابل انتخاب‌اند.
  // ⚠️ از مسیر خودِ اعلام بار خوانده می‌شود، نه `GET /orders`: در دورهٔ پایلوت پرچم
  // `ORDERS_ENABLED` خاموش است و آن مسیر ۴۰۳/FEATURE_DISABLED می‌دهد، پس Dropdown
  // همیشه خالی می‌ماند حتی وقتی ادمین سفارش دستی ثبت کرده است.
  // در حالت `PILOT_PRODUCT_SELECTION` همین Dropdown از فهرست محصولات پر می‌شود.
  useEffect(() => {
    if (order) return;
    let active = true;
    const request = productSelection
      ? apiClient
          .get<SelectableProductDto[]>('/loading-requests/selectable-products')
          .then((rows) => rows.map(productToChoice))
      : apiClient
          .get<SelectableOrderDto[]>('/loading-requests/selectable-orders')
          .then((rows) => rows.map(orderToChoice));

    setOrdersLoading(true);
    request
      .then((rows) => {
        if (!active) return;
        setOrders(rows);
        setOrdersError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setOrdersError(
          err instanceof ApiError
            ? err.message
            : productSelection
              ? 'دریافت فهرست محصولات ناموفق بود'
              : 'دریافت فهرست سفارش‌های دارای مانده ناموفق بود',
        );
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order, productSelection]);

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

    if (!selectedOrder) {
      setError('انتخاب سفارش الزامی است');
      return;
    }
    const qty = Number(requestedQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('مقدار درخواستی باید عددی بزرگ‌تر از صفر باشد');
      return;
    }
    // فقط وقتی مانده‌ای در دست است (حالت انتخاب سفارش). در حالت انتخاب محصول مانده
    // معنا ندارد و Backend هم قید BR-05 را اعمال نمی‌کند.
    if (selectedOrder.remainingQty !== null && qty > selectedOrder.remainingQty) {
      setError(
        `مقدار درخواستی از مانده سفارش (${formatNumber(selectedOrder.remainingQty)}) بیشتر است`,
      );
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
      // در حالت انتخاب محصول سفارشی انتخاب نشده، پس کلید ارسال نمی‌شود و Backend
      // سفارشِ مرجع را حل می‌کند. (ValidationPipe با whitelist، مقدار undefined را
      // به‌عنوان فیلد ناشناخته رد نمی‌کند اما حذف کلید صریح‌تر است.)
      ...(selectedOrder.orderId ? { orderId: selectedOrder.orderId } : {}),
      productId: selectedOrder.productId,
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

  const disabled = afterCutoff || submitting;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-modal" onClick={onClose} />
      <div className="glass-panel animate-fade-up relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl shadow-lg">
        <div className="flex items-center justify-between border-b border-white/40 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-on-surface">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-container to-secondary text-white">
              <ClipboardList className="h-4 w-4" />
            </span>
            ثبت درخواست اعلام بار جدید
          </h3>
          <button
            onClick={onClose}
            className="interactive-element rounded-lg p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-on-surface"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[calc(90vh-73px)] overflow-y-auto p-6">
          {/* هشدار پنجره زمانی BR-04 */}
          {afterCutoff && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/10 p-3.5 text-xs leading-6 text-warning">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                ثبت درخواست اعلام بار فقط تا ساعت <b>۱۵:۰۰</b> به وقت تهران امکان‌پذیر است. لطفاً
                فردا پیش از ساعت ۱۵ اقدام کنید.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* انتخاب سفارش (۹.۵) */}
            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">سفارش (برگ فروش)</span>
              {order ? (
                <div className="input-soft w-full rounded-lg px-3 py-2.5 text-on-surface">
                  {order.orderNumber} — {order.productName}
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    setError(null);
                  }}
                  className="input-glass w-full px-3 py-2.5"
                  disabled={disabled || ordersLoading}
                  required
                >
                  <option value="">
                    {ordersLoading
                      ? 'در حال دریافت فهرست…'
                      : productSelection
                        ? 'انتخاب کنید…'
                        : 'انتخاب سفارش دارای مانده…'}
                  </option>
                  {orders.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {/* خطای دریافت فهرست با «سفارشی ندارید» اشتباه گرفته نمی‌شود. */}
              {!order && !ordersLoading && ordersError !== null && (
                <span className="mt-1.5 block text-xs text-danger">{ordersError}</span>
              )}
              {!order && !ordersLoading && ordersError === null && orders.length === 0 && (
                <span className="mt-1.5 block text-xs text-on-surface-variant/80">
                  {productSelection
                    ? 'فهرست محصولات در دسترس نیست؛ با کارخانه تماس بگیرید.'
                    : 'سفارش فعالی با مانده قابل اعلام بار ندارید.'}
                </span>
              )}
            </label>

            {/* محصول خودکار + مانده (BR-06) */}
            {selectedOrder && (
              <div className="rounded-xl bg-white/50 border border-white/60 p-3.5 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>محصول:</span>
                  <span className="font-bold text-on-surface">{selectedOrder.productName}</span>
                </div>
                {/* مانده فقط در حالت انتخاب سفارش معنا دارد (بخش ۹.۵). */}
                {selectedOrder.remainingQty !== null && (
                  <div className="mt-1.5 flex justify-between">
                    <span>مانده سفارش:</span>
                    <span className="font-bold text-on-surface tabular-nums">
                      {formatNumber(selectedOrder.remainingQty)}
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex justify-between">
                  <span>تاریخ درخواستی (فردا — غیرقابل تغییر):</span>
                  <span className="font-bold text-on-surface">{tomorrowLabel}</span>
                </div>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">مقدار درخواستی</span>
              <input
                type="number"
                min="0"
                step="any"
                value={requestedQty}
                onChange={(e) => setRequestedQty(e.target.value)}
                className={`input-glass w-full px-3 py-2.5 ${
                  qtyTooHigh ? '!border-danger' : ''
                }`}
                disabled={disabled}
                required
              />
              {selectedOrder !== null && selectedOrder.remainingQty !== null && qtyTooHigh && (
                <span className="mt-1.5 block text-xs text-danger">
                  حداکثر مقدار مجاز: {formatNumber(selectedOrder.remainingQty)} (BR-05)
                </span>
              )}
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-medium text-on-surface">نوع خودرو</span>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="input-glass w-full px-3 py-2.5"
                  disabled={disabled}
                >
                  {Object.values(VehicleType).map((v) => (
                    <option key={v} value={v}>
                      {VEHICLE_LABELS[v]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-medium text-on-surface">نوع بار</span>
                <select
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value as LoadType)}
                  className="input-glass w-full px-3 py-2.5"
                  disabled={disabled}
                >
                  {Object.values(LoadType).map((v) => (
                    <option key={v} value={v}>
                      {LOAD_TYPE_LABELS[v]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">باربری</span>
              <div className="input-soft w-full rounded-lg px-3 py-2.5 text-on-surface-variant">
                کارخانه تعیین کند (پیش‌فرض)
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">شهر مقصد بار</span>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="input-glass w-full px-3 py-2.5"
                disabled={disabled}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">
                آدرس تکمیلی و توضیحات (اختیاری)
              </span>
              <textarea
                value={additionalAddress}
                onChange={(e) => setAdditionalAddress(e.target.value)}
                rows={2}
                className="input-glass w-full px-3 py-2.5"
                disabled={disabled}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">
                کد پستی مقصد (اختیاری)
              </span>
              <input
                type="text"
                value={destinationPostalCode}
                onChange={(e) => setDestinationPostalCode(e.target.value)}
                className="input-glass w-full px-3 py-2.5"
                disabled={disabled}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-medium text-on-surface">موبایل تحویل‌گیرنده</span>
              <input
                type="tel"
                value={recipientMobile}
                onChange={(e) => setRecipientMobile(e.target.value)}
                className="input-glass w-full px-3 py-2.5"
                placeholder="۰۹xxxxxxxxx"
                disabled={disabled}
                required
              />
              <span className="mt-1.5 block text-xs text-on-surface-variant/80">
                به‌صورت پیش‌فرض موبایل حساب شماست؛ در صورت نیاز شماره راننده/تحویل‌گیرنده را وارد
                کنید.
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={disabled || !selectedOrder || qtyTooHigh}
                className="gradient-btn interactive-element flex flex-1 items-center justify-center gap-2 py-2.5 font-bold text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'در حال ثبت…' : 'ثبت درخواست'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="interactive-element rounded-lg border border-outline-variant/60 bg-white/50 px-5 py-2.5 text-on-surface-variant transition-colors hover:bg-white/80"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
