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
    <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-on-surface-variant">
      <AlertTriangle className="h-12 w-12 text-danger/70" />
      <p className="text-sm">{message ?? 'خطا در دریافت اطلاعات؛ لطفاً بعداً تلاش کنید'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="interactive-element mt-2 flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white/50 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-white/80"
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
    <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-on-surface-variant">
      <AlertTriangle className="h-12 w-12 text-warning/70" />
      <p className="text-sm">شما دسترسی لازم برای این بخش را ندارید</p>
    </div>
  );
}
