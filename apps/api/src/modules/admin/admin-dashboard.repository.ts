import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfToday } from '../../common/utils/jalali.util';

/**
 * Repository داشبورد ادمین (بخش ۹.۹.۱). Query های تجمیعی سطح کل کارخانه
 * (بدون Scope مشتری، چون ادمین کل سیستم را می‌بیند).
 */
@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  countCustomers(): Promise<number> {
    return this.prisma.customer.count({ where: { isDeleted: false } });
  }

  countActiveOrders(): Promise<number> {
    return this.prisma.order.count({ where: { status: 'IN_USE' } });
  }

  countPendingLoadingRequests(): Promise<number> {
    return this.prisma.loadingRequest.count({ where: { status: 'SUBMITTED' } });
  }

  async sumDeliveredSince(since: Date): Promise<number> {
    const result = await this.prisma.delivery.aggregate({
      where: { deliveryDate: { gte: since } },
      _sum: { deliveredQty: true },
    });
    return result._sum.deliveredQty?.toNumber() ?? 0;
  }

  /** تعداد کاربران فعال در ۱۵ دقیقه اخیر (KPI کاربران آنلاین ۹.۹.۱). */
  countOnlineUsers(since: Date): Promise<number> {
    return this.prisma.user.count({
      where: { lastActivityAt: { gte: since }, isDeleted: false },
    });
  }

  /**
   * روند تحویل روزانه در بازه اخیر — گروه‌بندی بر اساس روز (YYYY-MM-DD میلادی؛
   * برچسب جلالی در Mapper ساخته می‌شود). از Raw Query برای گروه‌بندی روزانه استفاده می‌شود.
   */
  async dailyDeliveryTrend(since: Date): Promise<Array<{ day: string; delivered: number }>> {
    // گروه‌بندی بر مرز «روز ایران» (offset ثابت +۳:۳۰، بدون DST) نه روز UTC؛ مقدار
    // ذخیره‌شده UTC است، پس با افزودن offset به وقت ایران می‌رود و سپس تا روز
    // بریده می‌شود. خروجی به‌صورت متن `YYYY-MM-DD` تا با iranDayKey محور یکی شود.
    const rows = await this.prisma.$queryRaw<Array<{ day: string; delivered: Prisma.Decimal }>>`
      SELECT to_char(date_trunc('day', "deliveryDate" + interval '3 hours 30 minutes'), 'YYYY-MM-DD') AS day,
             SUM("deliveredQty") AS delivered
      FROM "Delivery"
      WHERE "deliveryDate" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return rows.map((r) => ({ day: r.day, delivered: Number(r.delivered) }));
  }

  /**
   * روند روزانه ثبت اعلام بار به تفکیک وضعیت نهایی (بخش ۹.۹.۱ بخش ۴).
   * APPROVED/LOADED → approved؛ REJECTED → rejected؛ SUBMITTED → pending.
   */
  async dailyLoadingRequestTrend(
    since: Date,
  ): Promise<Array<{ day: string; status: string; count: number }>> {
    // مرز «روز ایران» مانند dailyDeliveryTrend (offset ثابت +۳:۳۰).
    const rows = await this.prisma.$queryRaw<
      Array<{ day: string; status: string; count: bigint }>
    >`
      SELECT to_char(date_trunc('day', "submittedAt" + interval '3 hours 30 minutes'), 'YYYY-MM-DD') AS day,
             "status" AS status, COUNT(*) AS count
      FROM "LoadingRequest"
      WHERE "submittedAt" >= ${since}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;
    return rows.map((r) => ({ day: r.day, status: r.status, count: Number(r.count) }));
  }
}
