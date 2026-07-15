import { Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { NotificationDto } from '@cement/shared-types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { NotificationQueryService } from './notification-query.service';

/**
 * کنترلر اعلانات ادمین (Notification Center — بخش ۹.۹.۱ بخش ۵) — نقش ADMIN.
 * مسیر: /api/v1/admin/notifications — فقط Broadcast ادمین (customerId=null).
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: NotificationQueryService) {}

  @Get()
  @ApiOperation({ summary: 'لیست اعلان‌های ادمین' })
  list(@Query('unreadOnly') unreadOnly?: string): Promise<NotificationDto[]> {
    return this.service.listForAdmin(unreadOnly === 'true');
  }

  @Patch(':id/read')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'علامت‌گذاری اعلان ادمین به‌عنوان خوانده‌شده' })
  async markRead(@Param('id') id: string): Promise<{ ok: true }> {
    await this.service.markReadForAdmin(id);
    return { ok: true };
  }
}
