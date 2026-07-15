import { Injectable } from '@nestjs/common';
import { Prisma, LoadingRequestStatus as PrismaLoadingRequestStatus } from '@prisma/client';
import { LoadingRequestStatus } from '@cement/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoadingRequestFilter {
  customerId: string;
  status?: string;
  from?: Date;
  to?: Date;
  orderId?: string;
}

export type LoadingRequestWithRelations = Prisma.LoadingRequestGetPayload<{
  include: { product: true; carrier: true; delivery: true };
}>;

/** درخواست همراه با مشتری و سفارش — برای عملیات ادمین (تایید/رد/بارگیری). */
export type LoadingRequestWithContext = Prisma.LoadingRequestGetPayload<{
  include: {
    product: true;
    carrier: true;
    delivery: true;
    customer: { select: { id: true; name: true } };
    order: { select: { basePrice: true } };
  };
}>;

/** include مشترک ردیف‌های کارتابل ادمین (لیست بخش ۹.۹.۳). */
const ADMIN_CARTABLE_INCLUDE = {
  product: true,
  customer: { select: { name: true } },
  order: { select: { orderNumber: true } },
} satisfies Prisma.LoadingRequestInclude;

/** ردیف کارتابل ادمین (نام مشتری + شماره سفارش، بخش ۹.۹.۳). */
export type AdminLoadingRequestWithContext = Prisma.LoadingRequestGetPayload<{
  include: typeof ADMIN_CARTABLE_INCLUDE;
}>;

/** جزئیات کامل درخواست برای Drawer ادمین (شامل مانده سفارش، BR-25). */
export type AdminLoadingRequestDetailRow = Prisma.LoadingRequestGetPayload<{
  include: {
    product: true;
    carrier: true;
    delivery: true;
    customer: { select: { name: true; customerCode: true } };
    order: { select: { orderNumber: true; remainingQty: true } };
  };
}>;

/** حالت‌هایی که سهم مانده سفارش را «رزرو» می‌کنند (BR-05). */
const ACTIVE_STATUSES: PrismaLoadingRequestStatus[] = [
  PrismaLoadingRequestStatus.SUBMITTED,
  PrismaLoadingRequestStatus.APPROVED,
  PrismaLoadingRequestStatus.LOADED,
];

/** داده سفارش لازم برای اعتبارسنجی ثبت درخواست (BR-05/BR-06). */
export interface OrderForValidation {
  id: string;
  customerId: string;
  productId: string;
  totalQty: Prisma.Decimal;
  status: string;
}

/**
 * Repository اعلام بار (نمای Read فاز ۲).
 * ⚠️ همه Queryها با customeris از JWT محدود می‌شوند (Data Scoping بخش ۶.۲).
 * منطق نوشتن/State Machine در فاز ۳ اضافه می‌شود.
 */
