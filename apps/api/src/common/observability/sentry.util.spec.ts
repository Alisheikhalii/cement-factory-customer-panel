import { captureException, initSentry, setSentryForTesting } from './sentry.util';

/**
 * تست اتصال اختیاری Sentry (فاز ۷). بدون DSN باید کاملاً no-op باشد و
 * captureException فقط وقتی نمونهٔ فعال هست صدا زده شود.
 */
describe('sentry.util', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    setSentryForTesting(null);
  });

  it('بدون SENTRY_DSN: init بی‌اثر و captureException بدون خطا no-op است', () => {
    delete process.env.SENTRY_DSN;
    expect(() => initSentry()).not.toThrow();
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('با نمونهٔ تزریق‌شده: captureException استثنا را پاس می‌دهد', () => {
    const captured: unknown[] = [];
    setSentryForTesting({
      init: (): void => undefined,
      captureException: (e): unknown => {
        captured.push(e);
        return undefined;
      },
    });
    const error = new Error('boom');
    captureException(error);
    expect(captured).toEqual([error]);
  });
});
