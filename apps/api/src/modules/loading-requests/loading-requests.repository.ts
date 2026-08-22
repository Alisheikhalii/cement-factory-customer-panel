import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  Prisma,
  LoadingRequestStatus as PrismaLoadingRequestStatus,
  OrderStatus as PrismaOrderStatus,
} from '@prisma/client';
import { LoadingRequestStatus, OrderSource } from '@cement/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * کد ERP محصول(های) قابل انتخاب در حالت `FEATURE_PILOT_PRODUCT_SELECTION`.
 * پیش‌فرض = «سیمان پاکتی تیپ ۲-۴۲۵ داخلی» (محصول دورهٔ پایلوت). با متغیر محیطی
 * `PILOT_PRODUCT_ERP_CODES` (جدا‌شده با کاما) قابل تغییر است، بدون تغییر کد.
 */
const DEFAULT_PILOT_PRODUCT_ERP_CODES = '2001240002';

function pilotProductErpCodes(): string[] {
  return (process.env.PILOT_PRODUCT_ERP_CODES ?? DEFAULT_PILOT_PRODUCT_ERP_CODES)
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code !== '');
}

/** مهر `YYMMDD` شماره سفارش نگه‌دارندهٔ پایلوت (هم‌شکل با ثبت دستی ادمین). */
function pilotOrderStamp(): string {
  const now = new Date();
  return (
    String(now.getFullYear() % 100).padStart(2, '0') +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  );
}

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

/** باربری فعال برای فهرست انتخابیِ فرم ثبت دستی تحویل (Task 3 — پایلوت). */
export interface ActiveCarrierRow {
  id: string;
  name: string;
}

/** داده سفارش لازم برای اعتبارسنجی ثبت درخواست (BR-05/BR-06). */
export interface OrderForValidation {
  id: string;
  customerId: string;
  productId: string;
  totalQty: Prisma.Decimal;
  status: string;
}

/** پروجکشن مشترک `OrderForValidation` (هم مسیر عادی، هم سفارشِ مرجع پایلوت). */
const ORDER_FOR_VALIDATION_SELECT = {
  id: true,
  customerId: true,
  productId: true,
  totalQty: true,
  status: true,
} satisfies Prisma.OrderSelect;

/** محصول قابل انتخاب در فرم اعلام بار (حالت پایلوت) — بدون مانده و بدون مبلغ. */
export interface SelectableProductRow {
  id: string;
  name: string;
}

/**
 * حداقل ستون‌های لازم برای Dropdown سفارش در فرم اعلام بار.
 * ⚠️ هیچ ستون مالی‌ای انتخاب نمی‌شود تا خاموش بودن پرچم `ORDERS_ENABLED` دور زده نشود.
 */
const SELECTABLE_ORDER_SELECT = {
  id: true,
  orderNumber: true,
  productId: true,
  remainingQty: true,
  product: { select: { name: true } },
} satisfies Prisma.OrderSelect;

/** سفارش فعالِ قابل انتخاب در فرم اعلام بار (بدون هیچ ستون مالی — بخش ۹.۵). */
export type SelectableOrderRow = Prisma.OrderGetPayload<{
  select: typeof SELECTABLE_ORDER_SELECT;
}>;

/**
 * فیلتر کارتابل ادمین (بدون `customerId` — نقش ADMIN همه مشتریان را می‌بیند).
 * جدا از `LoadingRequestFilter` نگه داشته شد چون آن یکی `customerId` را الزامی
 * می‌کند و Scope مشتری نباید تصادفاً از مسیر ادمین حذف‌شدنی شود.
 */