@Injectable()
export class LoadingRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: LoadingRequestFilter): Prisma.LoadingRequestWhereInput {
    const where: Prisma.LoadingRequestWhereInput = { customerId: filter.customerId };
    if (filter.status) {
      where.status = filter.status as Prisma.LoadingRequestWhereInput['status'];
    }
    if (filter.orderId) {
      where.orderId = filter.orderId;
    }
    if (filter.from || filter.to) {
      where.submittedAt = {};
      if (filter.from) {
        where.submittedAt.gte = filter.from;
      }
      if (filter.to) {
        where.submittedAt.lte = filter.to;
      }
    }
    return where;
  }

  async findPage(
    filter: LoadingRequestFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: LoadingRequestWithRelations[]; total: number }> {
    const where = this.buildWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.loadingRequest.findMany({
        where,
        include: { product: true, carrier: true, delivery: true },
        orderBy: { submittedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.loadingRequest.count({ where }),
    ]);
    return { rows, total };
  }

  findAll(filter: LoadingRequestFilter): Promise<LoadingRequestWithRelations[]> {
    return this.prisma.loadingRequest.findMany({
      where: this.buildWhere(filter),
      include: { product: true, carrier: true, delivery: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async aggregateSums(filter: LoadingRequestFilter): Promise<{
    requestedQty: Prisma.Decimal | null;
  }> {
    const result = await this.prisma.loadingRequest.aggregate({
      where: this.buildWhere(filter),
      _sum: { requestedQty: true },
    });
    return result._sum;
  }

  /** جمع تحویل‌شده روی کل نتیجه فیلترشده (deliveredQty روی رابطه Delivery است). */
  async aggregateDeliveredSum(filter: LoadingRequestFilter): Promise<number> {
    const result = await this.prisma.delivery.aggregate({
      where: { loadingRequest: this.buildWhere(filter) },
      _sum: { deliveredQty: true },
    });
    const sum = result._sum.deliveredQty;
    return sum ? sum.toNumber() : 0;
  }

  findById(customerId: string, id: string): Promise<LoadingRequestWithRelations | null> {
    return this.prisma.loadingRequest.findFirst({
      where: { id, customerId },
      include: { product: true, carrier: true, delivery: true },
    });
  }

  // ==================== نوشتن (فاز ۳) ====================

  /**
   * درخواست را با مشتری و سفارش می‌خواند — بدون Scope مشتری، مخصوص ادمین
   * (کارتابل تایید/رد/بارگیری). مشتری برای متن اعلان و سفارش برای فی لازم است.
   */
  findByIdWithContext(id: string): Promise<LoadingRequestWithContext | null> {
    return this.prisma.loadingRequest.findUnique({
      where: { id },
      include: {
        product: true,
        carrier: true,
        delivery: true,
        customer: { select: { id: true, name: true } },
        order: { select: { basePrice: true } },
      },
    });
  }

  // ==================== کارتابل ادمین (فاز ۴.۵، بدون Scope مشتری) ====================

  /**
   * کارتابل ادمین (بخش ۹.۹.۳): همه درخواست‌های همه مشتریان، فیلتر اختیاری وضعیت.
   * بدون Scope مشتری چون ادمین کل سیستم را می‌بیند. شامل نام مشتری و شماره سفارش.
   */
  async findAdminPage(
    status: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ rows: AdminLoadingRequestWithContext[]; total: number }> {
    const where: Prisma.LoadingRequestWhereInput = {};
    if (status) {
      where.status = status as Prisma.LoadingRequestWhereInput['status'];
    }
    const [rows, total] = await Promise.all([
      this.prisma.loadingRequest.findMany({
        where,
        include: ADMIN_CARTABLE_INCLUDE,
        orderBy: { submittedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.loadingRequest.count({ where }),
    ]);
    return { rows, total };
  }

  /**
   * جزئیات کامل درخواست برای Drawer ادمین (بخش ۹.۹.۳ + BR-25).
   * شامل سفارش (برای مانده موجودی) و مشتری (نام/کد تفصیل).
   */
  findAdminDetail(id: string): Promise<AdminLoadingRequestDetailRow | null> {
    return this.prisma.loadingRequest.findUnique({
      where: { id },
      include: {
        product: true,
        carrier: true,
        delivery: true,
        customer: { select: { name: true, customerCode: true } },
        order: { select: { orderNumber: true, remainingQty: true } },
      },
    });
  }

  /** سفارش را برای اعتبارسنجی ثبت درخواست می‌خواند (با Scope مشتری، BR-06). */
  findOrderForValidation(
    customerId: string,
    orderId: string,
  ): Promise<OrderForValidation | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: { id: true, customerId: true, productId: true, totalQty: true, status: true },
    });
  }

  /**
   * مجموع مقدار درخواستی روی سفارش که سهم مانده را رزرو می‌کند (BR-05):
   * status IN [SUBMITTED, APPROVED, LOADED]. مبنای محاسبه موجودی در دسترس.
   */
  async sumActiveRequestedQty(orderId: string): Promise<Prisma.Decimal> {
    const result = await this.prisma.loadingRequest.aggregate({
      where: { orderId, status: { in: ACTIVE_STATUSES } },
      _sum: { requestedQty: true },
    });
    return result._sum.requestedQty ?? new Prisma.Decimal(0);
  }

  /**
   * شماره اعلام بار بعدی به‌صورت متوالی (`LR-000001`)، هم‌راستا با Seed.
   * از بیشترین شماره موجود +۱ محاسبه می‌شود.
   */
  async nextRequestNumber(): Promise<string> {
    const last = await this.prisma.loadingRequest.findFirst({
      orderBy: { requestNumber: 'desc' },
      select: { requestNumber: true },
    });
    const lastNum = last ? Number(last.requestNumber.replace(/\D/g, '')) : 0;
    return `LR-${String(lastNum + 1).padStart(6, '0')}`;
  }

  /** شماره توزین بعدی برای Delivery ساخته‌شده هنگام LOADED (`W-000001`). */
  async nextWeighingNumber(): Promise<string> {
    const last = await this.prisma.delivery.findFirst({
      orderBy: { weighingNumber: 'desc' },
      select: { weighingNumber: true },
    });
    const lastNum = last ? Number(last.weighingNumber.replace(/\D/g, '')) : 0;
    return `W-${String(lastNum + 1).padStart(6, '0')}`;
  }

  /** نام مشتری برای متن اعلان (بخش ۱۷). */
  findCustomerName(customerId: string): Promise<{ name: string } | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });
  }

  /**
   * ثبت درخواست با شماره متوالیِ تولیدشده، مقاوم در برابر رقابت هم‌زمانی (Race).
   * چون `nextRequestNumber` اتمیک نیست، دو ثبت هم‌زمان ممکن است یک شماره بگیرند و
   * دومی به قید @unique بخورد (P2002). این‌جا تا چند بار شماره تازه گرفته و دوباره
   * تلاش می‌کنیم تا به‌جای خطای ۵۰۰، ثبت موفق شود. (شماره‌گذاری قطعیِ سطح‌دیتابیس
   * با Sequence در فاز ۶/۷ جایگزین می‌شود.)
   */
  async createWithSequentialNumber(
    data: Omit<Prisma.LoadingRequestUncheckedCreateInput, 'requestNumber'>,
  ): Promise<LoadingRequestWithRelations> {
    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; ; attempt += 1) {
      const requestNumber = await this.nextRequestNumber();
      try {
        return await this.prisma.loadingRequest.create({
          data: { ...data, requestNumber },
          include: { product: true, carrier: true, delivery: true },
        });
      } catch (err) {
        if (
          attempt < MAX_ATTEMPTS &&
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
  }

  /** به‌روزرسانی وضعیت + فیلدهای وابسته (تایید/رد/لغو). فقط از سرویس State Machine. */
  update(
    id: string,
    data: Prisma.LoadingRequestUpdateInput,
  ): Promise<LoadingRequestWithRelations> {
    return this.prisma.loadingRequest.update({
      where: { id },
      data,
      include: { product: true, carrier: true, delivery: true },
    });
  }

  /**
   * انتقال APPROVED → LOADED به‌صورت اتمیک: هم‌زمان (۱) وضعیت درخواست را LOADED،
   * (۲) رکورد Delivery متناظر را می‌سازد (BR-12)، و (۳) مقادیر تجمعی سفارش والد را
   * هماهنگ می‌کند (deliveredQty↑، remainingQty↓، deliveredAmount↑) تا KPIها/فیلتر
   * «دارای مانده» و مانده نمایش‌داده‌شده به ادمین (BR-25) با تحویل‌ها همسو بماند.
   * تا فاز ۶ (Sync از ERP) این هماهنگی محلی مرجع است. همه در یک Transaction.
   */
  async markLoadedWithDelivery(
    id: string,
    loadedAt: Date,
    delivery: Prisma.DeliveryUncheckedCreateInput,
    orderReconcile: {
      orderId: string;
      deliveredQty: Prisma.Decimal;
      deliveredAmount: Prisma.Decimal;
    },
  ): Promise<LoadingRequestWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.delivery.create({ data: delivery });
      await tx.order.update({
        where: { id: orderReconcile.orderId },
        data: {
          deliveredQty: { increment: orderReconcile.deliveredQty },
          remainingQty: { decrement: orderReconcile.deliveredQty },
          deliveredAmount: { increment: orderReconcile.deliveredAmount },
        },
      });
      return tx.loadingRequest.update({
        where: { id },
        data: {
          status: LoadingRequestStatus.LOADED as Prisma.LoadingRequestUpdateInput['status'],
          loadedAt,
        },
        include: { product: true, carrier: true, delivery: true },
      });
    });
  }
}
