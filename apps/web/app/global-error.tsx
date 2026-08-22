'use client';

import { useEffect } from 'react';
import {
  isChunkLoadError,
  logClientError,
  reloadOnceForChunkError,
} from '../lib/log-client-error';

/**
 * مرزِ خطای سطحِ ریشه برای App Router (Issue 3a).
 *
 * فقط وقتی فعال می‌شود که خطا در خودِ RootLayout رخ دهد (جایی که app/error.tsx آن را
 * نمی‌گیرد). چون این کامپوننت جایگزینِ کاملِ RootLayout می‌شود، باید خودش `<html>` و
 * `<body>` را رندر کند و چون globals.css اینجا بارگذاری نمی‌شود، استایل‌ها Inline‌اند.
 *
 * «تلاش مجدد» ابتدا reset() را صدا می‌زند؛ اگر خطای ریشه پابرجا بود، دکمهٔ دومْ رفرشِ
 * کاملِ صفحه را انجام می‌دهد.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    logClientError(error, { boundary: 'app/global-error.tsx' });
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f7f9fb',
          fontFamily: 'Vazirmatn, system-ui, sans-serif',
          color: '#1a1c1e',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '24px',
            padding: '40px 28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>
            خطایی پیش آمد، لطفاً صفحه را رفرش کنید
          </p>
          <p style={{ fontSize: '13px', lineHeight: 1.9, color: '#5b5f63', margin: '0 0 24px' }}>
            اگر مشکل ادامه داشت، چند لحظه بعد دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: 'pointer',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #5300b7, #4b41e1)',
              }}
            >
              تلاش مجدد
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#380080',
                background: 'rgba(83, 0, 183, 0.06)',
                border: '1px solid rgba(83, 0, 183, 0.25)',
              }}
            >
              رفرش صفحه
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
