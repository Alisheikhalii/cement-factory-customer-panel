import { Body, Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminComplaintDto, AuthUser } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { ReplyComplaintDto } from './dto/reply-complaint.dto';
import { AdminComplaintsService } from './admin-complaints.service';

/**
 * کنترلر شکایات ادمین (بخش ۹.۹.۴ / ۱۱.۱۰) — نقش ADMIN.
 * مسیر: /api/v1/admin/complaints
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/complaints')
export class AdminComplaintsController {
  constructor(private readonly service: AdminComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست همه شکایات همه مشتریان (با فیلتر وضعیت)' })
  list(
    @Query('status') status: string | undefined,
    @Query() query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminComplaintDto[]>> {
    return this.service.list(status, query);
  }

  @Patch(':id/reply')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'ثبت پاسخ نهایی به شکایت (PENDING → ANSWERED)' })
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: ReplyComplaintDto,
  ): Promise<AdminComplaintDto> {
    return this.service.reply(id, user.userId, user.fullName ?? user.username, body.reply);
  }
}
