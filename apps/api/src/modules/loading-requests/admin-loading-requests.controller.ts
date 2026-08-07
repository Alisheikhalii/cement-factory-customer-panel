import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AdminLoadingRequestDetail,
  AdminLoadingRequestRow,
  AuthUser,
  LoadingRequestDto,
} from '@cement/shared-types';
import { FEATURE_FLAGS } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequiresFeature } from '../../common/guards/feature-flag.decorator';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { sendExcel } from '../../common/http/file-response.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { AdminLoadingRequestQueryDto } from './dto/admin-loading-request-query.dto';
import { RegisterManualDeliveryDto } from './dto/register-manual-delivery.dto';
import { RejectLoadingRequestDto } from './dto/reject-loading-request.dto';
import type { ActiveCarrierRow } from './loading-requests.repository';
import { LoadingRequestService } from './loading-requests.service';

/**
 * کنترلر کارتابل و عملیات ادمین روی اعلام بار (بخش ۹.۹.۳ / ۱۱.۱۰) — نقش ADMIN.
 * مسیر: /api/v1/admin/loading-requests/*
 *
 * - لیست کارتابل + جزئیات (با مانده موجودی BR-25) در فاز ۴.۵.
 * - تایید/رد Transitionهای State Machine بخش ۸.۱ (BR-11: دلیل رد اجباری)، با PATCH طبق ۱۱.۱۰.
 * - `mark-loaded` جایگزین موقت Sync کارخانه (فاز ۶).
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/loading-requests')
export class AdminLoadingRequestsController {
  constructor(private readonly service: LoadingRequestService) {}

  @Get()
  @ApiOperation({ summary: 'کارتابل اعلام بار (همه مشتریان، فیلتر وضعیت/تاریخ + مرتب‌سازی)' })
  list(
    @Query() query: AdminLoadingRequestQueryDto,
  ): Promise<ResponseWithMeta<AdminLoadingRequestRow[]>> {
    return this.service.adminList(query);
  }

  /**
   * خروجی Excel کارتابل با همان فیلتر/مرتب‌سازی جدول (بخش ۹.۰).
   * ⚠️ مثل `carriers` باید پیش از `@Get(':id')` بماند وگرنه `export` یک id تلقی می‌شود.
   */
  @Get('export/excel')
  @ApiOperation({ summary: 'خروجی Excel کارتابل اعلام بار ادمین' })
  async exportExcel(
    @Query() query: AdminLoadingRequestQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.adminExportExcel(query);
    sendExcel(res, buffer, 'admin-loading-requests.xlsx');
  }

  /**
   * فهرست باربری‌های فعال برای فرم ثبت دستی تحویل (Task 3 — پایلوت).
   * ⚠️ باید پیش از `@Get(':id')` تعریف شود وگرنه به‌عنوان id تفسیر می‌شود.
   * پشت همان پرچم پایلوت است تا با خاموش شدن آن ناپدید شود.
   */
  @Get('carriers')
  @UseGuards(FeatureFlagGuard)
  @RequiresFeature(FEATURE_FLAGS.MANUAL_DELIVERY_ENTRY)
  @ApiOperation({ summary: 'باربری‌های فعال برای فرم ثبت دستی تحویل' })
  carriers(): Promise<ActiveCarrierRow[]> {
    return this.service.activeCarriers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کامل درخواست + مانده موجودی (BR-25)' })
  detail(@Param('id') id: string): Promise<AdminLoadingRequestDetail> {
    return this.service.adminDetail(id);
  }

  @Patch(':id/approve')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'تایید درخواست اعلام بار (SUBMITTED → APPROVED)' })
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<LoadingRequestDto> {
    return this.service.approve(id, user.userId);
  }

  @Patch(':id/reject')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'رد درخواست اعلام بار با دلیل اجباری (BR-11)' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: RejectLoadingRequestDto,
  ): Promise<LoadingRequestDto> {
    return this.service.reject(id, user.userId, body.reason);
  }

  @Post(':id/mark-loaded')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({
    summary: 'ثبت بارگیری و ساخت Delivery (APPROVED → LOADED، جایگزین موقت Sync فاز ۶)',
  })
  markLoaded(@Param('id') id: string): Promise<LoadingRequestDto> {
    return this.service.markLoaded(id);
  }

  /**
   * ثبت دستی تحویل با دادهٔ توزین (Task 3 — پایلوت).
   *
   * همان Transition و همان سرویس `markLoaded` را صدا می‌زند؛ تنها تفاوت، مبدأ
   * دادهٔ توزین (فرم ادمین به‌جای ERP) است. پشت `FEATURE_MANUAL_DELIVERY_ENTRY`:
   * با خاموش شدن پرچم این مسیر ۴۰۳ می‌دهد و `mark-loaded` بالا دست‌نخورده می‌ماند.
   */
  @Post(':id/register-delivery')
  @UseGuards(FeatureFlagGuard)
  @RequiresFeature(FEATURE_FLAGS.MANUAL_DELIVERY_ENTRY)
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'ثبت دستی تحویل با دادهٔ توزین (APPROVED → LOADED)' })
  registerDelivery(
    @Param('id') id: string,
    @Body() body: RegisterManualDeliveryDto,
  ): Promise<LoadingRequestDto> {
    return this.service.markLoaded(id, body);
  }
}
