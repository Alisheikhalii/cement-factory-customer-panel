import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminSurveyListItem,
  AuthUser,
  SurveyResultsDto,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { AdminSurveysService } from './admin-surveys.service';

/**
 * کنترلر نظرسنجی ادمین (بخش ۹.۹.۵ / ۱۱.۱۰) — نقش ADMIN.
 * مسیر: /api/v1/admin/surveys
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/surveys')
export class AdminSurveysController {
  constructor(private readonly service: AdminSurveysService) {}

  @Get()
  @ApiOperation({ summary: 'لیست همه نظرسنجی‌ها (با فیلتر وضعیت)' })
  list(@Query('status') status?: string): Promise<AdminSurveyListItem[]> {
    return this.service.list(status);
  }

  @Post()
  @WriteThrottle()
  @ApiOperation({ summary: 'ایجاد نظرسنجی جدید (DRAFT، BR-27)' })
  create(@Body() body: CreateSurveyDto): Promise<{ id: string }> {
    return this.service.create(body);
  }

  @Patch(':id/publish')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'انتشار نظرسنجی (بستن خودکار نظرسنجی قبلی)' })
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.service.publish(id, user.fullName ?? user.username);
  }

  @Patch(':id/close')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'بستن دستی نظرسنجی (→ CLOSED)' })
  close(@Param('id') id: string): Promise<{ ok: true }> {
    return this.service.close(id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'نتایج آماری نظرسنجی به تفکیک سوال/گزینه (BR-27)' })
  results(@Param('id') id: string): Promise<SurveyResultsDto> {
    return this.service.results(id);
  }
}
