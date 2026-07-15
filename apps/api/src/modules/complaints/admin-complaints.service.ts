import { Injectable } from '@nestjs/common';
import type { AdminComplaintDto } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination, type PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { NotificationService } from '../notifications/notification.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { ComplaintRepository } from './complaints.repository';
import { toAdminComplaintDto } from './complaints.mapper';

/**
 * سرویس شکایات سمت ادمین (بخش ۹.۹.۴). مشاهده همه شکایات + ثبت پاسخ نهایی.
 * پاسخ فقط یک‌بار (PENDING → ANSWERED)؛ ANSWERED پایانی است (State Machine ۸.۲).
 */
@Injectable()
export class AdminComplaintsService {
  constructor(
    private readonly repo: ComplaintRepository,
    private readonly notifications: NotificationService,
    private readonly audit: AuditLogService,
  ) {}

  async list(
    status: string | undefined,
    query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminComplaintDto[]>> {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const { rows, total } = await this.repo.findPageForAdmin({ status }, skip, take);
    return new ResponseWithMeta(rows.map(toAdminComplaintDto), buildMeta(page, pageSize, total));
  }

  /**
   * ثبت پاسخ نهایی به شکایت (BR-23). دلیل/متن پاسخ اجباری. اگر قبلاً پاسخ داده
   * شده باشد → پایانی است و پاسخ مجدد مجاز نیست.
   */
  async reply(id: string, adminUserId: string, adminName: string, reply: string): Promise<AdminComplaintDto> {
    const text = reply?.trim() ?? '';
    if (text === '') {
      throw new AppException('COMPLAINT_001', 'متن پاسخ الزامی است');
    }
    const existing = await this.repo.findByIdWithCustomer(id);
    if (!existing) {
      throw new AppException('GENERIC_500', 'شکایت مورد نظر یافت نشد');
    }
    if (existing.status === 'ANSWERED') {
      throw new AppException('COMPLAINT_001', 'این شکایت قبلاً پاسخ داده شده است');
    }

    const updated = await this.repo.reply(id, text, new Date());

    await this.notifications.emitComplaintAnswered(existing.customerId);
    await this.audit.log({
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'COMPLAINT_REPLY',
      entityType: 'Complaint',
      entityId: id,
      newValue: { reply: text },
      actorName: adminName,
      subjectName: existing.customer.name,
    });

    return toAdminComplaintDto(updated);
  }
}
