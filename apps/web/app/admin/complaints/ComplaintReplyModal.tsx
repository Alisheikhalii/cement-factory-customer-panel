'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ComplaintStatus } from '@cement/shared-types';
import type { AdminComplaintDto } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';
import { formatJalaliDate } from '../../../lib/format';
import { StatusBadge } from '../../../components/shared/StatusBadge';

/**
 * مودال مشاهده و پاسخ به شکایت (بخش ۹.۹.۴). ثبت پاسخ → PENDING → ANSWERED،
 * و پاسخ بلافاصله در پورتال مشتری قابل مشاهده می‌شود.
 */
export function ComplaintReplyModal({
  complaint,
  onClose,
  onReplied,
}: {
  complaint: AdminComplaintDto;
  onClose: () => void;
  onReplied: () => void;
}): React.ReactElement {
  const [reply, setReply] = useState(complaint.reply ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answered = complaint.status === ComplaintStatus.ANSWERED;

  async function submit(): Promise<void> {
    if (reply.trim() === '') {
      setError('متن پاسخ الزامی است');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await apiClient.patch(`/admin/complaints/${complaint.id}/reply`, { reply: reply.trim() });
      onReplied();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت پاسخ ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl p-6 shadow-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">شکایت مشتری</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">مشتری:</span>
            <span className="text-slate-700">{complaint.customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">تاریخ:</span>
            <span className="text-slate-700">{formatJalaliDate(complaint.submittedAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">وضعیت:</span>
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-sm font-semibold text-slate-700">{complaint.subject}</p>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{complaint.description}</p>
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">پاسخ</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            readOnly={answered}
            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 ${
              answered ? 'bg-slate-100 text-slate-500' : ''
            }`}
            placeholder="متن پاسخ به شکایت…"
          />
        </div>

        {answered && complaint.repliedAt && (
          <p className="mb-2 text-xs text-slate-400">
            پاسخ در {formatJalaliDate(complaint.repliedAt)} ثبت شده است.
          </p>
        )}

        {error && <p className="mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            بستن
          </button>
          {!answered && (
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              ثبت پاسخ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
