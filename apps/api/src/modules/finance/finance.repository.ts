import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FinanceFilter {
  customerId: string;
  source: string;
  from?: Date;
  to?: Date;
}

/**
 * Repository مالی (بخش ۹.۳ / ۱۱.۳).
 * ⚠️ همه Queryها با customerId از JWT محدود می‌شوند (Data Scoping بخش ۶.۲).
 */
@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: FinanceFilter): Prisma.FinancialTransactionWhereInput {
    const where: Prisma.FinancialTransactionWhereInput = {
      customerId: filter.customerId,
      source: filter.source as Prisma.FinancialTransactionWhereInput['source'],
    };
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) {
        where.date.gte = filter.from;
      }
      if (filter.to) {
        // کرانِ بالا انحصاری است (نیمه‌شب ایرانِ روزِ بعد)؛ کل روزِ پایان پوشش می‌یابد.
        where.date.lt = filter.to;
      }
    }
    return where;
  }

  async findPage(
    filter: FinanceFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: FinancialTransactionRow[]; total: number }> {
    const where = this.buildWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);
    return { rows, total };
  }

  findAll(filter: FinanceFilter): Promise<FinancialTransactionRow[]> {
    return this.prisma.financialTransaction.findMany({
      where: this.buildWhere(filter),
      orderBy: { date: 'desc' },
    });
  }

  async aggregateAmount(filter: FinanceFilter): Promise<{
    amount: Prisma.Decimal | null;
    debit: Prisma.Decimal | null;
    credit: Prisma.Decimal | null;
  }> {
    const result = await this.prisma.financialTransaction.aggregate({
      where: this.buildWhere(filter),
      _sum: { amount: true, debit: true, credit: true },
    });
    return result._sum;
  }

  findById(customerId: string, id: string): Promise<FinancialTransactionRow | null> {
    return this.prisma.financialTransaction.findFirst({
      where: { id, customerId },
    });
  }

  /** آخرین مانده حساب مشتری (KPI داشبورد + گزارش دارایی). */
  async latestBalance(customerId: string): Promise<Prisma.Decimal | null> {
    const row = await this.prisma.financialTransaction.findFirst({
      where: { customerId, balance: { not: null } },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });
    return row?.balance ?? null;
  }

  listReceipts(customerId: string): Promise<PaymentReceiptRow[]> {
    return this.prisma.paymentReceipt.findMany({
      where: { customerId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  createReceipt(input: {
    customerId: string;
    fileUrl: string;
    amount: string | null;
    description: string | null;
  }): Promise<PaymentReceiptRow> {
    return this.prisma.paymentReceipt.create({
      data: {
        customerId: input.customerId,
        fileUrl: input.fileUrl,
        amount: input.amount === null ? null : new Prisma.Decimal(input.amount),
        description: input.description,
      },
    });
  }

  getCustomerCredit(
    customerId: string,
  ): Promise<{ creditLimit: Prisma.Decimal | null; creditBalance: Prisma.Decimal | null } | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { creditLimit: true, creditBalance: true },
    });
  }

  /** نام مشتری برای متن اعلان فیش واریزی (بخش ۱۷). */
  async findCustomerName(customerId: string): Promise<string> {
    const row = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });
    return row?.name ?? '';
  }
}

export type FinancialTransactionRow = Prisma.FinancialTransactionGetPayload<object>;
export type PaymentReceiptRow = Prisma.PaymentReceiptGetPayload<object>;
