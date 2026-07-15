import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ActiveSurveyDto,
  AuthUser,
  SurveyHistoryItemDto,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { SubmitSurveyAnswerDto } from './dto/submit-survey-answer.dto';
import { SurveysService } from './surveys.service';

/**
 * کنترلر نظرسنجی مشتری (بخش ۱۱.۷) — نقش CUSTOMER.
 * مسیر: /api/v1/surveys
 */
@ApiTags('surveys')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('surveys')
export class SurveysController {
  constructor(private readonly service: SurveysService) {}

  @Get('active')
  @ApiOperation({ summary: 'نظرسنجی فعال در انتظار پاسخ (یا null)' })
  active(@CurrentUser() user: AuthUser): Promise<ActiveSurveyDto | null> {
    return this.service.active(requireCustomerId(user));
  }

  @Get('history')
  @ApiOperation({ summary: 'تاریخچه نظرسنجی‌های پاسخ‌داده‌شده' })
  history(@CurrentUser() user: AuthUser): Promise<SurveyHistoryItemDto[]> {
    return this.service.history(requireCustomerId(user));
  }

  @Post(':id/answer')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'ثبت پاسخ نظرسنجی (BR-19/BR-20)' })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: SubmitSurveyAnswerDto,
  ): Promise<{ ok: true }> {
    return this.service.submit(requireCustomerId(user), id, body);
  }
}
