import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Repository اعلانات — تنها نقطه دسترسی NotificationService به دیتابیس
 * (instruction.md §2: سرویس هرگز PrismaClient مستقیم ندارد).
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** یک اعلان برای یک مشتری خاص. */
  createForCustomer(
    customerId: string,
    title: string,
    body: string,
  ): Promise<{ id: string }> {
    return this.prisma.notification.create({
      data: { customerId, title, body },
      select: { id: true },
    });
  }

  /**
   * اعلان Broadcast برای همه ادمین‌ها. طبق بخش ۱۷، اعلان ادمین یک رکورد با
   * `customerId=null` است (نه یک رکورد به‌ازای هر ادمین).
   */
  createForAdmins(title: string, body: string): Promise<{ id: string }> {
    return this.prisma.notification.create({
      data: { customerId: null, title, body },
      select: { id: true },
    });
  }

  createMany(rows: Prisma.NotificationCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.createMany({ data: rows });
  }

  /**
   * یک اعلان برای همه مشتریان فعال (Broadcast مشتری‌محور — انتشار نظرسنجی، بخش ۱۷).
   * برخلاف Broadcast ادمین، اینجا یک رکورد به‌ازای هر مشتری فعال ساخته می‌شود تا
   * وضعیت خوانده‌شدن هر مشتری مستقل باشد.
   */
  async createForAllActiveCustomers(title: string, body: string): Promise<Prisma.BatchPayload> {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true },
    });
    if (customers.length === 0) {
      return { count: 0 };
    }
    return this.prisma.notification.createMany({
      data: customers.map((c) => ({ customerId: c.id, title, body })),
    });
  }

  // ==================== خواندن (بخش ۱۱.۹) ====================

  /**
   * اعلان‌های یک مشتری = فقط رکوردهای مشتری‌محور خودش (customerId برابر خودش).
   *
   * ⚠️ رکوردهای customerId=null صرفاً Broadcast «ادمین‌محور» هستند (createForAdmins:
   * شکایت/فیش/مشتری جدید و ...) و حاوی نام و اطلاعات سایر مشتریان‌اند؛ بنابراین نباید
   * به مشتری نشت کنند (Data Scoping §6.2). اعلان‌های عمومیِ مشتری‌محور به‌صورت یک رکورد
   * به‌ازای هر مشتری ساخته می‌شوند (createForAllActiveCustomers)، نه با customerId=null.
   */
  findForCustomer(
    customerId: string,
    unreadOnly: boolean,
  ): Promise<Array<{ id: string; title: string; body: string; isRead: boolean; createdAt: Date }>> {
    const where: Prisma.NotificationWhereInput = { customerId };
    if (unreadOnly) {
      where.isRead = false;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, title: true, body: true, isRead: true, createdAt: true },
    });
  }

  /** اعلان‌های ادمین = فقط Broadcast ادمین (customerId=null). */
  findForAdmin(
    unreadOnly: boolean,
  ): Promise<Array<{ id: string; title: string; body: string; isRead: boolean; createdAt: Date }>> {
    const where: Prisma.NotificationWhereInput = { customerId: null };
    if (unreadOnly) {
      where.isRead = false;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, title: true, body: true, isRead: true, createdAt: true },
    });
  }

  /** علامت‌گذاری یک اعلان به‌عنوان خوانده‌شده (بدون Scope؛ کنترلر مالکیت را چک می‌کند). */
  async markRead(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  findById(
    id: string,
  ): Promise<{ id: string; customerId: string | null } | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, customerId: true },
    });
  }
}
