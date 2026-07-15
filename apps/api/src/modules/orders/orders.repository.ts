import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** فیلترهای Query سفارش (customerId همیشه از JWT تزریق می‌شود، نه ورودی کاربر). */
export interface OrderFilter {
  customerId: string;
  status?: string;
  hasRemaining?: boolean;
}

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { product: true; _count: { select: { loadingRequests: true } } };
}>;

/**
 * Repository سفارشات — تنها نقطه دسترسی سرویس سفارش به دیتابیس.
 * سرویس‌ها هرگز PrismaClient مستقیم تزریق نمی‌کنند (instruction.md §2).
 * ⚠️ customerId در هر Query اجباری است تا Data Scoping بخش ۶.۲ نقض نشود.
 */
@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: OrderFilter): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = { customerId: filter.customerId };
    if (filter.status) {
      where.status = filter.status as Prisma.OrderWhereInput['status'];
    }
    if (filter.hasRemaining) {
      where.remainingQty = { gt: 0 };
    }
    return where;
  }

  async findPage(
    filter: OrderFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: OrderWithRelations[]; total: number }> {
    const where = this.buildWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { product: true, _count: { select: { loadingRequests: true } } },
        orderBy: { orderDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { rows, total };
  }

  /** همه ردیف‌های مطابق فیلتر (برای Export و محاسبه جمع کل روی کل نتیجه، نه فقط صفحه جاری). */
  findAll(filter: OrderFilter): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: this.buildWhere(filter),
      include: { product: true, _count: { select: { loadingRequests: true } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  /** جمع‌های ستون‌های عددی روی کل نتیجه فیلترشده (Footer، بخش ۹.۰). */
  async aggregateSums(filter: OrderFilter): Promise<{
    totalQty: Prisma.Decimal | null;
    deliveredQty: Prisma.Decimal | null;
    remainingQty: Prisma.Decimal | null;
    amountWithFactors: Prisma.Decimal | null;
    deliveredAmount: Prisma.Decimal | null;
    remainingAmount: Prisma.Decimal | null;
  }> {
    const result = await this.prisma.order.aggregate({
      where: this.buildWhere(filter),
      _sum: {
        totalQty: true,
        deliveredQty: true,
        remainingQty: true,
        amountWithFactors: true,
        deliveredAmount: true,
        remainingAmount: true,
      },
    });
    return result._sum;
  }

  findById(customerId: string, id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: { id, customerId },
      include: { product: true, _count: { select: { loadingRequests: true } } },
    });
  }
}
