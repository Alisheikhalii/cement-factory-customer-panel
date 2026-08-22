'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  isChunkLoadError,
  logClientError,
  reloadOnceForChunkError,
} from '../../lib/log-client-error';

/**
 * پیام و دکمهٔ استانداردِ خطا (Issue 3a). عمداً یک کامپوننتِ جدا و صادرشده است تا
 * app/error.tsx و app/global-error.tsx هم دقیقاً همین ظاهر را استفاده کنند (DRY).
 *
 * «تلاش مجدد» رفتارش را از فراخواننده می‌گیرد: در ErrorBoundary فقط همان بخش را
 * دوباره رندر می‌کند (بدون رفرشِ کاملِ صفحه)، و در مرزهای Next با reset() هم‌سو است.
 */
export function ErrorFallback({
  onRetry,
  compact = false,
}: {
  onRetry: () => void;
  /** نسخهٔ کم‌ارتفاع برای مرزهای داخلِ صفحه (مثلاً بخشِ جدول). */
  compact?: boolean;
}): React.ReactElement {
  return (
    <div
      role="alert"
      className={`flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center ${
        compact ? 'min-h-[220px]' : 'min-h-[320px]'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-on-surface">خطایی پیش آمد، لطفاً صفحه را رفرش کنید</p>
        <p className="text-xs leading-6 text-on-surface-variant/80">
          اگر مشکل ادامه داشت، چند لحظه بعد دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="gradient-btn interactive-element flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
      >
        <RefreshCw className="h-4 w-4" />
        تلاش مجدد
      </button>
    </div>
  );
}

interface Props {
  children: ReactNode;
  /** برچسبِ محلِ مرز برای لاگ (مثلاً "PortalShell" یا "loading-requests/table"). */
  name?: string;
  /** اگر داده شود جایگزینِ Fallback پیش‌فرض می‌شود؛ `reset` همان بخش را باز-رندر می‌کند. */
  fallback?: (reset: () => void) => ReactNode;
  /** نسخهٔ کم‌ارتفاعِ Fallback پیش‌فرض. */
  compact?: boolean;
}

interface State {
  hasError: boolean;
}

/**
 * مرزِ خطای قابل‌استفادهٔ مجدد (Issue 3a). چون Error Boundary فقط با Class Component
 * ممکن است، همین‌جا به‌صورت Class نوشته شده (بدون افزودن وابستگیِ بیرونی).
 *
 * رفتار:
 *  - خطای رندرِ زیرمجموعه را می‌گیرد، «علتِ واقعی» را با componentStack لاگ می‌کند و
 *    به‌جای سقوطِ کلِ صفحه، پیام فارسی + «تلاش مجدد» را نشان می‌دهد.
 *  - «تلاش مجدد» فقط همین مرز را ری‌ست می‌کند (بخش دوباره رندر می‌شود، نه کلِ صفحه) —
 *    یعنی سایدبار/هدرِ پوسته دست‌نخورده می‌ماند.
 *  - اگر خطا ChunkLoadError باشد (استقرارِ نسخهٔ جدید)، یک‌بار خودکار رفرش می‌کند.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logClientError(error, {
      boundary: this.props.name ?? 'ErrorBoundary',
      componentStack: info.componentStack,
    });
    if (isChunkLoadError(error)) {
      // معمولاً بعد از استقرارِ نسخهٔ جدید؛ یک‌بار رفرشِ خودکار مشکل را رفع می‌کند.
      reloadOnceForChunkError();
    }
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    if (this.props.fallback) {
      return this.props.fallback(this.reset);
    }
    return <ErrorFallback onRetry={this.reset} compact={this.props.compact} />;
  }
}
