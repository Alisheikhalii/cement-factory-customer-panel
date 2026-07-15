import type {
  FinanceStatementDto,
  FinanceStatusStatementDto,
  FinanceTransactionDto,
  PaymentReceiptDto,
} from '@cement/shared-types';
import { ReceiptStatus } from '@cement/shared-types';
import { toNum, toNumOrNull } from '../../common/utils/decimal.util';
import type {
  FinancialTransactionRow,
  PaymentReceiptRow,
} from './finance.repository';

export function toTransactionDto(row: FinancialTransactionRow): FinanceTransactionDto {
  return {
    id: row.id,
    date: row.date.toISOString(),
    docNumber: row.docNumber,
    operationType: row.operationType,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    amount: toNum(row.amount),
    description: row.description,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    status: row.status,
  };
}

export function toStatusStatementDto(
  row: FinancialTransactionRow,
): FinanceStatusStatementDto {
  return {
    id: row.id,
    docNumber: row.docNumber,
    date: row.date.toISOString(),
    description: row.description,
    debit: toNum(row.debit),
    credit: toNum(row.credit),
    balance: toNum(row.balance),
    status: row.status,
  };
}

export function toStatementDto(row: FinancialTransactionRow): FinanceStatementDto {
  return {
    id: row.id,
    docNumber: row.docNumber,
    date: row.date.toISOString(),
    description: row.description,
    amount: toNum(row.amount),
  };
}

export function toReceiptDto(row: PaymentReceiptRow): PaymentReceiptDto {
  return {
    id: row.id,
    amount: toNumOrNull(row.amount),
    description: row.description,
    uploadedAt: row.uploadedAt.toISOString(),
    status: ReceiptStatus[row.status as keyof typeof ReceiptStatus],
    reviewNote: row.reviewNote,
  };
}
