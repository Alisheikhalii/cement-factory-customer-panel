import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderSource } from '@cement/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/** ردیف بازگشتی سفارش دستی (پروجکشن مشترک بین متدهای این Repository). */
export interface ManualOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  totalQty: number;
  remainingQty: number;
  createdAt: string;
}

/** یک محصول فعال برای Dropdown فرم ثبت دستی. */
export interface ActiveProductRow {
  id: string;
  name: string;
}

/** ورودی‌های داخلی create (سرویس شماره سفارش را تولید می‌کند). */
export interface CreateManualOrderData {
  customerId: string;
  productId: string;
  orderNumber: string;
  totalQty: number;
}

type OrderWithNames = Prisma.OrderGetPayload<{
  include: { customer: { select: { name: true } }; product: { select: { name: true } } };
}>;

const WITH_NAMES = {
  customer: { select: { name: true } },
  product: { select: { name: true } },
} as const;

/**
 * Repository سفارشات دستی — تنها نقطه دسترسی سرویس ثبت دستی به دیتابیس (Task 2).
 * ⚠️ همه Queryها به `source: MANUAL` مقید هستند تا سفارشات ERP هرگز از این مسیر
 * تغییر نکنند؛ همین قید تضمین می‌کند بعد از پایان پایلوت این کد بی‌اثر باشد.
 */
@Injectable()
export class AdminManualOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toRow(order: OrderWithNames): ManualOrderRow {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      productName: order.product.name,
      totalQty: order.totalQty.toNumber(),
      remainingQty: order.remainingQty.toNumber(),
      createdAt: order.createdAt.toISOString(),
    };
  }

  /** محصولات فعال برای انتخاب در فرم ثبت دستی (Soft Delete رعایت می‌شود). */
  findActiveProducts(): Promise<ActiveProductRow[]> {
    return this.prisma.product.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * ثبت یک سفارش جدید با `source=MANUAL`.
   *
   * وضعیت اولیه IN_USE و `remainingQty = totalQty` (هنوز چیزی تحویل نشده).
   * فیلدهای مالی در فاز پایلوت صفر می‌مانند: مدل Order آن‌ها را NOT NULL تعریف
   * کرده و قیمت‌گذاری منحصراً از ERP می‌آید. (این با Task 4 تضاد ندارد — آنجا فقط
   * فیلدهای مالی «Delivery» است که باید `null` بماند، نه Order.)
   */
  async create(data: CreateManualOrderData): Promise<ManualOrderRow> {
    const zero = new Prisma.Decimal(0);
    const qty = new Prisma.Decimal(data.totalQty);

    const order = await this.prisma.order.create({
      data: {
        customerId: data.customerId,
        productId: data.productId,
        orderNumber: data.orderNumber,
        orderDate: new Date(),
        totalQty: qty,
        deliveredQty: zero,
        remainingQty: qty,
        basePrice: zero,
        baseAmount: zero,
        deliveredAmount: zero,
        vatAmount: zero,
        priceWithFactors: zero,
        amountWithFactors: zero,
        remainingAmount: zero,
        status: 'IN_USE',
        source: OrderSource.MANUAL,
      },
      include: WITH_NAMES,
    });

    return this.toRow(order);
  }

  /** لیست همه سفارشات ثبت‌دستی، تازه‌ترین ابتدا. */
  async findAllManual(): Promise<ManualOrderRow[]> {
    const orders = await this.prisma.order.findMany({
      where: { source: OrderSource.MANUAL },
      include: WITH_NAMES,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toRow(o));
  }

  /** سفارشات دستی یک مشتری مشخص (برای فهرست داخل مودال ردیف مشتری). */
  async findManualByCustomer(customerId: string): Promise<ManualOrderRow[]> {
    const orders = await this.prisma.order.findMany({
      where: { source: OrderSource.MANUAL, customerId },
      include: WITH_NAMES,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toRow(o));
  }

  /**
   * وضعیت فعلی یک سفارش دستی برای اعتبارسنجی ویرایش مقدار.
   * `deliveredQty` مستقیم خوانده می‌شود (نه totalQty - remainingQty) تا منبع حقیقت
   * همان مقداری باشد که State Machine تحویل به‌روز می‌کند.
   */
  async findManualById(id: string): Promise<{
    id: string;
    orderNumber: string;
    totalQty: number;
    deliveredQty: number;
  } | null> {
    const order = await this.prisma.order.findFirst({
      where: { id, source: OrderSource.MANUAL },
      select: { id: true, orderNumber: true, totalQty: true, deliveredQty: true },
    });
    if (!order) {
      return null;
    }
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalQty: order.totalQty.toNumber(),
      deliveredQty: order.deliveredQty.toNumber(),
    };
  }

  /**
   * ویرایش مقدار کل و مانده یک سفارش دستی.
   * ⚠️ `deliveredQty` دست‌نخورده می‌ماند — فقط State Machine تحویل آن را تغییر می‌دهد.
   * قید `source: MANUAL` در where تضمین می‌کند سفارش ERP از این مسیر تغییر نکند.
   */
  async updateQuantity(
    id: string,
    newTotalQty: number,
    newRemainingQty: number,
  ): Promise<ManualOrderRow> {
    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        // قید source اینجا هم تکرار می‌شود (نه فقط در findManualById سرویس): اگر بین
        // خواندن و نوشتن، سفارش به ERP_SYNC تبدیل شود، این Update باید شکست بخورد
        // نه اینکه یک سفارش ERP را بازنویسی کند. شکست‌خوردن ایمن‌تر از نوشتن است.
        where: { id, source: OrderSource.MANUAL },
        data: {
          totalQty: new Prisma.Decimal(newTotalQty),
          remainingQty: new Prisma.Decimal(newRemainingQty),
        },
        include: WITH_NAMES,
      }),
    ]);
    return this.toRow(updated);
  }
}
