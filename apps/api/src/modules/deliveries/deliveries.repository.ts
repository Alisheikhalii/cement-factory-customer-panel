import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DeliveryFilter {
  customerId: string;
  from?: Date;
  to?: Date;
}

export type DeliveryWithRelations = Prisma.DeliveryGetPayload<{
  include: { product: true; carrier: true; loadingRequest: true };
}>;

/**
 * Repository تحویل (بخش ۹.۶ / ۱۱.۶).
 * ⚠️ مدل Delivery فیلد customerId مستقیم ندارد؛ Scope همیشه از رابطه
 * loadingRequest.customerId اعمال می‌شود (Data Scoping بخش ۶.۲).
 */
@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: DeliveryFilter): Prisma.DeliveryWhereInput {
    const where: Prisma.DeliveryWhereInput = {
      loadingRequest: { customerId: filter.customerId },
    };
    if (filter.from || filter.to) {
      where.deliveryDate = {};
      if (filter.from) {
        where.deliveryDate.gte = filter.from;
      }
      if (filter.to) {
        where.deliveryDate.lte = filter.to;
      }
    }
    return where;
  }

  async findPage(
    filter: DeliveryFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: DeliveryWithRelations[]; total: number }> {
    const where = this.buildWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: { product: true, carrier: true, loadingRequest: true },
        orderBy: { deliveryDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { rows, total };
  }

  findAll(filter: DeliveryFilter): Promise<DeliveryWithRelations[]> {
    return this.prisma.delivery.findMany({
      where: this.buildWhere(filter),
      include: { product: true, carrier: true, loadingRequest: true },
      orderBy: { deliveryDate: 'desc' },
    });
  }

  async aggregateSums(filter: DeliveryFilter): Promise<{
    deliveredQty: Prisma.Decimal | null;
    baseAmount: Prisma.Decimal | null;
    vatAmount: Prisma.Decimal | null;
    deductions: Prisma.Decimal | null;
    amountWithFactors: Prisma.Decimal | null;
  }> {
    const result = await this.prisma.delivery.aggregate({
      where: this.buildWhere(filter),
      _sum: {
        deliveredQty: true,
        baseAmount: true,
        vatAmount: true,
        deductions: true,
        amountWithFactors: true,
      },
    });
    return result._sum;
  }

  findById(customerId: string, id: string): Promise<DeliveryWithRelations | null> {
    return this.prisma.delivery.findFirst({
      where: { id, loadingRequest: { customerId } },
      include: { product: true, carrier: true, loadingRequest: true },
    });
  }
}