export interface AdminCartableFilter {
  status?: string;
  from?: Date;
  to?: Date;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
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
  /** `where` کارتابل ادمین — بدون Scope مشتری (نقش ADMIN). */
  private buildAdminWhere(filter: AdminCartableFilter): Prisma.LoadingRequestWhereInput {
    const where: Prisma.LoadingRequestWhereInput = {};
    if (filter.status) {
      where.status = filter.status as Prisma.LoadingRequestWhereInput['status'];
    }
    // بازه روی «تاریخ ثبت» بسته می‌شود، هم‌معنی با فیلتر سمت مشتری (buildWhere).
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

  /**
   * `orderBy` کارتابل ادمین. پیش‌فرض `submittedAt: 'desc'` است، یعنی بدون پارامتر
   * مرتب‌سازی رفتار قبلی کارتابل مو‌به‌مو حفظ می‌شود.
   */
  private buildAdminOrderBy(
    filter: AdminCartableFilter,
  ): Prisma.LoadingRequestOrderByWithRelationInput {
    const dir = filter.sortDir ?? 'desc';
    switch (filter.sortBy) {
      case 'requestNumber':
        return { requestNumber: dir };
      // نام مشتری ستون همین جدول نیست؛ از رابطه مرتب می‌شود تا در DB انجام شود نه در حافظه.
      case 'customerName':
        return { customer: { name: dir } };
      case 'requestedQty':
        return { requestedQty: dir };
      case 'requestDate':
        return { requestDate: dir };
      case 'status':
        return { status: dir };
      default:
        return { submittedAt: dir };
    }
  }

  async findAdminPage(
    filter: AdminCartableFilter,
    skip: number,
    take: number,
  ): Promise<{ rows: AdminLoadingRequestWithContext[]; total: number }> {
    const where = this.buildAdminWhere(filter);
    const [rows, total] = await Promise.all([
      this.prisma.loadingRequest.findMany({
        where,
        include: ADMIN_CARTABLE_INCLUDE,
        orderBy: this.buildAdminOrderBy(filter),
        skip,
        take,
      }),
      this.prisma.loadingRequest.count({ where }),
    ]);
    return { rows, total };
  }

  /**
   * همان کارتابل، بدون صفحه‌بندی — برای خروجی Excel.
   * ⚠️ عمداً همان `where`/`orderBy` صفحه‌بندی‌شده را می‌سازد تا فایل خروجی دقیقاً
   * همان چیزی باشد که ادمین در جدول فیلتر و مرتب کرده (بخش ۹.۰).
   */
  findAdminAll(filter: AdminCartableFilter): Promise<AdminLoadingRequestWithContext[]> {
    return this.prisma.loadingRequest.findMany({
      where: this.buildAdminWhere(filter),
      include: ADMIN_CARTABLE_INCLUDE,
      orderBy: this.buildAdminOrderBy(filter),
    });
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
      select: ORDER_FOR_VALIDATION_SELECT,
    });
  }

  /**
   * سفارش‌های قابل انتخاب در فرم اعلام بار: فعال (`IN_USE`) و با مانده > 0 (بخش ۹.۵).
   * فیلتر عیناً همان چیزی است که Dropdown پیش‌تر از `GET /orders` می‌خواست
   * (`status=IN_USE&hasRemaining=true`)، تا رفتار انتخاب سفارش تغییر نکند.
   */
  findSelectableOrders(customerId: string): Promise<SelectableOrderRow[]> {
    return this.prisma.order.findMany({
      where: {
        customerId,
        status: PrismaOrderStatus.IN_USE,
        remainingQty: { gt: 0 },
      },
      select: SELECTABLE_ORDER_SELECT,
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * محصولات قابل انتخاب در فرم اعلام بار وقتی `FEATURE_PILOT_PRODUCT_SELECTION` روشن است.
   *
   * فهرست با `erpCode` محدود می‌شود (نه با نام): `erpCode` کلید یکتا و پایدار است،
   * در حالی که نام محصول بین ارقام فارسی/لاتین («۲-۴۲۵» و «2-425») تفاوت دارد و
   * تطبیق متنی شکننده می‌شود. کدها از `PILOT_PRODUCT_ERP_CODES` خوانده می‌شوند تا
   * انتخاب محصول پایلوت یک تنظیم باشد، نه مقدار ثابتِ درون کد Frontend.
   */
  findPilotSelectableProducts(): Promise<SelectableProductRow[]> {
    return this.prisma.product.findMany({
      where: {
        erpCode: { in: pilotProductErpCodes() },
        isActive: true,
        isDeleted: false,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * سفارشِ مرجع برای ثبت اعلام بار در حالت انتخاب محصول (پایلوت).
   *
   * `LoadingRequest.orderId` کلید خارجی و NOT NULL است، پس درخواست باید به یک سفارش
   * بچسبد. ترتیب: (۱) اگر مشتری سفارش فعالی روی همین محصول دارد همان استفاده می‌شود
   * تا سفارش دستیِ ادمین مرجع بماند و مانده‌اش درست کم شود؛ (۲) وگرنه یک سفارش
   * نگه‌دارندهٔ `MANUAL` با مقدار صفر ساخته می‌شود تا مشتریِ تازه‌تعریف‌شده بدون
   * موجودی هم بتواند ثبت کند. مبالغ صفر می‌مانند (ستون‌ها NOT NULL هستند و قیمت
   * فقط از ERP می‌آید — BR-18). پیشوند `MO-` آن را برای بایگانی پس از پایلوت
   * قابل‌تشخیص نگه می‌دارد (PILOT_MODE.md).
   *
   * ⚠️ دو ثبت هم‌زمانِ اولین درخواست ممکن است دو سفارش نگه‌دارنده بسازند؛ چون
   * `orderNumber` تصادفی است به قید یکتایی نمی‌خورد و فقط یک ردیف اضافه می‌ماند.
   */
  async findOrCreatePilotOrder(
    customerId: string,
    productId: string,
  ): Promise<OrderForValidation> {
    const existing = await this.prisma.order.findFirst({
      where: { customerId, productId, status: PrismaOrderStatus.IN_USE },
      select: ORDER_FOR_VALIDATION_SELECT,
      orderBy: { orderDate: 'desc' },
    });
    if (existing) {
      return existing;
    }

    const zero = new Prisma.Decimal(0);
    return this.prisma.order.create({
      data: {
        customerId,
        productId,
        orderNumber: `MO-${pilotOrderStamp()}-${randomBytes(3).toString('hex').toUpperCase()}`,
        orderDate: new Date(),
        totalQty: zero,
        deliveredQty: zero,
        remainingQty: zero,
        basePrice: zero,
        baseAmount: zero,
        deliveredAmount: zero,
        vatAmount: zero,
        priceWithFactors: zero,
        amountWithFactors: zero,
        remainingAmount: zero,
        status: PrismaOrderStatus.IN_USE,
        source: OrderSource.MANUAL,
      },
      select: ORDER_FOR_VALIDATION_SELECT,
    });
  }

  /**
   * مجموع مقدار درخواستی روی سفارش که سهم مانده را رزرو می‌کند (BR-05):
   * status IN [SUBMITTED, APPROVED, LOADED]. مبنای محاسبه موجودی در دسترس.
   *
   * @param excludeRequestId درخواستی که خودش در حال ویرایش است و نباید علیه خودش
   *   حساب شود. بدون این، ویرایش «۱۰۰ تن → ۱۰۰ تن» به BR-05 می‌خورد چون مقدار
   *   قبلیِ همان رکورد هم در رزرو شمرده می‌شد (دوباره‌شماری).
   */
  async sumActiveRequestedQty(
    orderId: string,
    excludeRequestId?: string,
  ): Promise<Prisma.Decimal> {
    const result = await this.prisma.loadingRequest.aggregate({
      where: {
        orderId,
        status: { in: ACTIVE_STATUSES },
        ...(excludeRequestId === undefined ? {} : { id: { not: excludeRequestId } }),
      },
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

  /**
   * باربری‌های فعال برای انتخاب در فرم ثبت دستی تحویل (Task 3 — پایلوت).
   * `Delivery.carrierId` کلید خارجی است، پس فرم باید از فهرست معتبر انتخاب کند
   * نه متن آزاد.
   */
  findActiveCarriers(): Promise<ActiveCarrierRow[]> {
    return this.prisma.carrier.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
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
   * ویرایش درخواست توسط مشتری — فقط اگر رکورد هنوز در همان وضعیتی باشد که سرویس
   * خوانده و اعتبارسنجی کرده است (`expectedStatus`).
   *
   * ⚠️ شرط وضعیت داخل خودِ `UPDATE` است، نه یک `SELECT` جداگانه: بین «خواندن» و
   * «نوشتن» ممکن است ادمین همان درخواست را تایید/رد کند. با `updateMany` شرط‌دار،
   * آن ویرایش با `count = 0` برمی‌گردد (نه اینکه بی‌صدا روی رکوردِ تاییدشده بنشیند)
   * و سرویس همان را به خطای تعارض وضعیت (LOAD_004) تبدیل می‌کند.
   *
   * Scope مشتری هم در همان شرط است تا هیچ مشتری‌ای نتواند درخواست دیگری را ویرایش
   * کند (بخش ۶.۲).
   *
   * @returns رکورد به‌روزشده، یا `null` اگر وضعیت/مالکیت در این فاصله تغییر کرده باشد.
   */
  async updateIfStatus(
    id: string,
    customerId: string,
    expectedStatus: LoadingRequestStatus,
    // ⚠️ نوعِ Unchecked/ManyMutation (اسکالر) چون نوشتن از راه `updateMany` است و آن
    // فقط ستون‌های اسکالر (شامل کلیدهای خارجیِ orderId/productId) را می‌پذیرد — نه
    // رابطهٔ `connect`. دادنِ ورودیِ رابطه‌ای اینجا خطای اعتبارسنجی Prisma (۵۰۰) می‌داد.
    data: Prisma.LoadingRequestUncheckedUpdateManyInput,
  ): Promise<LoadingRequestWithRelations | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.loadingRequest.updateMany({
        where: {
          id,
          customerId,
          status: expectedStatus as Prisma.LoadingRequestWhereInput['status'],
        },
        data,
      });
      if (count === 0) {
        return null;
      }
      return tx.loadingRequest.findUniqueOrThrow({
        where: { id },
        include: { product: true, carrier: true, delivery: true },
      });
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
