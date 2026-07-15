import { Injectable } from '@nestjs/common';
import type {
  AdminActivityDto,
  AdminDashboardKpis,
  AdminDeliveryTrendPoint,
  AdminLoadingRequestTrendPoint,
} from '@cement/shared-types';
import {
  currentJalaaliWeekStart,
  iranDayKey,
  jalaaliDayLabel,
  startOfToday,
} from '../../common/utils/jalali.util';
import { AuditLogService } from '../../common/services/audit-log.service';
import { ComplaintRepository } from '../complaints/complaints.repository';
import { SurveyRepository } from '../surveys/surveys.repository';
import { AdminDashboardRepository } from './admin-dashboard.repository';

const ONLINE_WINDOW_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * سرویس داشبورد ادمین/Command Center (بخش ۹.۹.۱).
 * KPIها، فید فعالیت (از AuditLog)، و دو نمودار روند.
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly repo: AdminDashboardRepository,
    private readonly complaints: ComplaintRepository,
    private readonly surveys: SurveyRepository,
    private readonly audit: AuditLogService,
  ) {}

  async summary(now: Date = new Date()): Promise<AdminDashboardKpis> {
    const todayStart = startOfToday(now);
    const weekStart = currentJalaaliWeekStart(now);
    const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);

    const [
      totalCustomers,
      activeOrders,
      pendingLoadingRequests,
      todayDelivered,
      weekDelivered,
      pendingComplaints,
      activeSurvey,
      onlineUsers,
    ] = await Promise.all([
      this.repo.countCustomers(),
      this.repo.countActiveOrders(),
      this.repo.countPendingLoadingRequests(),
      this.repo.sumDeliveredSince(todayStart),
      this.repo.sumDeliveredSince(weekStart),
      this.complaints.countPending(),
      this.surveys.activeSurveyKpi(),
      this.repo.countOnlineUsers(onlineSince),
    ]);

    return {
      totalCustomers,
      activeOrders,
      pendingLoadingRequests,
      todayDelivered,
      weekDelivered,
      pendingComplaints,
      activeSurvey,
      onlineUsers,
    };
  }

  /** فید Latest Activities از AuditLog، با متن فارسی خوانا (۹.۹.۱ بخش ۲). */
  async activities(limit: number): Promise<AdminActivityDto[]> {
    const rows = await this.audit.latest(limit);
    return rows.map((r) => ({
      id: r.id,
      text: AuditLogService.toActivityText(r.action, r.newValue),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** نمودار تحویل روزانه کل کارخانه (بازه ۳۰ روزه، بخش ۹.۹.۱ بخش ۳). */
  async deliveryTrend(days = 30, now: Date = new Date()): Promise<AdminDeliveryTrendPoint[]> {
    const since = new Date(startOfToday(now).getTime() - (days - 1) * DAY_MS);
    const rows = await this.repo.dailyDeliveryTrend(since);
    // ردیف‌های DB با کلید روزِ ایران (`YYYY-MM-DD`) برمی‌گردند؛ محور هم با همان کلید.
    const byDay = new Map<string, number>();
    for (const r of rows) {
      byDay.set(r.day, r.delivered);
    }
    return this.buildDayAxis(since, days).map((d) => ({
      label: jalaaliDayLabel(d),
      delivered: byDay.get(iranDayKey(d)) ?? 0,
    }));
  }

  /** نمودار ثبت اعلام بار روزانه به تفکیک وضعیت (بخش ۹.۹.۱ بخش ۴). */
  async loadingRequestTrend(
    days = 30,
    now: Date = new Date(),
  ): Promise<AdminLoadingRequestTrendPoint[]> {
    const since = new Date(startOfToday(now).getTime() - (days - 1) * DAY_MS);
    const rows = await this.repo.dailyLoadingRequestTrend(since);
    const byDay = new Map<string, { approved: number; rejected: number; pending: number }>();
    for (const r of rows) {
      const key = r.day;
      const bucket = byDay.get(key) ?? { approved: 0, rejected: 0, pending: 0 };
      if (r.status === 'APPROVED' || r.status === 'LOADED') {
        bucket.approved += r.count;
      } else if (r.status === 'REJECTED') {
        bucket.rejected += r.count;
      } else if (r.status === 'SUBMITTED') {
        bucket.pending += r.count;
      }
      byDay.set(key, bucket);
    }
    return this.buildDayAxis(since, days).map((d) => {
      const bucket = byDay.get(iranDayKey(d)) ?? { approved: 0, rejected: 0, pending: 0 };
      return { label: jalaaliDayLabel(d), ...bucket };
    });
  }

  private buildDayAxis(since: Date, days: number): Date[] {
    const axis: Date[] = [];
    for (let i = 0; i < days; i += 1) {
      axis.push(new Date(since.getTime() + i * DAY_MS));
    }
    return axis;
  }
}
