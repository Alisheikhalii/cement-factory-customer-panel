import { LoginThrottleService } from './login-throttle.service';

/**
 * تست محدودسازی تلاش ورود (بخش ۹.۱ — فاز ۷e پوشش).
 * ۵ تلاش ناموفق در ۱۵ دقیقه → قفل ۱۵ دقیقه‌ای. زمان تزریق می‌شود.
 */
describe('LoginThrottleService', () => {
  const NOW = 1_752_000_000_000;
  const MIN = 60 * 1000;

  it('کمتر از ۵ تلاش → قفل نمی‌شود', () => {
    const svc = new LoginThrottleService();
    for (let i = 0; i < 4; i += 1) {
      svc.registerFailure('user1', NOW + i * 1000);
    }
    expect(svc.isLocked('user1', NOW + 5000)).toBe(false);
  });

  it('۵ تلاش ناموفق در پنجره → قفل؛ پس از ۱۵ دقیقه باز می‌شود', () => {
    const svc = new LoginThrottleService();
    for (let i = 0; i < 5; i += 1) {
      svc.registerFailure('user1', NOW + i * 1000);
    }
    expect(svc.isLocked('user1', NOW + 6000)).toBe(true);
    // درست قبل از پایان قفل هنوز قفل است
    expect(svc.isLocked('user1', NOW + 4000 + 15 * MIN - 1)).toBe(true);
    // پس از پایان قفل آزاد می‌شود
    expect(svc.isLocked('user1', NOW + 4000 + 15 * MIN + 1)).toBe(false);
  });

  it('تلاش‌های خارج از پنجرهٔ ۱۵ دقیقه شمارش را از نو شروع می‌کنند', () => {
    const svc = new LoginThrottleService();
    for (let i = 0; i < 4; i += 1) {
      svc.registerFailure('user1', NOW + i * 1000);
    }
    // تلاش پنجم اما بعد از عبور پنجره → پنجرهٔ جدید، قفل نه
    svc.registerFailure('user1', NOW + 16 * MIN);
    expect(svc.isLocked('user1', NOW + 16 * MIN + 1000)).toBe(false);
  });

  it('ورود موفق شمارنده را پاک می‌کند', () => {
    const svc = new LoginThrottleService();
    for (let i = 0; i < 4; i += 1) {
      svc.registerFailure('user1', NOW + i * 1000);
    }
    svc.reset('user1');
    svc.registerFailure('user1', NOW + 5000);
    expect(svc.isLocked('user1', NOW + 6000)).toBe(false);
  });

  it('کلیدهای متفاوت مستقل‌اند', () => {
    const svc = new LoginThrottleService();
    for (let i = 0; i < 5; i += 1) {
      svc.registerFailure('user1', NOW + i * 1000);
    }
    expect(svc.isLocked('user1', NOW + 6000)).toBe(true);
    expect(svc.isLocked('user2', NOW + 6000)).toBe(false);
  });
});
