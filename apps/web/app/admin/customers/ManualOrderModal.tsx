'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Package, Pencil, X } from 'lucide-react';
import type {
  AdminCustomerDto,
  AdminManualOrderRow,
  CreateManualOrderInput,
  UpdateManualOrderQtyInput,
} from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { formatNumber } from '../../../lib/format';

interface ActiveProduct {
  id: string;
  name: string;
}

/**
 * مودال ثبت و ویرایش سفارش دستی برای یک مشتری (Task 2 — فاز پایلوت).
 *
 * دو کار در یک مودال: ثبت سفارش جدید، و ویرایش مقدار سفارش‌های دستی قبلی همان
 * مشتری (مقدار خرید در طول هفته تغییر می‌کند). سفارش‌های ERP اینجا دیده نمی‌شوند
 * و قابل ویرایش نیستند — سرور هم همین قید را دارد.
 *
 * فقط وقتی FEATURE_MANUAL_ORDER_ENTRY روشن باشد رندر می‌شود.
 */
export function ManualOrderModal({
  customer,
  onClose,
}: {
  customer: AdminCustomerDto;
  onClose: () => void;
}): React.ReactElement {
  const [products, setProducts] = useState<ActiveProduct[]>([]);
  const [orders, setOrders] = useState<AdminManualOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [productId, setProductId] = useState('');
  const [totalQty, setTotalQty] = useState('');

  /** ویرایش مقدار: شناسه سفارش در حال ویرایش + مقدار جدید. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');

  const loadOrders = useCallback(async (): Promise<void> => {
    const rows = await apiClient.get<AdminManualOrderRow[]>(
      `/admin/manual-orders?customerId=${encodeURIComponent(customer.id)}`,
    );
    setOrders(rows);
  }, [customer.id]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const [productRows, orderRows] = await Promise.all([
          apiClient.get<ActiveProduct[]>('/admin/manual-orders/products'),
          apiClient.get<AdminManualOrderRow[]>(
            `/admin/manual-orders?customerId=${encodeURIComponent(customer.id)}`,
          ),
        ]);
        if (cancelled) return;
        setProducts(productRows);
        setOrders(orderRows);
        // در فاز پایلوت معمولاً یک محصول فعال بیشتر نیست — همان را پیش‌فرض بگذار.
        // تحت noUncheckedIndexedAccess شرط طول، نوع عضو صفر را باریک نمی‌کند؛
        // پس خودِ عضو را می‌گیریم و روی وجودش شرط می‌گذاریم.
        const onlyProduct = productRows.length === 1 ? productRows[0] : undefined;
        if (onlyProduct) {
          setProductId(onlyProduct.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'بارگذاری اطلاعات ناموفق بود');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const qty = Number(totalQty);
    if (!productId || !Number.isFinite(qty) || qty <= 0) {
      setError('محصول و مقدار معتبر را وارد کنید');
      return;
    }

    setBusy(true);
    try {
      const input: CreateManualOrderInput = { customerId: customer.id, productId, totalQty: qty };
      await apiClient.post<AdminManualOrderRow>('/admin/manual-orders', input);
      setTotalQty('');
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت سفارش ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveQty(orderId: string): Promise<void> {
    setError(null);
    const qty = Number(editQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('مقدار جدید معتبر نیست');
      return;
    }

    setBusy(true);
    try {
      const input: UpdateManualOrderQtyInput = { newTotalQty: qty };
      await apiClient.patch<AdminManualOrderRow>(
        `/admin/manual-orders/${orderId}/quantity`,
        input,
      );
      setEditingId(null);
      setEditQty('');
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ویرایش مقدار ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(order: AdminManualOrderRow): void {
    setEditingId(order.id);
    setEditQty(String(order.totalQty));
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface">
            <Package className="h-5 w-5" />
            ثبت سفارش دستی (پایلوت)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="interactive-element rounded-lg p-1.5 text-on-surface-variant hover:bg-white/60"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-on-surface-variant">
          مشتری: <span className="font-bold text-on-surface">{customer.name}</span>
          <span className="mr-2 text-xs">({customer.customerCode})</span>
        </p>

        {error && (
          <p className="mb-3 rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
            {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال بارگذاری…
          </p>
        ) : (
          <>
            <form onSubmit={handleCreate} className="mb-5 space-y-3">
              <div>
                <label
                  htmlFor="manual-order-product"
                  className="mb-1 block text-xs font-bold text-on-surface-variant"
                >
                  محصول
                </label>
                <select
                  id="manual-order-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={busy}
                  className="input-glass w-full px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">انتخاب کنید…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="manual-order-qty"
                  className="mb-1 block text-xs font-bold text-on-surface-variant"
                >
                  مقدار اولیه (تن)
                </label>
                <input
                  id="manual-order-qty"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={totalQty}
                  onChange={(e) => setTotalQty(e.target.value)}
                  disabled={busy}
                  placeholder="مثال: ۵۰"
                  className="input-glass w-full px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="gradient-btn interactive-element w-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? 'در حال ثبت…' : 'ثبت سفارش'}
              </button>
            </form>

            <div className="border-t border-outline-variant/40 pt-4">
              <h4 className="mb-2 text-sm font-bold text-on-surface">سفارش‌های دستی این مشتری</h4>
              {orders.length === 0 ? (
                <p className="py-3 text-xs text-on-surface-variant">
                  هنوز سفارش دستی برای این مشتری ثبت نشده است.
                </p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-xl border border-outline-variant/40 bg-white/40 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-on-surface">{o.orderNumber}</span>
                          <span className="mr-2 text-xs text-on-surface-variant">
                            {o.productName}
                          </span>
                        </div>
                        {editingId !== o.id && (
                          <button
                            type="button"
                            onClick={() => startEdit(o)}
                            disabled={busy}
                            className="interactive-element flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Pencil className="h-3 w-3" />
                            ویرایش مقدار
                          </button>
                        )}
                      </div>

                      <div className="mt-1 flex gap-4 text-xs text-on-surface-variant">
                        <span>
                          مقدار: <span className="tabular-nums">{formatNumber(o.totalQty)}</span> تن
                        </span>
                        <span>
                          مانده: <span className="tabular-nums">{formatNumber(o.remainingQty)}</span>{' '}
                          تن
                        </span>
                      </div>

                      {editingId === o.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            disabled={busy}
                            aria-label={`مقدار جدید سفارش ${o.orderNumber}`}
                            className="input-glass flex-1 px-2 py-1.5 text-sm disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveQty(o.id)}
                            disabled={busy}
                            className="gradient-btn interactive-element px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            ذخیره
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={busy}
                            className="interactive-element rounded-lg border border-outline-variant/60 bg-white/50 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-white/80 disabled:opacity-50"
                          >
                            انصراف
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
