'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '../components/shared/ErrorBoundary';
import {
  isChunkLoadError,
  logClientError,
  reloadOnceForChunkError,
} from '../lib/log-client-error';

/**
 * مرزِ خطای سطحِ مسیر برای App Router (Issue 3a).
 *
 * هر خطای رندرنشدهٔ داخلِ صفحات (زیرِ RootLayout) اینجا گرفته می‌شود و به‌جای صفحهٔ
 * سفیدِ «Application error»، پیام فارسی + «تلاش مجدد» نمایش داده می‌شود. `reset` که
 * Next می‌دهد همان بخش (Route Segment) را دوباره رندر می‌کند، نه کلِ صفحه را.
 *
 * ⚠️ اینجا Next فقط `error` (با `digest` در Production) می‌دهد و `componentStack` در
 * دسترس نیست؛ آن جزئیات را ErrorBoundary سفارشی (componentDidCatch) لاگ می‌کند.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    logClientError(error, { boundary: 'app/error.tsx' });
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }, [error]);

  return (
    <div className="dashboard-bg flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorFallback onRetry={reset} />
      </div>
    </div>
  );
}
