import { AlertTriangle, RefreshCw } from 'lucide-react';

/** حالت خطا (بخش ۱۰.۹ — Error): آیکون + پیام + دکمه تلاش مجدد. */
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <AlertTriangle className="h-12 w-12 text-red-400" />
      <p className="text-sm">{message ?? 'خطا در دریافت اطلاعات؛ لطفاً بعداً تلاش کنید'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw className="h-4 w-4" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

/** حالت دسترسی غیرمجاز (بخش ۱۰.۹ — Forbidden 403). */
export function ForbiddenState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <AlertTriangle className="h-12 w-12 text-amber-400" />
      <p className="text-sm">شما دسترسی لازم برای این بخش را ندارید</p>
    </div>
  );
}
