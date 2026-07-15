'use client';

import { useState } from 'react';
import { BarChart3, Loader2, PackageCheck, Plus, Send, Square } from 'lucide-react';
import { SurveyStatus } from '@cement/shared-types';
import type { AdminSurveyListItem } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { useRequireAdmin } from '../../../lib/use-require-admin';
import { formatJalaliDate, formatNumber } from '../../../lib/format';
import { AdminShell } from '../../../components/shared/AdminShell';
import { DataStateView } from '../../../components/shared/DataStateView';
import { SurveyBuilderModal } from './SurveyBuilderModal';
import { SurveyResultsModal } from './SurveyResultsModal';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  [SurveyStatus.DRAFT]: { label: 'پیش‌نویس', className: 'bg-slate-100 text-slate-600' },
  [SurveyStatus.PUBLISHED]: { label: 'منتشرشده', className: 'bg-green-100 text-green-800' },
  [SurveyStatus.CLOSED]: { label: 'بسته‌شده', className: 'bg-amber-100 text-amber-800' },
};

export default function AdminSurveysPage(): React.ReactElement {
  const user = useRequireAdmin();
  const [status, setStatus] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = status ? `?status=${status}` : '';
  const { state, data, reload } = useApiData<AdminSurveyListItem[]>(
    () => apiClient.get<AdminSurveyListItem[]>(`/admin/surveys${query}`),
    [query],
  );

  const surveys = data ?? [];

  async function act(id: string, action: 'publish' | 'close'): Promise<void> {
    const confirmMsg =
      action === 'publish'
        ? 'با انتشار این نظرسنجی، نظرسنجی منتشرشده فعلی (در صورت وجود) بسته می‌شود. ادامه؟'
        : 'این نظرسنجی بسته شود؟';
    if (!window.confirm(confirmMsg)) return;
    setError(null);
    setBusyId(id);
    try {
      await apiClient.patch(`/admin/surveys/${id}/${action}`);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'عملیات ناموفق بود');
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }

  return (
    <AdminShell user={user}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <PackageCheck className="h-5 w-5" />
          مدیریت نظرسنجی
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">همه</option>
            <option value={SurveyStatus.DRAFT}>پیش‌نویس</option>
            <option value={SurveyStatus.PUBLISHED}>منتشرشده</option>
            <option value={SurveyStatus.CLOSED}>بسته‌شده</option>
          </select>
          <button
            onClick={() => setBuilderOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
          >
            <Plus className="h-4 w-4" />
            ایجاد نظرسنجی جدید
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      <DataStateView
        state={state}
        isEmpty={surveys.length === 0}
        onRetry={reload}
        emptyMessage="هنوز نظرسنجی‌ای ایجاد نشده است."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => {
            const badge = STATUS_LABELS[s.status] ?? {
              label: s.status,
              className: 'bg-slate-100 text-slate-600',
            };
            return (
              <div key={s.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <dl className="mb-4 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <dt>تعداد سوال:</dt>
                    <dd>{formatNumber(s.questionCount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>پاسخ‌های دریافتی:</dt>
                    <dd>{formatNumber(s.answerCount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>تاریخ ایجاد:</dt>
                    <dd>{formatJalaliDate(s.createdAt)}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setResultsId(s.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    نتایج
                  </button>
                  {s.status !== SurveyStatus.PUBLISHED && (
                    <button
                      onClick={() => act(s.id, 'publish')}
                      disabled={busyId === s.id}
                      className="flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      انتشار
                    </button>
                  )}
                  {s.status === SurveyStatus.PUBLISHED && (
                    <button
                      onClick={() => act(s.id, 'close')}
                      disabled={busyId === s.id}
                      className="flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                      بستن
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DataStateView>

      {builderOpen && (
        <SurveyBuilderModal
          onClose={() => setBuilderOpen(false)}
          onCreated={() => {
            setBuilderOpen(false);
            reload();
          }}
        />
      )}

      {resultsId && <SurveyResultsModal id={resultsId} onClose={() => setResultsId(null)} />}
    </AdminShell>
  );
}
