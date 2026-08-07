import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { AdminManualOrderRow } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { AuditLogService } from '../../common/services/audit-log.service';
import {
  ActiveProductRow,
  AdminManualOrdersRepository,
} from './admin-manual-orders.repository';
import type { CreateManualOrderDto } from './dto/create-manual-order.dto';
import type { UpdateManualOrderQtyDto } from './dto/update-manual-order-qty.dto';

/**
 * سرویس ثبت دستی سفارشات توسط ادمین (Task 2 — پایلوت یک‌هفته‌ای).
 *
 * چرایی وجود: در هفتهٔ پایلوت ERP متصل نیست، پس سفارش باید دستی ثبت شود تا مشتری
 * بتواند روی آن اعلام بار بدهد. مسیر اعلام بار مشتری هیچ تغییری نکرده — همان
 * سفارش را می‌بیند، فقط منشأ ساختش MANUAL است.
 *
 * پشت `FEATURE_MANUAL_ORDER_ENTRY`؛ با خاموش شدن پرچم کل کنترلر ۴۰۳ می‌دهد و
 * رکوردهای MANUAL طبق PILOT_MODE.md بایگانی می‌شوند (نه حذف).
 */
@Injectable()
export class AdminManualOrdersService {
  constructor(
    private readonly repo: AdminManualOrdersRepository,
    private readonly audit: AuditLogService,
  ) {}

  /** محصولات فعال برای Dropdown فرم ثبت دستی. */
  listActiveProducts(): Promise<ActiveProductRow[]> {
    return this.repo.findActiveProducts();
  }

  /** لیست سفارشات دستی؛ با customerId فقط سفارشات همان مشتری. */
  list(customerId?: string): Promise<AdminManualOrderRow[]> {
    return customerId
      ? this.repo.findManualByCustomer(customerId)
      : this.repo.findAllManual();
  }

  /** ثبت دستی یک سفارش جدید با `remainingQty = totalQty`. */
  async create(
    input: CreateManualOrderDto,
    adminUserId: string,
    adminName: string,
  ): Promise<AdminManualOrderRow> {
    const orderNumber = this.generateOrderNumber();
    const order = await this.repo.create({
      customerId: input.customerId,
      productId: input.productId,
      orderNumber,
      totalQty: input.totalQty,
    });

    await this.audit.log({
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'MANUAL_ORDER_CREATE',
      entityType: 'Order',
      entityId: order.id,
      newValue: {
        orderNumber: order.orderNumber,
        productName: order.productName,
        totalQty: order.totalQty,
        source: 'MANUAL',
      },
      actorName: adminName,
      subjectName: order.customerName,
      ref: order.orderNumber,
    });

    return order;
  }

  /**
   * ویرایش مقدار یک سفارش دستی (مقدار خرید مشتری در طول هفته تغییر می‌کند).
   *
   * قید: مقدار جدید نمی‌تواند از مقدار تحویل‌شده کمتر باشد، وگرنه `remainingQty`
   * منفی می‌شود و اعلام بارهای بعدی محاسبهٔ غلط می‌دهند (BR-25).
   */
  async updateQuantity(
    id: string,
    input: UpdateManualOrderQtyDto,
    adminUserId: string,
    adminName: string,
  ): Promise<AdminManualOrderRow> {
    const existing = await this.repo.findManualById(id);
    if (!existing) {
      // یا وجود ندارد یا source=ERP_SYNC است؛ در هر دو حالت از این مسیر قابل ویرایش نیست.
      throw new AppException('ORDER_001', 'سفارش ثبت‌دستی یافت نشد');
    }

    if (input.newTotalQty < existing.deliveredQty) {
      throw new AppException(
        'ORDER_001',
        `مقدار جدید نمی‌تواند کمتر از مقدار تحویل‌شده (${existing.deliveredQty} تن) باشد`,
      );
    }

    const updated = await this.repo.updateQuantity(
      id,
      input.newTotalQty,
      input.newTotalQty - existing.deliveredQty,
    );

    await this.audit.log({
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'MANUAL_ORDER_UPDATE_QTY',
      entityType: 'Order',
      entityId: id,
      previousValue: { totalQty: existing.totalQty },
      newValue: { totalQty: updated.totalQty },
      actorName: adminName,
      subjectName: updated.customerName,
      ref: updated.orderNumber,
    });

    return updated;
  }

  /**
   * شماره سفارش دستی: `MO-{YYMMDD}-{6 hex}`.
   * پیشوند MO آن را از شماره‌های ERP جدا می‌کند تا موقع بایگانی پس از پایلوت
   * با چشم هم قابل تشخیص باشد. بخش تصادفی از `randomBytes` می‌آید تا دو ثبت
   * هم‌زمان به یک شماره نرسند (ستون orderNumber یکتاست).
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const stamp =
      String(now.getFullYear() % 100).padStart(2, '0') +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    return `MO-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
