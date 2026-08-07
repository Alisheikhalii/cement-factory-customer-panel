import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminManualOrderRow, AuthUser } from '@cement/shared-types';
import { FEATURE_FLAGS } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequiresFeature } from '../../common/guards/feature-flag.decorator';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import type { ActiveProductRow } from './admin-manual-orders.repository';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { UpdateManualOrderQtyDto } from './dto/update-manual-order-qty.dto';
import { AdminManualOrdersService } from './admin-manual-orders.service';

/**
 * کنترلر ثبت دستی سفارشات توسط ادمین (Task 2 — پایلوت یک‌هفته‌ای).
 * مسیر: /api/v1/admin/manual-orders — نقش ADMIN.
 *
 * کل کنترلر پشت `FEATURE_MANUAL_ORDER_ENTRY` است: با خاموش شدن پرچم پس از پایلوت
 * همهٔ این مسیرها ۴۰۳ با کد FEATURE_DISABLED می‌دهند و مسیر عادی ERP دست‌نخورده
 * باقی می‌ماند (هیچ کد موجودی تغییر نکرده است).
 */
@ApiTags('admin-manual-orders')
@ApiBearerAuth()
@UseGuards(AdminGuard, FeatureFlagGuard)
@RequiresFeature(FEATURE_FLAGS.MANUAL_ORDER_ENTRY)
@Controller('admin/manual-orders')
export class AdminManualOrdersController {
  constructor(private readonly service: AdminManualOrdersService) {}

  @Get('products')
  @ApiOperation({ summary: 'محصولات فعال برای انتخاب در فرم ثبت دستی' })
  products(): Promise<ActiveProductRow[]> {
    return this.service.listActiveProducts();
  }

  @Get()
  @ApiOperation({ summary: 'لیست سفارشات ثبت‌دستی (اختیاری: فیلتر بر اساس مشتری)' })
  list(@Query('customerId') customerId?: string): Promise<AdminManualOrderRow[]> {
    return this.service.list(customerId);
  }

  @Post()
  @WriteThrottle()
  @ApiOperation({ summary: 'ثبت دستی سفارش جدید برای یک مشتری' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateManualOrderDto,
  ): Promise<AdminManualOrderRow> {
    return this.service.create(body, user.userId, user.fullName ?? user.username);
  }

  @Patch(':id/quantity')
  @WriteThrottle()
  @ApiOperation({ summary: 'ویرایش مقدار یک سفارش دستی (اصلاح مقدار خرید مشتری)' })
  updateQuantity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateManualOrderQtyDto,
  ): Promise<AdminManualOrderRow> {
    return this.service.updateQuantity(id, body, user.userId, user.fullName ?? user.username);
  }
}
