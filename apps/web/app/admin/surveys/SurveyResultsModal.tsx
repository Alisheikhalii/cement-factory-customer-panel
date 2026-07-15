'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { X } from 'lucide-react';
import type { SurveyResultsDto } from '@cement/shared-types';
import { apiClient } from '../../../lib/api';
import { useApiData } from '../../../lib/use-api-data';
import { formatNumber } from '../../../lib/format';

const BAR_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

/**
 * مودال نمایش گرافیکی نتایج نظرسنجی به تفکیک سوال/گزینه (بخش ۹.۹.۵ / BR-27).
 * درصد انتخاب هر گزینه + تعداد کل پاسخ‌دهندگان.
 */
export function SurveyResultsModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}): React.ReactElement {
  const { state, data, reload } = useApiData<SurveyResultsDto>(
    () => apiClient.get<SurveyResultsDto>(`/admin/surveys/${id}/results`),
    [id],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl p-6 shadow-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">نتایج نظرسنجی</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>

        {state === 'loading' && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="text-center text-sm text-slate-500">
            <p className="mb-3">خطا در دریافت نتایج.</p>
            <button onClick={reload} className="rounded-lg border border-slate-300 px-4 py-2">
              تلاش مجدد
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-slate-800">{data.title}</span>
              <span className="text-sm text-slate-500">
                تعداد پاسخ‌دهندگان: {formatNumber(data.totalRespondents)}
              </span>
            </div>

            {data.totalRespondents === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                هنوز پاسخی برای این نظرسنجی ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-6">
                {data.questions.map((q, qi) => (
                  <div key={q.questionId} className="rounded-xl border border-slate-200 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                      {qi + 1}. {q.text}
                    </h4>
                    <div className="h-56 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={q.options}
                          layout="vertical"
                          margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis
                            type="category"
                            dataKey="text"
                            width={120}
                            tick={{ fontSize: 11, fill: '#334155' }}
                          />
                          <Tooltip
                            formatter={(value: number, _name, item) => {
                              const pct = (item?.payload as { percentage?: number })?.percentage ?? 0;
                              return [`${value.toLocaleString('fa-IR')} (${pct}٪)`, 'پاسخ'];
                            }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {q.options.map((_, oi) => (
                              <Cell key={oi} fill={BAR_COLORS[oi % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {q.options.map((o) => (
                        <li key={o.optionId} className="flex justify-between">
                          <span>{o.text}</span>
                          <span>
                            {formatNumber(o.count)} ({o.percentage}٪)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
