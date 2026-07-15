import { Injectable } from '@nestjs/common';
import { LoadingRequestStatus, ProductType } from '@cement/shared-types';
import type {
  DashboardSummaryDto,
  DeliveryTrendDto,
  DeliveryTrendPoint,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { toNum, toNumOrNull } from '../../common/utils/decimal.util';
import {
  currentJalaaliMonthStart,
  jalaaliMonthLabel,
  jalaaliMonthStartMonthsAgo,
  startOfToday,
} from '../../common/utils/jalali.util';
import { DashboardRepository } from './dashboard.repository';

/**
 * سرویس داشبورد مشتری (بخش ۹.۲ / ۱۱.۲).
 * همه KPIها را در یک Response واحد برمی‌گرداند (کاهش تعداد Request).
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲).
 */
@Injectable()
export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  async summary(customerId: string, now: Date): Promise<DashboardSummaryDto> {
    const profile = await this.repo.customerProfile(customerId);
    if (!profile) {
      throw new AppException('AUTH_004');
    }

    const monthStart = currentJalaaliMonthStart(now);
    const dayStart = startOfToday(now);

    const [
      balanceRow,
      activeOrders,
      remainingQty,
      monthDelivered,
      lastLoading,
      lastStatement,
      lastComplaint,
      products,
      todayLoading,
      todayDelivery,
    ] = await Promise.all([
      this.repo.latestBalance(customerId),
      this.repo.activeOrderCount(customerId),
      this.repo.remainingQtyTotal(customerId),
      this.repo.deliveredSince(customerId, monthStart),
      this.repo.lastLoadingRequest(customerId),
      this.repo.lastStatement(customerId),
      this.repo.lastComplaint(customerId),
      this.repo.productRemaining(customerId),
      this.repo.todayLoadingByProduct(customerId, dayStart),
      this.repo.todayDeliveryByProduct(customerId, dayStart),
    ]);

    return {
      kpis: {
        accountBalance: toNumOrNull(balanceRow?.balance ?? null),
        activeOrderCount: activeOrders,
        remainingQtyTotal: toNum(remainingQty),
        currentMonthDelivered: toNum(monthDelivered),
        lastLoadingRequest: lastLoading
          ? {
              requestNumber: lastLoading.requestNumber,
              status: LoadingRequestStatus[
                lastLoading.status as keyof typeof LoadingRequestStatus
              ],
              submittedAt: lastLoading.submittedAt.toISOString(),
            }
          : null,
        lastStatement: lastStatement
          ? {
              docNumber: lastStatement.docNumber,
              date: lastStatement.date.toISOString(),
              amount: toNum(lastStatement.amount),
            }
          : null,
        creditBalance: toNumOrNull(profile.creditBalance),
        creditLimit: toNumOrNull(profile.creditLimit),
        lastComplaint: lastComplaint
          ? {
              subject: lastComplaint.subject,
              status: lastComplaint.status,
              submittedAt: lastComplaint.submittedAt.toISOString(),
            }
          : null,
      },
      products: products.map((p) => ({
        productId: p.productId,
        erpCode: p.erpCode,
        name: p.name,
        type: ProductType[p.type as keyof typeof ProductType],
        remainingAllowance: p.remaining,
        todayLoading: todayLoading.get(p.productId) ?? 0,
        todayDelivery: todayDelivery.get(p.productId) ?? 0,
      })),
      userInfo: {
        name: profile.name,
        customerCode: profile.customerCode,
        nationalId: profile.nationalId,
        economicCode: profile.economicCode,
        address: profile.address,
        postalCode: profile.postalCode,
        mobile: profile.mobile,
      },
    };
  }

  /** روند تحویل ماهانه (پیش‌فرض ۱۲ ماه جلالی اخیر). */
  async deliveryTrend(
    customerId: string,
    months: number,
    now: Date,
  ): Promise<DeliveryTrendDto> {
    const count = Math.min(Math.max(months, 1), 36);
    const since = jalaaliMonthStartMonthsAgo(now, count - 1);
    const rows = await this.repo.deliveriesForTrend(customerId, since);

    // ساخت سطل‌های خالی برای هر ماه (تا ماه‌های بدون تحویل هم صفر نشان داده شوند).
    const buckets = new Map<string, number>();
    const order: string[] = [];
    for (let i = count - 1; i >= 0; i -= 1) {
      const monthStart = jalaaliMonthStartMonthsAgo(now, i);
      const label = jalaaliMonthLabel(monthStart);
      buckets.set(label, 0);
      order.push(label);
    }

    for (const row of rows) {
      const label = jalaaliMonthLabel(row.deliveryDate);
      if (buckets.has(label)) {
        buckets.set(label, (buckets.get(label) ?? 0) + toNum(row.deliveredQty));
      }
    }

    const points: DeliveryTrendPoint[] = order.map((label) => ({
      label,
      delivered: buckets.get(label) ?? 0,
    }));
    return { points };
  }
}
