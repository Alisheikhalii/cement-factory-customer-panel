import { Injectable } from '@nestjs/common';
import type { NotificationDto } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { NotificationRepository } from './notification.repository';

/**
 * سرویس خواندن اعلانات (بخش ۱۱.۹).
 * ⚠️ نوشتن اعلان فقط از طریق NotificationService.emit* (ماتریس بخش ۱۷) انجام می‌شود؛
 * این سرویس صرفاً برای نمایش لیست و علامت‌گذاری خوانده‌شده است.
 */
@Injectable()
export class NotificationQueryService {
  constructor(private readonly repo: NotificationRepository) {}

  async listForCustomer(customerId: string, unreadOnly: boolean): Promise<NotificationDto[]> {
    const rows = await this.repo.findForCustomer(customerId, unreadOnly);
    return rows.map(toNotificationDto);
  }

  async listForAdmin(unreadOnly: boolean): Promise<NotificationDto[]> {
    const rows = await this.repo.findForAdmin(unreadOnly);
    return rows.map(toNotificationDto);
  }

  /**
   * علامت خوانده‌شدن. مشتری فقط اعلان‌های مشتری‌محور خودش را می‌تواند بخواند؛
   * رکوردهای customerId=null متعلق به ادمین‌ها هستند و مشتری اجازهٔ دسترسی/تغییر
   * آن‌ها را ندارد → AUTH_004 (Data Scoping بخش ۶.۲).
   */
  async markReadForCustomer(customerId: string, id: string): Promise<void> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new AppException('GENERIC_500', 'اعلان مورد نظر یافت نشد');
    }
    if (row.customerId !== customerId) {
      throw new AppException('AUTH_004');
    }
    await this.repo.markRead(id);
  }

  /** علامت خوانده‌شدن توسط ادمین (فقط Broadcast ادمین، customerId=null). */
  async markReadForAdmin(id: string): Promise<void> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new AppException('GENERIC_500', 'اعلان مورد نظر یافت نشد');
    }
    if (row.customerId !== null) {
      throw new AppException('AUTH_004');
    }
    await this.repo.markRead(id);
  }
}

function toNotificationDto(row: {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}
