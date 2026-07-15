import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CustomerListFilter {
  search?: string;
}

/**
 * Repository مدیریت مشتریان توسط ادمین (بخش ۹.۹.۲).
 * ⚠️ ایجاد مشتری + User در یک Transaction (BR-26) تا حساب نیمه‌ساخته نماند.
 */
@Injectable()
export class AdminCustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: CustomerListFilter): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = { isDeleted: false };
    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { customerCode: { contains: q, mode: 'insensitive' } },
        { nationalId: { contains: q } },
        { mobile: { contains: q } },
      ];
    }
    return where;
  }

  async findPage(
    filter: CustomerListFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: CustomerRow[]; total: number }> {
    const where = this.buildWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: CUSTOMER_SELECT,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<CustomerRow | null> {
    return this.prisma.customer.findFirst({
      where: { id, isDeleted: false },
      select: CUSTOMER_SELECT,
    });
  }

  /** بررسی تکراری بودن کد ملی (BR-26/BR-28 → ADMIN_001). */
  async nationalIdExists(nationalId: string): Promise<boolean> {
    const [customer, user] = await Promise.all([
      this.prisma.customer.findFirst({
        where: { nationalId, isDeleted: false },
        select: { id: true },
      }),
      this.prisma.user.findFirst({ where: { username: nationalId }, select: { id: true } }),
    ]);
    return customer !== null || user !== null;
  }

  async customerCodeExists(customerCode: string): Promise<boolean> {
    const existing = await this.prisma.customer.findFirst({
      where: { customerCode },
      select: { id: true },
    });
    return existing !== null;
  }

  async mobileExists(mobile: string): Promise<boolean> {
    const existing = await this.prisma.customer.findFirst({
      where: { mobile },
      select: { id: true },
    });
    return existing !== null;
  }

  /**
   * ایجاد مشتری + User(role=CUSTOMER) اتمیک (BR-26). username = کد ملی (BR-28).
   * رمز از قبل هش‌شده پاس داده می‌شود.
   */
  async createWithUser(
    data: {
      customerCode: string;
      name: string;
      nationalId: string;
      economicCode: string | null;
      mobile: string;
      address: string | null;
      postalCode: string | null;
      creditLimit: Prisma.Decimal | null;
    },
    passwordHash: string,
  ): Promise<CustomerRow> {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          customerCode: data.customerCode,
          name: data.name,
          nationalId: data.nationalId,
          economicCode: data.economicCode,
          mobile: data.mobile,
          address: data.address,
          postalCode: data.postalCode,
          creditLimit: data.creditLimit,
        },
      });
      await tx.user.create({
        data: {
          customerId: customer.id,
          username: data.nationalId,
          fullName: data.name,
          passwordHash,
          role: 'CUSTOMER',
          mustResetPassword: true,
        },
      });
      const created = await tx.customer.findUnique({
        where: { id: customer.id },
        select: CUSTOMER_SELECT,
      });
      return created as CustomerRow;
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      economicCode?: string | null;
      mobile?: string;
      address?: string | null;
      postalCode?: string | null;
      creditLimit?: Prisma.Decimal | null;
    },
  ): Promise<CustomerRow> {
    return this.prisma.customer.update({
      where: { id },
      data,
      select: CUSTOMER_SELECT,
    });
  }

  toggleActive(id: string, isActive: boolean): Promise<CustomerRow> {
    return this.prisma.customer.update({
      where: { id },
      data: { isActive },
      select: CUSTOMER_SELECT,
    });
  }

  /** بازنشانی رمز مشتری: رمز هش‌شده جدید روی User متصل. */
  async resetPassword(customerId: string, passwordHash: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { customerId, isDeleted: false },
      data: { passwordHash, mustResetPassword: true },
    });
    return result.count > 0;
  }
}

const CUSTOMER_SELECT = {
  id: true,
  customerCode: true,
  name: true,
  nationalId: true,
  economicCode: true,
  mobile: true,
  address: true,
  postalCode: true,
  creditLimit: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

export type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_SELECT }>;
