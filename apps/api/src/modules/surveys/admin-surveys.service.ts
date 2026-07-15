import { Injectable } from '@nestjs/common';
import { SurveyStatus } from '@cement/shared-types';
import type {
  AdminSurveyListItem,
  CreateSurveyInput,
  SurveyResultsDto,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { NotificationService } from '../notifications/notification.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { SurveyRepository } from './surveys.repository';
import { SurveyStateMachine } from './survey.state-machine';
import { buildSurveyResults, toAdminSurveyListItem } from './surveys.mapper';

/**
 * سرویس نظرسنجی سمت ادمین (بخش ۹.۹.۵). فرم‌ساز + انتشار/بستن + نتایج آماری.
 * تغییر وضعیت فقط از طریق SurveyStateMachine (بخش ۸.۳).
 */
@Injectable()
export class AdminSurveysService {
  constructor(
    private readonly repo: SurveyRepository,
    private readonly stateMachine: SurveyStateMachine,
    private readonly notifications: NotificationService,
    private readonly audit: AuditLogService,
  ) {}

  async list(status: string | undefined): Promise<AdminSurveyListItem[]> {
    const rows = await this.repo.findAllForAdmin(status);
    return rows.map(toAdminSurveyListItem);
  }

  /**
   * ایجاد نظرسنجی جدید (وضعیت DRAFT). اعتبارسنجی: حداقل یک سوال، هر سوال حداقل
   * دو گزینه (۹.۹.۵).
   */
  async create(input: CreateSurveyInput): Promise<{ id: string }> {
    const title = input.title?.trim() ?? '';
    if (title === '') {
      throw new AppException('GENERIC_500', 'عنوان نظرسنجی الزامی است');
    }
    if (!input.questions || input.questions.length === 0) {
      throw new AppException('GENERIC_500', 'نظرسنجی باید حداقل یک سوال داشته باشد');
    }
    for (const q of input.questions) {
      const validOptions = (q.options ?? []).map((o) => o.trim()).filter((o) => o !== '');
      if (!q.text?.trim()) {
        throw new AppException('GENERIC_500', 'متن سوال الزامی است');
      }
      if (validOptions.length < 2) {
        throw new AppException('GENERIC_500', 'هر سوال باید حداقل دو گزینه داشته باشد');
      }
    }

    const id = await this.repo.createSurvey(
      title,
      input.description?.trim() || null,
      input.questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()).filter((o) => o !== ''),
      })),
    );
    return { id };
  }

  /**
   * انتشار نظرسنجی (DRAFT/CLOSED → PUBLISHED). نظرسنجی PUBLISHED قبلی خودکار بسته
   * می‌شود (BR-27). سپس اعلان Broadcast به همه مشتریان فعال (بخش ۱۷).
   */
  async publish(id: string, adminName: string): Promise<{ ok: true }> {
    const survey = await this.requireSurvey(id);
    this.stateMachine.assertTransition(
      survey.status as SurveyStatus,
      SurveyStatus.PUBLISHED,
    );

    const now = new Date();
    await this.repo.publish(id, now);

    await this.notifications.emitSurveyPublished({ surveyTitle: survey.title });
    await this.audit.log({
      userRole: 'ADMIN',
      action: 'SURVEY_PUBLISH',
      entityType: 'Survey',
      entityId: id,
      actorName: adminName,
      ref: survey.title,
    });

    return { ok: true };
  }

  /** بستن دستی نظرسنجی (PUBLISHED → CLOSED). */
  async close(id: string): Promise<{ ok: true }> {
    const survey = await this.requireSurvey(id);
    this.stateMachine.assertTransition(survey.status as SurveyStatus, SurveyStatus.CLOSED);
    await this.repo.close(id, new Date());
    return { ok: true };
  }

  /** نتایج آماری یک نظرسنجی (BR-27). */
  async results(id: string): Promise<SurveyResultsDto> {
    const { survey, totalRespondents, counts } = await this.repo.results(id);
    if (!survey || survey.isDeleted) {
      throw new AppException('SURVEY_003');
    }
    return buildSurveyResults(survey, totalRespondents, counts);
  }

  private async requireSurvey(id: string): Promise<{ id: string; status: string; title: string }> {
    const survey = await this.repo.findMeta(id);
    if (!survey) {
      throw new AppException('SURVEY_003');
    }
    return survey;
  }
}
