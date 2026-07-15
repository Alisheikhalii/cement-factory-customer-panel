import { Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser, NotificationDto } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { NotificationQueryService } from './notification-query.service';

/**
 * کنترلر اعلانات مشتری (بخش ۱۱.۹) — نقش CUSTOMER.
 * مسیر: /api/v1/notifications
 */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationQueryService) {}

  @Get()
  @ApiOperation({ summary: 'لیست اعلان‌های مشتری (با فیلتر unreadOnly)' })
  list(
    @CurrentUser() user: AuthUser,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<NotificationDto[]> {
    return this.service.listForCustomer(requireCustomerId(user), unreadOnly === 'true');
  }

  @Patch(':id/read')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'علامت‌گذاری اعلان به‌عنوان خوانده‌شده' })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    await this.service.markReadForCustomer(requireCustomerId(user), id);
    return { ok: true };
  }
}
