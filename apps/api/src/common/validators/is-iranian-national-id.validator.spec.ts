import { isValidIranianNationalId } from '@cement/shared-types';

/**
 * تست الگوریتم Checksum کد ملی ایران (بخش ۶.۱ و ۹.۱ PRD).
 */
describe('isValidIranianNationalId', () => {
  it('کدهای ملی معتبر را می‌پذیرد', () => {
    expect(isValidIranianNationalId('0013542419')).toBe(true);
    expect(isValidIranianNationalId('0499370899')).toBe(true);
    expect(isValidIranianNationalId('0084575948')).toBe(true);
  });

  it('کد با رقم کنترل غلط را رد می‌کند', () => {
    expect(isValidIranianNationalId('0013542418')).toBe(false);
    expect(isValidIranianNationalId('1234567890')).toBe(false);
  });

  it('طول نادرست را رد می‌کند', () => {
    expect(isValidIranianNationalId('123')).toBe(false);
    expect(isValidIranianNationalId('00135424199')).toBe(false);
    expect(isValidIranianNationalId('')).toBe(false);
  });

  it('ارقام غیرعددی را رد می‌کند', () => {
    expect(isValidIranianNationalId('001354241a')).toBe(false);
  });

  it('ارقام کاملاً یکسان را رد می‌کند', () => {
    expect(isValidIranianNationalId('0000000000')).toBe(false);
    expect(isValidIranianNationalId('1111111111')).toBe(false);
  });
});
