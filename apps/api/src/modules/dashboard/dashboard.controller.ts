import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthUser,
  DashboardSummaryDto,
  DeliveryTrendDto,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { DashboardService } from './dashboard.service';

/** کنترلر داشبورد مشتری (بخش ۱۱.۲) — فقط نقش CUSTOMER. */
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'همه KPIها + اطلاعات محصول + اطلاعات کاربری در یک پاسخ' })
  summary(@CurrentUser() user: AuthUser): Promise<DashboardSummaryDto> {
    return this.service.summary(requireCustomerId(user), new Date());
  }

  @Get('delivery-trend')
  @ApiOperation({ summary: 'داده نمودار روند تحویل ماهانه (پیش‌فرض ۱۲ ماه)' })
  deliveryTrend(
    @CurrentUser() user: AuthUser,
    @Query('months') months?: string,
  ): Promise<DeliveryTrendDto> {
    const parsed = months ? Number.parseInt(months, 10) : 12;
    return this.service.deliveryTrend(
      requireCustomerId(user),
      Number.isFinite(parsed) ? parsed : 12,
      new Date(),
    );
  }
}
