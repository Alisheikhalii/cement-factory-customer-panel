import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@cement/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Repository داشبورد مشتری (بخش ۹.۲ / ۱۱.۲) — فقط Aggregate/Read.
 * ⚠️ هر Query با customerId (از JWT) محدود می‌شود (Data Scoping بخش ۶.۲).
 */
@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  latestBalance(customerId: string): Promise<{ balance: Prisma.Decimal | null } | null> {
    return this.prisma.financialTransaction.findFirst({
      where: { customerId, balance: { not: null } },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });
  }

  activeOrderCount(customerId: string): Promise<number> {
    return this.prisma.order.count({
      where: { customerId, status: OrderStatus.IN_USE },
    });
  }

  async remainingQtyTotal(customerId: string): Promise<Prisma.Decimal | null> {
    const r = await this.prisma.order.aggregate({
      where: { customerId },
      _sum: { remainingQty: true },
    });
    return r._sum.remainingQty;
  }

  async deliveredSince(customerId: string, since: Date): Promise<Prisma.Decimal | null> {
    const r = await this.prisma.delivery.aggregate({
      where: { loadingRequest: { customerId }, deliveryDate: { gte: since } },
      _sum: { deliveredQty: true },
    });
    return r._sum.deliveredQty;
  }

  lastLoadingRequest(customerId: string): Promise<{
    requestNumber: string;
    status: string;
    submittedAt: Date;
  } | null> {
    return this.prisma.loadingRequest.findFirst({
      where: { customerId },
      orderBy: { submittedAt: 'desc' },
      select: { requestNumber: true, status: true, submittedAt: true },
    });
  }

  lastStatement(customerId: string): Promise<{
    docNumber: string;
    date: Date;
    amount: Prisma.Decimal;
  } | null> {
    return this.prisma.financialTransaction.findFirst({
      where: { customerId, source: 'STATEMENT' },
      orderBy: { date: 'desc' },
      select: { docNumber: true, date: true, amount: true },
    });
  }

  lastComplaint(customerId: string): Promise<{
    subject: string;
    status: string;
    submittedAt: Date;
  } | null> {
    return this.prisma.complaint.findFirst({
      where: { customerId },
      orderBy: { submittedAt: 'desc' },
      select: { subject: true, status: true, submittedAt: true },
    });
  }

  customerProfile(customerId: string): Promise<{
    name: string;
    customerCode: string;
    nationalId: string | null;
    economicCode: string | null;
    address: string | null;
    postalCode: string | null;
    mobile: string;
    creditLimit: Prisma.Decimal | null;
    creditBalance: Prisma.Decimal | null;
  } | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        name: true,
        customerCode: true,
        nationalId: true,
        economicCode: true,
        address: true,
        postalCode: true,
        mobile: true,
        creditLimit: true,
        creditBalance: true,
      },
    });
  }

  /** محصولاتی که مشتری روی آن‌ها سفارش دارد + مانده کل هر محصول. */
  async productRemaining(customerId: string): Promise<
    Array<{
      productId: string;
      erpCode: string;
      name: string;
      type: string;
      remaining: number;
    }>
  > {
    const grouped = await this.prisma.order.groupBy({
      by: ['productId'],
      where: { customerId },
      _sum: { remainingQty: true },
    });
    if (grouped.length === 0) {
      return [];
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, erpCode: true, name: true, type: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    return grouped.map((g) => {
      const p = productMap.get(g.productId);
      return {
        productId: g.productId,
        erpCode: p?.erpCode ?? '',
        name: p?.name ?? '',
        type: p?.type ?? 'BAGGED',
        remaining: g._sum.remainingQty ? g._sum.remainingQty.toNumber() : 0,
      };
    });
  }

  /** جمع اعلام‌بار امروز به تفکیک محصول (submittedAt >= startOfDay). */
  async todayLoadingByProduct(
    customerId: string,
    since: Date,
  ): Promise<Map<string, number>> {
    const grouped = await this.prisma.loadingRequest.groupBy({
      by: ['productId'],
      where: { customerId, submittedAt: { gte: since } },
      _sum: { requestedQty: true },
    });
    return new Map(
      grouped.map((g) => [g.productId, g._sum.requestedQty ? g._sum.requestedQty.toNumber() : 0]),
    );
  }

  /** جمع تحویل امروز به تفکیک محصول (deliveryDate >= startOfDay). */
  async todayDeliveryByProduct(
    customerId: string,
    since: Date,
  ): Promise<Map<string, number>> {
    const grouped = await this.prisma.delivery.groupBy({
      by: ['productId'],
      where: { loadingRequest: { customerId }, deliveryDate: { gte: since } },
      _sum: { deliveredQty: true },
    });
    return new Map(
      grouped.map((g) => [g.productId, g._sum.deliveredQty ? g._sum.deliveredQty.toNumber() : 0]),
    );
  }

  /** تحویل ماهانه در بازه [since, now] برای نمودار روند (گروه‌بندی در سرویس با جلالی). */
  deliveriesForTrend(
    customerId: string,
    since: Date,
  ): Promise<Array<{ deliveryDate: Date; deliveredQty: Prisma.Decimal }>> {
    return this.prisma.delivery.findMany({
      where: { loadingRequest: { customerId }, deliveryDate: { gte: since } },
      select: { deliveryDate: true, deliveredQty: true },
      orderBy: { deliveryDate: 'asc' },
    });
  }
}
