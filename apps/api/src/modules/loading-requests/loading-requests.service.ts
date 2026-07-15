import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  LoadingRequestStatus,
  OrderStatus,
} from '@cement/shared-types';
import type {
  AdminLoadingRequestDetail,
  AdminLoadingRequestRow,
  CreateLoadingRequestInput,
  LoadingRequestDto,
  LoadingRequestListData,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination, type PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { ExcelService } from '../../common/services/excel.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationEvent } from '../notifications/notification-events';
import type { LoadingRequestQueryDto } from './dto/loading-request-query.dto';
import {
  LoadingRequestFilter,
  LoadingRequestRepository,
} from './loading-requests.repository';
import {
  buildLoadingRequestSumRow,
  toAdminLoadingRequestDetail,
  toAdminLoadingRequestRow,
  toLoadingRequestDto,
} from './loading-requests.mapper';
import { LoadingRequestStateMachine } from './loading-request.state-machine';
import {
  computeRequestDate,
  isWithinRequestWindow,
} from './loading-request-deadline.util';

/**
 * نرخ ارزش‌افزوده مورد استفاده در فاز فعلی (بدون ERP) برای ساخت رکورد Delivery.
 * ⚠️ BR-18: پورتال قیمت را محاسبه/Override نمی‌کند؛ این یک مقدار موقتِ فاز Mock است
 * و در فاز ۶ (Sync از ERP) مبالغ نهایی Delivery مستقیماً از حسابداری کارخانه می‌آید،
 * نه از این محاسبه. طبق instruction.md §5/§7 عددِ جادویی به ثابتِ نام‌دار منتقل شد.
 */
const MOCK_VAT_RATE = '0.09';

/**
 * سرویس اعلام بار.
 * فاز ۲: نمای Read (بخش ۹.۵ / ۱۱.۵).
 * فاز ۳: ثبت/لغو/تایید/رد/بارگیری با State Machine (بخش ۸.۱) و BR-04..BR-11 و BR-24.
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲)؛ تغییر Status فقط از طریق StateMachine.
 */
@Injectable()
export class LoadingRequestService {
  constructor(
    private readonly repo: LoadingRequestRepository,
    private readonly excel: ExcelService,
    private readonly stateMachine: LoadingRequestStateMachine,
    private readonly notifications: NotificationService,
  ) {}

  private buildFilter(
    customerId: string,
    query: Partial<LoadingRequestQueryDto>,
  ): LoadingRequestFilter {
    return {
      customerId,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }

  async list(
    customerId: string,
    query: LoadingRequestQueryDto,
  ): Promise<ResponseWithMeta<LoadingRequestListData>> {
    const filter = this.buildFilter(customerId, query);
    const { page, pageSize, skip, take } = resolvePagination(query);

    const [{ rows, total }, sums, deliveredTotal] = await Promise.all([
      this.repo.findPage(filter, skip, take),
      this.repo.aggregateSums(filter),
      this.repo.aggregateDeliveredSum(filter),
    ]);

    const data: LoadingRequestListData = {
      rows: rows.map(toLoadingRequestDto),
      sumRow: buildLoadingRequestSumRow(sums, deliveredTotal),
    };
    return new ResponseWithMeta(data, buildMeta(page, pageSize, total));
  }

  /** لیست کامل اعلام‌بارهای یک سفارش (بدون صفحه‌بندی، برای Drawer بخش ۹.۴). */
  async listByOrder(customerId: string, orderId: string): Promise<LoadingRequestListData> {
    const filter: LoadingRequestFilter = { customerId, orderId };
    const [rows, sums, deliveredTotal] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateSums(filter),
      this.repo.aggregateDeliveredSum(filter),
    ]);
    return {
      rows: rows.map(toLoadingRequestDto),
      sumRow: buildLoadingRequestSumRow(sums, deliveredTotal),
    };
  }

  async detail(customerId: string, id: string): Promise<LoadingRequestDto> {
    const row = await this.repo.findById(customerId, id);
    if (!row) {
      throw new AppException('ORDER_001', 'اعلام بار مورد نظر یافت نشد');
    }
    return toLoadingRequestDto(row);
  }

  // ==================== کارتابل ادمین (فاز ۴.۵، بخش ۹.۹.۳) ====================

  /**
   * کارتابل ادمین: همه درخواست‌های همه مشتریان با فیلتر اختیاری وضعیت
   * (پیش‌فرض Frontend روی SUBMITTED). بدون Scope مشتری (نقش ADMIN).
   */
  async adminList(
    status: string | undefined,
    query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminLoadingRequestRow[]>> {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const { rows, total } = await this.repo.findAdminPage(status, skip, take);
    return new ResponseWithMeta(rows.map(toAdminLoadingRequestRow), buildMeta(page, pageSize, total));
  }

  /** جزئیات کامل درخواست برای Drawer ادمین + مانده موجودی سفارش (BR-25). */
  async adminDetail(id: string): Promise<AdminLoadingRequestDetail> {
    const row = await this.repo.findAdminDetail(id);
    if (!row) {
      throw new AppException('ORDER_001', 'اعلام بار مورد نظر یافت نشد');
    }
    return toAdminLoadingRequestDetail(row);
  }

  // ==================== نوشتن (فاز ۳) ====================

  /**
   * ثبت درخواست اعلام بار جدید توسط مشتری (بخش ۹.۵).
   * ترتیب اعتبارسنجی‌ها: BR-24 (موبایل) → BR-04 (مهلت ۱۵:۰۰) → BR-06/سفارش معتبر
   * → BR-05 (موجودی کافی). سپس ثبت با وضعیت SUBMITTED و اعلان به ادمین (بخش ۱۷).
   *
   * @param now لحظه مرجع؛ در تست تزریق می‌شود تا BR-04 بدون ساعت واقعی آزموده شود.
   */
  async create(
    customerId: string,
    input: CreateLoadingRequestInput,
    now: Date = new Date(),
  ): Promise<LoadingRequestDto> {
    // BR-24: موبایل تحویل‌گیرنده نباید خالی باشد.
    if (!input.recipientMobile || input.recipientMobile.trim() === '') {
      throw new AppException('LOAD_006');
    }

    // BR-04: فقط تا ساعت ۱۵:۰۰ امروز، و تاریخ درخواستی = فردا.
    if (!isWithinRequestWindow(now)) {
      throw new AppException('LOAD_002');
    }
    const requestDate = computeRequestDate(now);

    // BR-06: سفارش باید متعلق به همین مشتری و شامل همین محصول باشد.
    const order = await this.repo.findOrderForValidation(customerId, input.orderId);
    if (!order) {
      throw new AppException('ORDER_001');
    }
    if (order.productId !== input.productId) {
      throw new AppException('ORDER_001', 'محصول انتخابی با سفارش هم‌خوان نیست');
    }
    if (order.status !== OrderStatus.IN_USE) {
      throw new AppException('LOAD_005', 'این سفارش دیگر فعال نیست');
    }

    // BR-05: requestedQty <= totalQty − Σ(active requested).
    const reserved = await this.repo.sumActiveRequestedQty(order.id);
    const requested = new Prisma.Decimal(input.requestedQty);
    const available = order.totalQty.minus(reserved);
    if (available.lessThanOrEqualTo(0)) {
      throw new AppException('LOAD_005');
    }
    if (requested.greaterThan(available)) {
      throw new AppException('LOAD_001');
    }

    // شماره متوالی به‌صورت مقاوم به رقابت هم‌زمانی تولید و ثبت می‌شود (رفع Race).
    // Enumهای shared-types و Prisma هم‌مقدارند ولی از نظر Type نامساوی؛ طبق الگوی
    // Repository (buildWhere) به Type فیلد Prisma کست می‌شوند.
    const created = await this.repo.createWithSequentialNumber({
      orderId: order.id,
      customerId,
      productId: input.productId,
      requestedQty: requested,
      vehicleType: input.vehicleType as Prisma.LoadingRequestUncheckedCreateInput['vehicleType'],
      loadType: input.loadType as Prisma.LoadingRequestUncheckedCreateInput['loadType'],
      requestDate,
      destinationCity: input.destinationCity,
      additionalAddress: input.additionalAddress ?? null,
      destinationPostalCode: input.destinationPostalCode ?? null,
      recipientMobile: input.recipientMobile.trim(),
      carrierId: input.carrierId ?? null,
      carrierSetBy: input.carrierId ? 'CUSTOMER' : null,
      status: LoadingRequestStatus.SUBMITTED as Prisma.LoadingRequestUncheckedCreateInput['status'],
    });

    await this.notifications.emitLoadingRequest(
      NotificationEvent.LOADING_REQUEST_SUBMITTED,
      {
        customerId,
        customerName: await this.customerName(customerId),
        requestNumber: created.requestNumber,
      },
    );

    return toLoadingRequestDto(created);
  }

  /**
   * لغو درخواست توسط مشتری (BR-10). فقط از SUBMITTED یا APPROVED مجاز است؛
   * تلاش برای لغو LOADED → LOAD_004 (توسط StateMachine).
   */
  async cancel(customerId: string, id: string): Promise<LoadingRequestDto> {
    const row = await this.repo.findById(customerId, id);
    if (!row) {
      throw new AppException('ORDER_001', 'اعلام بار مورد نظر یافت نشد');
    }
    const current = row.status as LoadingRequestStatus;
    this.stateMachine.assertTransition(current, LoadingRequestStatus.CANCELED);

    const updated = await this.repo.update(id, {
      status: LoadingRequestStatus.CANCELED as Prisma.LoadingRequestUpdateInput['status'],
      canceledAt: new Date(),
    });

    await this.notifications.emitLoadingRequest(
      NotificationEvent.LOADING_REQUEST_CANCELED,
      {
        customerId,
        customerName: await this.customerName(customerId),
        requestNumber: row.requestNumber,
      },
    );

    return toLoadingRequestDto(updated);
  }

  /** تایید درخواست توسط ادمین (SUBMITTED → APPROVED، بخش ۹.۹.۲). */
  async approve(id: string, adminUserId: string): Promise<LoadingRequestDto> {
    const row = await this.requireContext(id);
    this.stateMachine.assertTransition(
      row.status as LoadingRequestStatus,
      LoadingRequestStatus.APPROVED,
    );
    const updated = await this.repo.update(id, {
      status: LoadingRequestStatus.APPROVED as Prisma.LoadingRequestUpdateInput['status'],
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
    });
    await this.notifications.emitLoadingRequest(
      NotificationEvent.LOADING_REQUEST_APPROVED,
      {
        customerId: row.customer.id,
        customerName: row.customer.name,
        requestNumber: row.requestNumber,
      },
    );
    return toLoadingRequestDto(updated);
  }

  /**
   * رد درخواست توسط ادمین (SUBMITTED → REJECTED، BR-11).
   * دلیل اجباری است؛ خالی → ADMIN_002.
   */
  async reject(
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<LoadingRequestDto> {
    if (!reason || reason.trim() === '') {
      throw new AppException('ADMIN_002');
    }
    const row = await this.requireContext(id);
    this.stateMachine.assertTransition(
      row.status as LoadingRequestStatus,
      LoadingRequestStatus.REJECTED,
    );
    const updated = await this.repo.update(id, {
      status: LoadingRequestStatus.REJECTED as Prisma.LoadingRequestUpdateInput['status'],
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      reviewedByNote: reason.trim(),
    });
    await this.notifications.emitLoadingRequest(
      NotificationEvent.LOADING_REQUEST_REJECTED,
      {
        customerId: row.customer.id,
        customerName: row.customer.name,
        requestNumber: row.requestNumber,
        reason: reason.trim(),
      },
    );
    return toLoadingRequestDto(updated);
  }

  /**
   * تکمیل بارگیری (APPROVED → LOADED). در فاز ۶ از ERP/Sync می‌آید؛ در فاز فعلی
   * توسط ادمین ثبت می‌شود (جدول ۸.۱). رکورد Delivery متناظر اتمیک ساخته می‌شود (BR-12).
   */
  async markLoaded(id: string): Promise<LoadingRequestDto> {
    const row = await this.requireContext(id);
    this.stateMachine.assertTransition(
      row.status as LoadingRequestStatus,
      LoadingRequestStatus.LOADED,
    );

    const now = new Date();
    const qty = row.requestedQty;
    const basePrice = row.order.basePrice;
    const baseAmount = qty.times(basePrice);
    const vatAmount = baseAmount.times(new Prisma.Decimal(MOCK_VAT_RATE));
    const amountWithFactors = baseAmount.plus(vatAmount);
    const weighingNumber = await this.repo.nextWeighingNumber();

    const updated = await this.repo.markLoadedWithDelivery(
      id,
      now,
      {
        weighingNumber,
        loadingRequestId: id,
        deliveryDate: now,
        carrierId: row.carrierId,
        productId: row.productId,
        deliveredQty: qty,
        basePrice,
        baseAmount,
        vatAmount,
        amountWithFactors,
      },
      {
        orderId: row.orderId,
        deliveredQty: qty,
        deliveredAmount: amountWithFactors,
      },
    );

    await this.notifications.emitLoadingRequest(
      NotificationEvent.LOADING_REQUEST_LOADED,
      {
        customerId: row.customer.id,
        customerName: row.customer.name,
        requestNumber: row.requestNumber,
      },
    );

    return toLoadingRequestDto(updated);
  }

  /** بارگذاری درخواست با مشتری/سفارش برای عملیات ادمین یا خطای «یافت نشد». */
  private async requireContext(id: string) {
    const row = await this.repo.findByIdWithContext(id);
    if (!row) {
      throw new AppException('ORDER_001', 'اعلام بار مورد نظر یافت نشد');
    }
    return row;
  }

  private async customerName(customerId: string): Promise<string> {
    const row = await this.repo.findCustomerName(customerId);
    return row?.name ?? '';
  }

  async exportExcel(customerId: string, query: LoadingRequestQueryDto): Promise<Buffer> {
    const filter = this.buildFilter(customerId, query);
    const [rows, sums, deliveredTotal] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateSums(filter),
      this.repo.aggregateDeliveredSum(filter),
    ]);
    const dtos = rows.map(toLoadingRequestDto);
    const sumRow = buildLoadingRequestSumRow(sums, deliveredTotal);

    return this.excel.build({
      sheetName: 'اعلام بار',
      title: 'گزارش اعلام بار',
      columns: [
        { header: 'شماره', key: 'requestNumber' },
        { header: 'تاریخ ثبت', key: 'submittedAt' },
        { header: 'محصول', key: 'productName', width: 28 },
        { header: 'باربری', key: 'carrierName', width: 20 },
        { header: 'تاریخ اعلام', key: 'requestDate' },
        { header: 'مقدار اعلام', key: 'requestedQty', numeric: true },
        { header: 'تحویل‌شده', key: 'deliveredQty', numeric: true },
        { header: 'مانده', key: 'remainingQty', numeric: true },
        { header: 'وضعیت', key: 'status' },
      ],
      rows: dtos.map((r) => ({
        requestNumber: r.requestNumber,
        submittedAt: r.submittedAt.slice(0, 10),
        productName: r.productName,
        carrierName: r.carrierName ?? 'کارخانه تعیین کند',
        requestDate: r.requestDate.slice(0, 10),
        requestedQty: r.requestedQty,
        deliveredQty: r.deliveredQty,
        remainingQty: r.remainingQty,
        status: r.status,
      })),
      sumRow: {
        requestedQty: sumRow.requestedQty,
        deliveredQty: sumRow.deliveredQty,
      },
    });
  }
}
