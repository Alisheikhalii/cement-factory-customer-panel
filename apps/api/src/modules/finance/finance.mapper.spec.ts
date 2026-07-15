import { Prisma } from '@prisma/client';
import { ReceiptStatus } from '@cement/shared-types';
import {
  toReceiptDto,
  toStatementDto,
  toStatusStatementDto,
  toTransactionDto,
} from './finance.mapper';
import type { FinancialTransactionRow, PaymentReceiptRow } from './finance.repository';

/** تست نگاشت‌های مالی (فاز ۷e پوشش) — تبدیل Decimal/تاریخ و تمایز null از صفر. */
describe('finance.mapper', () => {
  const txRow = {
    id: 't1',
    date: new Date('2026-07-01T00:00:00Z'),
    docNumber: 'D-100',
    operationType: 'واریز',
    bankName: 'ملت',
    accountNumber: '123456',
    amount: new Prisma.Decimal(5_000_000),
    description: 'واریز نقدی',
    dueDate: null,
    debit: new Prisma.Decimal(0),
    credit: new Prisma.Decimal(5_000_000),
    balance: new Prisma.Decimal(-2_000_000),
    status: 'CONFIRMED',
  } as unknown as FinancialTransactionRow;

  it('toTransactionDto: dueDate null می‌ماند، مبلغ number می‌شود', () => {
    const dto = toTransactionDto(txRow);
    expect(dto.amount).toBe(5_000_000);
    expect(dto.dueDate).toBeNull();
    expect(dto.date).toBe('2026-07-01T00:00:00.000Z');
  });

  it('toStatusStatementDto: بدهکار/بستانکار/مانده (مانده منفی مجاز)', () => {
    const dto = toStatusStatementDto(txRow);
    expect(dto.debit).toBe(0);
    expect(dto.credit).toBe(5_000_000);
    expect(dto.balance).toBe(-2_000_000);
  });

  it('toStatementDto: فقط فیلدهای صورتحساب ساده', () => {
    const dto = toStatementDto(txRow);
    expect(dto).toEqual({
      id: 't1',
      docNumber: 'D-100',
      date: '2026-07-01T00:00:00.000Z',
      description: 'واریز نقدی',
      amount: 5_000_000,
    });
  });

  it('toReceiptDto: مبلغ اختیاری null (نه صفر) — تمایز «اعلام‌نشده» از «صفر»', () => {
    const dto = toReceiptDto({
      id: 'r1',
      amount: null,
      description: null,
      uploadedAt: new Date('2026-07-10T09:00:00Z'),
      status: 'PENDING',
      reviewNote: null,
    } as unknown as PaymentReceiptRow);
    expect(dto.amount).toBeNull();
    expect(dto.status).toBe(ReceiptStatus.PENDING);
    expect(dto.uploadedAt).toBe('2026-07-10T09:00:00.000Z');
  });
});
