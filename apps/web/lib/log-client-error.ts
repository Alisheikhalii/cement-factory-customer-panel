'use client';

/**
 * نقطهٔ واحدِ ثبتِ خطاهای سمت کلاینت (Issue 3).
 *
 * همهٔ مرزهای خطا (ErrorBoundary سفارشی، app/error.tsx و app/global-error.tsx) از
 * همین‌جا استفاده می‌کنند تا:
 *  - «علتِ واقعی» (نام، پیام، Stack و در صورت وجود componentStack و digest) در Console
 *    ثبت شود — نه فقط پیام عمومیِ روی صفحه (خواستهٔ صریح Issue 3a).
 *  - یک قلاب واحد برای ارسال به سرویس لاگ‌گیری در آینده وجود داشته باشد (الان فقط Console).
 */

export interface ClientErrorContext {
  /** محل گرفتنِ خطا برای ردیابی در لاگ (مثلاً "PortalShell" یا "app/error.tsx"). */
  boundary: string;
  /** درختِ کامپوننتِ محلِ خطا؛ فقط از componentDidCatch در دسترس است. */
  componentStack?: string | null;
}

/**
 * آیا این خطا از نوعِ «شکستِ بارگیریِ Chunk» است؟
 *
 * پرتکرارترین علتِ خطای «Application error» که «با رفرش برطرف می‌شود» همین است: بعد از
 * استقرارِ نسخهٔ جدید، نام فایل‌های Chunk تغییر می‌کند؛ تبِ بازِ قدیمی هنوز به نام‌های
 * قبلی اشاره دارد و هنگام بارگیریِ تنبلِ یک Chunk با ۴۰۴ مواجه و ChunkLoadError پرتاب
 * می‌شود. رفرش، HTML/Chunkهای جدید را می‌آورد و مشکل رفع می‌شود.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { name?: string; message?: string };
  if (e.name === 'ChunkLoadError') return true;
  return (
    typeof e.message === 'string' &&
    /loading (css )?chunk [\w-]+ failed|failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
      e.message,
    )
  );
}

/** کلید نشست برای جلوگیری از حلقهٔ رفرشِ بی‌پایان هنگام ChunkLoadError. */
const CHUNK_RELOAD_KEY = 'cement_chunk_reload_at';

/**
 * هنگام ChunkLoadError یک‌بار خودکار صفحه را تازه می‌کند تا HTML/Chunk جدید بیاید.
 *
 * با ثبتِ زمانِ آخرین رفرش در sessionStorage، اگر همین چند ثانیهٔ اخیر یک‌بار به همین
 * دلیل رفرش کرده باشیم دوباره رفرش نمی‌کند (جلوگیری از حلقه وقتی خطا با رفرش هم نرود).
 * @returns آیا رفرش انجام شد؟ (اگر false، مرزِ خطا باید Fallback را نشان دهد.)
 */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
    // در بازهٔ ۱۰ ثانیه فقط یک رفرشِ خودکار مجاز است.
    if (Number.isFinite(last) && now - last < 10_000) {
      return false;
    }
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    window.location.reload();
    return true;
  } catch {
    // اگر sessionStorage در دسترس نبود، برای احتیاط رفرشِ خودکار نمی‌کنیم.
    return false;
  }
}

/** ثبتِ کاملِ خطا در Console (کامپوننت/پیام/Stack) — تنها نقطهٔ لاگ‌گیری. */
export function logClientError(error: unknown, context: ClientErrorContext): void {
  const e = (error ?? {}) as {
    name?: string;
    message?: string;
    stack?: string;
    digest?: string;
  };
  // eslint-disable-next-line no-console
  console.error(
    `[client-error] boundary=${context.boundary}` +
      (e.name ? ` name=${e.name}` : '') +
      (e.digest ? ` digest=${e.digest}` : '') +
      (isChunkLoadError(error) ? ' kind=chunk-load' : ''),
    {
      message: e.message,
      stack: e.stack,
      componentStack: context.componentStack ?? undefined,
    },
  );
}
