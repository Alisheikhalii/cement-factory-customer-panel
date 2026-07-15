import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { AdminSurveysController } from './admin-surveys.controller';
import { SurveysService } from './surveys.service';
import { AdminSurveysService } from './admin-surveys.service';
import { SurveyRepository } from './surveys.repository';
import { SurveyStateMachine } from './survey.state-machine';

/**
 * ماژول نظرسنجی (فاز ۴ مشتری + فاز ۴.۵ ادمین).
 * State Machine بخش ۸.۳: DRAFT → PUBLISHED → CLOSED (با انتشار مجدد CLOSED→PUBLISHED).
 * Repository صادر می‌شود تا داشبورد ادمین KPI نظرسنجی فعال را بخواند.
 */
@Module({
  controllers: [SurveysController, AdminSurveysController],
  providers: [SurveysService, AdminSurveysService, SurveyRepository, SurveyStateMachine],
  exports: [SurveyRepository],
})
export class SurveysModule {}
