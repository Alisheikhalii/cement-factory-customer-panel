import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AuthUser,
  LoadingRequestDto,
  LoadingRequestListData,
  SelectableOrderDto,
  SelectableProductDto,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { sendExcel } from '../../common/http/file-response.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { LoadingRequestQueryDto } from './dto/loading-request-query.dto';
import { CreateLoadingRequestDto } from './dto/create-loading-request.dto';
import { LoadingRequestService } from './loading-requests.service';

/**
 * کنترلر اعلام بار مشتری (بخش ۱۱.۵) — نقش CUSTOMER.
 * فاز ۳: ثبت (POST) و لغو (POST :id/cancel) اضافه شد.
 */
@ApiTags('loading-requests')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('loading-requests')
export class LoadingRequestsController {
  constructor(private readonly service: LoadingRequestService) {}

  @Get()
  @ApiOperation({ summary: 'لیست اعلام‌بارهای مشتری با فیلتر و صفحه‌بندی' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: LoadingRequestQueryDto,
  ): Promise<ResponseWithMeta<LoadingRequestListData>> {
    return this.service.list(requireCustomerId(user), query);
  }

  @Post()
  @WriteThrottle()
  @ApiOperation({ summary: 'ثبت درخواست اعلام بار جدید (BR-04..BR-07، BR-24)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateLoadingRequestDto,
  ): Promise<LoadingRequestDto> {
    return this.service.create(requireCustomerId(user), body);
  }

  @Post(':id/cancel')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'لغو درخواست اعلام بار توسط مشتری (BR-10)' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LoadingRequestDto> {
    return this.service.cancel(requireCustomerId(user), id);
  }

  /**
   * سفارش‌های قابل انتخاب برای Dropdown فرم اعلام بار (بخش ۹.۵).
   * ⚠️ باید پیش از `@Get(':id')` اعلام شود، وگرنه مسیر پارامتری آن را می‌بلعد.
   */
  @Get('selectable-orders')
  @ApiOperation({ summary: 'سفارش‌های فعال دارای مانده برای فرم اعلام بار' })
  selectableOrders(@CurrentUser() user: AuthUser): Promise<SelectableOrderDto[]> {
    return this.service.selectableOrders(requireCustomerId(user));
  }

  /**
   * محصولات قابل انتخاب در فرم اعلام بار (حالت `FEATURE_PILOT_PRODUCT_SELECTION`).
   * ⚠️ مثل مسیر بالا باید پیش از `@Get(':id')` بماند.
   */
  @Get('selectable-products')
  @ApiOperation({ summary: 'محصولات قابل انتخاب برای فرم اعلام بار (حالت پایلوت)' })
  selectableProducts(@CurrentUser() user: AuthUser): Promise<SelectableProductDto[]> {
    // Scope مشتری هرچند در Query لازم نیست، همین‌جا اعتبارسنجی می‌شود تا این مسیر هم
    // مثل بقیهٔ کنترلر فقط با توکن مشتریِ معتبر پاسخ بدهد (بخش ۶.۲).
    requireCustomerId(user);
    return this.service.pilotSelectableProducts();
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'خروجی Excel اعلام بار' })
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Query() query: LoadingRequestQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.exportExcel(requireCustomerId(user), query);
    sendExcel(res, buffer, 'loading-requests.xlsx');
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک اعلام بار' })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LoadingRequestDto> {
    return this.service.detail(requireCustomerId(user), id);
  }
}
