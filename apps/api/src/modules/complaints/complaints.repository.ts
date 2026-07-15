import { Injectable } from '@nestjs/common';
import { Prisma, ComplaintStatus as PrismaComplaintStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ComplaintWithCustomer = Prisma.ComplaintGetPayload<{
  include: { customer: { select: { name: true } } };
}>;

export interface AdminComplaintFilter {
  status?: string;
}

/**
 * Repository شکایات (بخش ۹.۸/۹.۹.۴).
 * ⚠️ همه Queryهای سمت مشتری با customerId از JWT محدود می‌شوند (بخش ۶.۲).
 */
@Injectable()
export class ComplaintRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** شکایات یک مشتری (نمای مشتری، بدون صفحه‌بندی — جدول ساده ۹.۸). */
  findForCustomer(customerId: string): Promise<
    Array<{
      id: string;
      subject: string;
      description: string;
      submittedAt: Date;
      status: string;
      reply: string | null;
      repliedAt: Date | null;
    }>
  > {
    return this.prisma.complaint.findMany({
      where: { customerId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        subject: true,
        description: true,
        submittedAt: true,
        status: true,
        reply: true,
        repliedAt: true,
      },
    });
  }

  create(data: {
    customerId: string;
    subject: string;
    description: string;
  }): Promise<{
    id: string;
    subject: string;
    description: string;
    submittedAt: Date;
    status: string;
    reply: string | null;
    repliedAt: Date | null;
  }> {
    return this.prisma.complaint.create({
      data,
      select: {
        id: true,
        subject: true,
        description: true,
        submittedAt: true,
        status: true,
        reply: true,
        repliedAt: true,
      },
    });
  }

  findCustomerName(customerId: string): Promise<{ name: string } | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });
  }

  // ==================== ادمین (بخش ۹.۹.۴) ====================

  private buildAdminWhere(filter: AdminComplaintFilter): Prisma.ComplaintWhereInput {
    const where: Prisma.ComplaintWhereInput = {};
    if (filter.status) {
      where.status = filter.status as Prisma.ComplaintWhereInput['status'];
    }
    return where;
  }

  async findPageForAdmin(
    filter: AdminComplaintFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: ComplaintWithCustomer[]; total: number }> {
    const where = this.buildAdminWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: { customer: { select: { name: true } } },
        orderBy: { submittedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return { rows, total };
  }

  findByIdWithCustomer(id: string): Promise<ComplaintWithCustomer | null> {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: { customer: { select: { name: true } } },
    });
  }

  /** ثبت پاسخ نهایی (PENDING → ANSWERED). */
  reply(id: string, reply: string, repliedAt: Date): Promise<ComplaintWithCustomer> {
    return this.prisma.complaint.update({
      where: { id },
      data: { reply, repliedAt, status: PrismaComplaintStatus.ANSWERED },
      include: { customer: { select: { name: true } } },
    });
  }

  countPending(): Promise<number> {
    return this.prisma.complaint.count({ where: { status: PrismaComplaintStatus.PENDING } });
  }
}
