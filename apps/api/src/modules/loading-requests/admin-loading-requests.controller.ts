import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminLoadingRequestDetail,
  AdminLoadingRequestRow,
  AuthUser,
  LoadingRequestDto,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { RejectLoadingRequestDto } from './dto/reject-loading-request.dto';
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
  @ApiOperation({ summary: 'کارتابل اعلام بار (همه مشتریان، فیلتر وضعیت)' })
  list(
    @Query('status') status: string | undefined,
    @Query() query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminLoadingRequestRow[]>> {
    return this.service.adminList(status, query);
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
}
