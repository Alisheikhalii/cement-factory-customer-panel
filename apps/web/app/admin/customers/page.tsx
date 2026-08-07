'use client';

import { useMemo, useState } from 'react';
import { KeyRound, Package, Pencil, Plus, Power, Trash2, Users } from 'lucide-react';
import type {
  AdminCustomerDto,
  CreateCustomerInput,
  CreateCustomerResult,
  DeleteCustomerResult,
  ResetCustomerPasswordResult,
  UpdateCustomerInput,
} from '@cement/shared-types';
import { FEATURE_FLAGS } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { useFeatureFlag } from '../../../lib/feature-flags';
import { formatJalaliDate } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { SmartTable, type SmartColumn } from '../../../components/shared/SmartTable';
import { CustomerFormModal } from './CustomerFormModal';
import { ManualOrderModal } from './ManualOrderModal';
import { TempPasswordModal } from './TempPasswordModal';

export default function AdminCustomersPage(): React.ReactElement {
  const user = useRequireAdmin();
  const manualOrdersEnabled = useFeatureFlag(FEATURE_FLAGS.MANUAL_ORDER_ENTRY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCustomerDto | null>(null);
  const [manualOrderFor, setManualOrderFor] = useState<AdminCustomerDto | null>(null);
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    return params.toString();
  }, [page, pageSize, search]);

  const { state, data, reload } = useApiData<{ rows: AdminCustomerDto[]; total: number }>(
    async () => {
      const res = await apiClient.getWithMeta<AdminCustomerDto[]>(`/admin/customers?${queryString}`);
      return { rows: res.data, total: res.meta?.total ?? res.data.length };
    },
    [queryString],
  );

  const rows = data?.rows ?? [];

  function openCreate(): void {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: AdminCustomerDto): void {
    setEditing(customer);
    setFormOpen(true);
  }

  async function handleSubmit(
    input: CreateCustomerInput | UpdateCustomerInput,
  ): Promise<void> {
    setActionError(null);
    if (editing) {
      await apiClient.patch<AdminCustomerDto>(`/admin/customers/${editing.id}`, input);
    } else {
      const res = await apiClient.post<CreateCustomerResult>('/admin/customers', input);
      setTempPassword({ name: res.customer.name, password: res.temporaryPassword });
    }
    setFormOpen(false);
    reload();
  }

  async function handleToggle(customer: AdminCustomerDto): Promise<void> {
    setActionError(null);
    setBusyId(customer.id);
    try {
      await apiClient.patch<AdminCustomerDto>(`/admin/customers/${customer.id}/toggle-active`);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'تغییر وضعیت ناموفق بود');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(customer: AdminCustomerDto): Promise<void> {
    // حذف نرم است، اما برای ادمین بازگشت‌پذیر نیست؛ پس تأیید صریح با نام مشتری.
    if (
      !window.confirm(
        `مشتری «${customer.name}» حذف شود؟\n\n` +
          'حساب کاربری او غیرفعال می‌شود و دیگر نمی‌تواند وارد شود. ' +
          'سابقهٔ سفارش‌ها و تحویل‌های او حفظ می‌شود.',
      )
    ) {
      return;
    }
    setActionError(null);
    setBusyId(customer.id);
    try {
      await apiClient.del<DeleteCustomerResult>(`/admin/customers/${customer.id}`);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'حذف مشتری ناموفق بود');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset(customer: AdminCustomerDto): Promise<void> {
    if (!window.confirm(`رمز عبور مشتری «${customer.name}» بازنشانی شود؟`)) {
      return;
    }
    setActionError(null);
    setBusyId(customer.id);
    try {
      const res = await apiClient.patch<ResetCustomerPasswordResult>(
        `/admin/customers/${customer.id}/reset-password`,
      );
      setTempPassword({ name: customer.name, password: res.temporaryPassword });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'بازنشانی رمز ناموفق بود');
    } finally {
      setBusyId(null);
    }
  }

  const columns: SmartColumn<AdminCustomerDto>[] = [
    { key: 'name', header: 'نام مشتری' },
    { key: 'customerCode', header: 'کد تفصیل' },
    { key: 'nationalId', header: 'کد ملی', render: (r) => r.nationalId ?? '—' },
    { key: 'mobile', header: 'موبایل' },
    {
      key: 'isActive',
      header: 'وضعیت',
      render: (r) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            r.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {r.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    { key: 'createdAt', header: 'تاریخ ایجاد', render: (r) => formatJalaliDate(r.createdAt) },
    {
      key: 'actions',
      header: 'عملیات',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(r)}
            className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="ویرایش"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleToggle(r)}
            disabled={busyId === r.id}
            className="rounded border border-amber-200 p-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            title={r.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleReset(r)}
            disabled={busyId === r.id}
            className="rounded border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            title="بازنشانی رمز"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </button>
          {/* ثبت سفارش دستی — فقط در فاز پایلوت (FEATURE_MANUAL_ORDER_ENTRY). */}
          {manualOrdersEnabled && (
            <button
              onClick={() => setManualOrderFor(r)}
              disabled={busyId === r.id}
              className="rounded border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
              title="ثبت سفارش دستی (پایلوت)"
            >
              <Package className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDelete(r)}
            disabled={busyId === r.id}
            className="rounded border border-danger/25 p-1.5 text-danger hover:bg-danger/10 disabled:opacity-50"
            title="حذف مشتری"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <AdminShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          <Users className="h-5 w-5" />
          مدیریت مشتریان
        </h2>
        <button
          onClick={openCreate}
          className="gradient-btn interactive-element flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          تعریف مشتری جدید
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
          setPage(1);
        }}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="جستجو (نام، کد تفصیل، کد ملی، موبایل)"
          className="input-glass min-w-64 flex-1 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="interactive-element rounded-lg border border-outline-variant/60 bg-white/50 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-white/80"
        >
          جستجو
        </button>
      </form>

      {actionError && (
        <p className="mb-3 rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {actionError}
        </p>
      )}

      <DataStateView state={state} isEmpty={rows.length === 0} onRetry={reload} skeletonCols={7}>
        <SmartTable
          columns={columns}
          rows={rows}
          pagination={{
            page,
            pageSize,
            total: data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      </DataStateView>

      {formOpen && (
        <CustomerFormModal
          customer={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {manualOrderFor && (
        <ManualOrderModal
          customer={manualOrderFor}
          onClose={() => setManualOrderFor(null)}
        />
      )}

      {tempPassword && (
        <TempPasswordModal
          customerName={tempPassword.name}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
      )}
    </AdminShell>
  );
}
