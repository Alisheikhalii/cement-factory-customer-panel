import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AdminCustomerDto,
  CreateCustomerInput,
  CreateCustomerResult,
  DeleteCustomerResult,
  ResetCustomerPasswordResult,
  UpdateCustomerInput,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination, type PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { PasswordService } from '../auth/services/password.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AdminCustomerRepository, type CustomerRow } from './admin-customer.repository';

/**
 * سرویس مدیریت مشتریان توسط ادمین (بخش ۹.۹.۲، BR-26/BR-28).
 * ایجاد مشتری → ساخت خودکار User با رمز اولیه = کد ملی و بازگرداندن آن یک‌بار.
 * این سیاست دائمی است (نه مخصوص پایلوت): مشتری در اولین ورود مجبور به تغییر آن است.
 */
@Injectable()
export class AdminCustomersService {
  constructor(
    private readonly repo: AdminCustomerRepository,
    private readonly passwords: PasswordService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditLogService,
  ) {}

  async list(
    search: string | undefined,
    query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminCustomerDto[]>> {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const { rows, total } = await this.repo.findPage({ search }, skip, take);
    return new ResponseWithMeta(rows.map(toCustomerDto), buildMeta(page, pageSize, total));
  }

  /**
   * ایجاد مشتری جدید + User (BR-26). کد ملی تکراری → ADMIN_001.
   * رمز اولیه = کد ملی (BR-28)، با mustResetPassword=true برای تغییر اجباری در اولین ورود.
   *
   * دو قانون عمداً سخت‌گیر نیستند:
   * - «کد تفصیل» اختیاری است (در لحظهٔ ثبت همیشه از ERP در دست نیست) و اگر داده
   *   نشود `null` ثبت می‌شود، نه رشتهٔ خالی.
   * - «موبایل تکراری» مانع ثبت نیست؛ یک شماره می‌تواند برای چند مشتری ثبت شود.
   *   یکتایی هویت مشتری با کد ملی و کد تفصیل تضمین می‌شود، نه با شمارهٔ تماس.
   */
  async create(
    input: CreateCustomerInput,
    adminUserId: string,
    adminName: string,
  ): Promise<CreateCustomerResult> {
    const nationalId = input.nationalId?.trim() ?? '';
    // رشتهٔ خالی به `null` تبدیل می‌شود: ایندکس یکتا چند `null` را می‌پذیرد ولی
    // چند رشتهٔ خالی را نه، پس ثبت مشتری دومِ بدون کد تفصیل می‌شکست.
    const customerCode = input.customerCode?.trim() || null;
    const mobile = input.mobile?.trim() ?? '';
    if (nationalId === '' || mobile === '' || !input.name?.trim()) {
      throw new AppException('GENERIC_500', 'اطلاعات مشتری ناقص است');
    }

    if (await this.repo.nationalIdExists(nationalId)) {
      throw new AppException('ADMIN_001');
    }
    // یکتایی کدهای واقعی همچنان بررسی می‌شود؛ فقط «نبودِ کد» مجاز شده است.
    if (customerCode !== null && (await this.repo.customerCodeExists(customerCode))) {
      throw new AppException('ADMIN_001', 'مشتری‌ای با این کد تفصیل از قبل وجود دارد');
    }

    // رمز اولیه = کد ملی (BR-28، سیاست دائمی). مشتری در اولین ورود مجبور به تغییر آن است.
    const temporaryPassword = nationalId;
    const passwordHash = await this.passwords.hash(temporaryPassword);

    const created = await this.repo.createWithUser(
      {
        customerCode,
        name: input.name.trim(),
        nationalId,
        economicCode: input.economicCode?.trim() || null,
        mobile,
        address: input.address?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        creditLimit:
          input.creditLimit !== undefined && input.creditLimit !== null
            ? new Prisma.Decimal(input.creditLimit)
            : null,
      },
      passwordHash,
    );

    await this.notifications.emitCustomerCreated({
      customerName: created.name,
      adminName,
    });
    await this.audit.log({
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'CUSTOMER_CREATE',
      entityType: 'Customer',
      entityId: created.id,
      actorName: adminName,
      subjectName: created.name,
    });

    return { customer: toCustomerDto(created), temporaryPassword };
  }

  async update(id: string, input: UpdateCustomerInput): Promise<AdminCustomerDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppException('GENERIC_500', 'مشتری مورد نظر یافت نشد');
    }
    // موبایل تکراری در ویرایش هم رد نمی‌شود (همان قانون ایجاد): یک شماره می‌تواند
    // برای چند مشتری ثبت شود. اعتبارسنجی «قالب شماره» در DTO سر جای خود است.
    const updated = await this.repo.update(id, {
      name: input.name?.trim(),
      economicCode: input.economicCode?.trim() || null,
      mobile: input.mobile?.trim(),
      address: input.address?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      creditLimit:
        input.creditLimit !== undefined && input.creditLimit !== null
          ? new Prisma.Decimal(input.creditLimit)
          : undefined,
    });
    return toCustomerDto(updated);
  }

  async toggleActive(id: string): Promise<AdminCustomerDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppException('GENERIC_500', 'مشتری مورد نظر یافت نشد');
    }
    const updated = await this.repo.toggleActive(id, !existing.isActive);
    return toCustomerDto(updated);
  }

  /**
   * حذف نرم مشتری + غیرفعال‌سازی حساب کاربری او (بخش ۵.۲).
   * سفارش/اعلام بار/تحویل‌های تاریخی حذف نمی‌شوند (دادهٔ مالی واقعی).
   */
  async softDelete(
    id: string,
    adminUserId: string,
    adminName: string,
  ): Promise<DeleteCustomerResult> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppException('GENERIC_500', 'مشتری مورد نظر یافت نشد');
    }
    const ok = await this.repo.softDelete(id, adminUserId);
    if (!ok) {
      throw new AppException('GENERIC_500', 'مشتری مورد نظر یافت نشد');
    }
    await this.audit.log({
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'CUSTOMER_DELETE',
      entityType: 'Customer',
      entityId: id,
      actorName: adminName,
      subjectName: existing.name,
    });
    return { deleted: true };
  }

  async resetPassword(id: string): Promise<ResetCustomerPasswordResult> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppException('GENERIC_500', 'مشتری مورد نظر یافت نشد');
    }
    // بازنشانی به کد ملی (BR-28، سیاست دائمی) + mustResetPassword=true.
    const temporaryPassword = existing.nationalId ?? '';
    if (temporaryPassword === '') {
      throw new AppException('GENERIC_500', 'کد ملی مشتری ثبت نشده است — بازنشانی ممکن نیست');
    }
    const passwordHash = await this.passwords.hash(temporaryPassword);
    const ok = await this.repo.resetPassword(id, passwordHash);
    if (!ok) {
      throw new AppException('GENERIC_500', 'حساب کاربری این مشتری یافت نشد');
    }
    return { temporaryPassword };
  }
}

function toCustomerDto(row: CustomerRow): AdminCustomerDto {
  return {
    id: row.id,
    customerCode: row.customerCode,
    name: row.name,
    nationalId: row.nationalId,
    economicCode: row.economicCode,
    mobile: row.mobile,
    address: row.address,
    postalCode: row.postalCode,
    creditLimit: row.creditLimit ? row.creditLimit.toNumber() : null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}
