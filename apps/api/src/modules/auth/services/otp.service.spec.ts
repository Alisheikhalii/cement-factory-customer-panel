import { OtpService } from './otp.service';

/**
 * تست سرویس OTP (بخش ۶.۱ — فاز ۷e پوشش). زمان تزریق می‌شود (بخش ۱۸).
 */
describe('OtpService', () => {
  const NOW = 1_752_000_000_000; // لحظهٔ ثابت تزریقی

  function make(): OtpService {
    return new OtpService();
  }

  it('کد صادرشده ۶ رقمی است و با همان کد verify می‌شود (و مصرف می‌گردد)', () => {
    const otp = make();
    const code = otp.issue('national-1', '09123334455', NOW);
    expect(code).toMatch(/^\d{6}$/);
    expect(otp.verify('national-1', code, NOW + 1000)).toBe(true);
    // مصرف‌شده — بار دوم نامعتبر است (جلوگیری از Replay).
    expect(otp.verify('national-1', code, NOW + 2000)).toBe(false);
  });

  it('کد اشتباه یا کلید دیگر → false', () => {
    const otp = make();
    const code = otp.issue('national-1', '0912', NOW);
    expect(otp.verify('national-1', '000000', NOW)).toBe(false);
    expect(otp.verify('national-2', code, NOW)).toBe(false);
  });

  it('پس از انقضا (۵ دقیقه) نامعتبر می‌شود', () => {
    const otp = make();
    const code = otp.issue('national-1', '0912', NOW);
    expect(otp.verify('national-1', code, NOW + 5 * 60 * 1000 + 1)).toBe(false);
  });

  it('maskMobile فقط ۴ رقم آخر را نشان می‌دهد', () => {
    expect(make().maskMobile('09123334455')).toBe('...4455');
  });

  it('pseudoMask هم‌فرمت maskMobile و برای یک کلید قطعی است (ضدشمارش)', () => {
    const otp = make();
    const a = otp.pseudoMask('national-x');
    expect(a).toMatch(/^\.\.\.\d{4}$/);
    expect(otp.pseudoMask('national-x')).toBe(a);
    // کلید متفاوت لزوماً mask متفاوت نمی‌دهد، اما فرمت باید یکسان بماند.
    expect(otp.pseudoMask('other')).toMatch(/^\.\.\.\d{4}$/);
  });
});
