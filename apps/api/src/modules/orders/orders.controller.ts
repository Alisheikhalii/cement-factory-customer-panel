import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AuthUser,
  LoadingRequestListData,
  OrderDto,
  OrderListData,
} from '@cement/shared-types';
import { FEATURE_FLAGS } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequiresFeature } from '../../common/guards/feature-flag.decorator';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { sendExcel } from '../../common/http/file-response.util';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

/**
 * کنترلر سفارشات (بخش ۱۱.۴) — همه مسیرها فقط برای نقش CUSTOMER.
 * CustomerScopeGuard تضمین می‌کند فقط مشتری دارای customerId معتبر عبور کند؛
 * customerId خودِ Scope از توکن خوانده می‌شود (بخش ۶.۲).
 *
 * فاز پایلوت: کل کنترلر پشت `FEATURE_ORDERS_ENABLED` است. وقتی خاموش باشد همه
 * مسیرهای /orders/* پاسخ ۴۰۳ با کد FEATURE_DISABLED می‌دهند (نه ۴۰۴). با روشن
 * کردن پرچم، رفتار عیناً به حالت قبل برمی‌گردد — هیچ کدی تغییر نکرده است.
 */
@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard, FeatureFlagGuard)
@RequiresFeature(FEATURE_FLAGS.ORDERS_ENABLED)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست سفارشات مشتری با فیلتر و صفحه‌بندی' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: OrderQueryDto,
  ): Promise<ResponseWithMeta<OrderListData>> {
    return this.orders.list(requireCustomerId(user), query);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'خروجی Excel سفارشات (با اعمال همان فیلترها)' })
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Query() query: OrderQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.orders.exportExcel(requireCustomerId(user), query);
    sendExcel(res, buffer, 'orders.xlsx');
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک سفارش' })
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<OrderDto> {
    return this.orders.detail(requireCustomerId(user), id);
  }

  @Get(':id/loading-requests')
  @ApiOperation({ summary: 'اعلام‌بارهای ثبت‌شده روی یک سفارش' })
  loadingRequests(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LoadingRequestListData> {
    return this.orders.loadingRequestsOf(requireCustomerId(user), id);
  }
}
