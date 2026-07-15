import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminActivityDto,
  AdminDashboardKpis,
  AdminDeliveryTrendPoint,
  AdminLoadingRequestTrendPoint,
} from '@cement/shared-types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';

const DEFAULT_ACTIVITY_LIMIT = 20;
const MAX_ACTIVITY_LIMIT = 50;
const DELIVERY_TREND_DAYS = 30;
const LOADING_REQUEST_TREND_DAYS = 30;

/**
 * کنترلر داشبورد ادمین/Command Center (بخش ۹.۹.۱ / ۱۱.۱۰) — نقش ADMIN.
 * مسیر: /api/v1/admin/dashboard/*
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIهای داشبورد ادمین (شامل کاربران آنلاین)' })
  summary(): Promise<AdminDashboardKpis> {
    return this.service.summary();
  }

  @Get('activities')
  @ApiOperation({ summary: 'فید Latest Activities از AuditLog' })
  activities(@Query('limit') limit?: string): Promise<AdminActivityDto[]> {
    const parsed = Number(limit);
    const safe =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(Math.floor(parsed), MAX_ACTIVITY_LIMIT)
        : DEFAULT_ACTIVITY_LIMIT;
    return this.service.activities(safe);
  }

  @Get('delivery-trend')
  @ApiOperation({ summary: 'نمودار تحویل روزانه کل کارخانه (۳۰ روز اخیر)' })
  deliveryTrend(): Promise<AdminDeliveryTrendPoint[]> {
    return this.service.deliveryTrend(DELIVERY_TREND_DAYS);
  }

  @Get('loading-request-trend')
  @ApiOperation({ summary: 'نمودار روزانه ثبت اعلام بار به تفکیک وضعیت' })
  loadingRequestTrend(): Promise<AdminLoadingRequestTrendPoint[]> {
    return this.service.loadingRequestTrend(LOADING_REQUEST_TREND_DAYS);
  }
}
