import { parseCsv, toCsv } from './csv.util';

/** تست CSV تبادل فایلی ERP (بخش ۱۲.۳ — file-based). */
describe('csv.util', () => {
  it('پارس سادهٔ سرآیند + ردیف‌ها', () => {
    const records = parseCsv('a,b,c\r\n1,2,3\r\n4,5,6\r\n');
    expect(records).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ]);
  });

  it('فیلد نقل‌قول‌دار با کاما/نقل‌قول/خط جدید', () => {
    const records = parseCsv('name,note\n"سیمان, تیپ ۲","گفت ""باشه""\nخط دوم"\n');
    expect(records).toEqual([{ name: 'سیمان, تیپ ۲', note: 'گفت "باشه"\nخط دوم' }]);
  });

  it('BOM ابتدای فایل (خروجی Excel) نادیده گرفته می‌شود', () => {
    const records = parseCsv('﻿a,b\n1,2\n');
    expect(records).toEqual([{ a: '1', b: '2' }]);
  });

  it('فایل خالی/فقط سرآیند → آرایه خالی', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('a,b\n')).toEqual([]);
  });

  it('رفت‌وبرگشت toCsv → parseCsv بدون اتلاف', () => {
    const records = [
      { requestNumber: 'LR-1', city: 'شیراز، صدرا', note: 'با "احتیاط"' },
      { requestNumber: 'LR-2', city: 'تهران', note: '' },
    ];
    const text = toCsv(['requestNumber', 'city', 'note'], records);
    expect(parseCsv(text)).toEqual(records);
  });

  it('مقدار null/undefined در سریال‌سازی → رشتهٔ خالی', () => {
    const text = toCsv(['a', 'b'], [{ a: null, b: undefined }]);
    expect(parseCsv(text)).toEqual([{ a: '', b: '' }]);
  });
});
