import { Injectable } from '@nestjs/common';
import { SurveyStatus } from '@cement/shared-types';
import type {
  ActiveSurveyDto,
  SubmitSurveyAnswerInput,
  SurveyHistoryItemDto,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { SurveyRepository } from './surveys.repository';
import { toActiveSurveyDto, toSurveyHistoryItem } from './surveys.mapper';

/**
 * سرویس نظرسنجی سمت مشتری (بخش ۹.۷، BR-19..BR-20).
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲).
 */
@Injectable()
export class SurveysService {
  constructor(private readonly repo: SurveyRepository) {}

  /** نظرسنجی فعال در انتظار پاسخ (PUBLISHED و پاسخ‌نداده) یا null. */
  async active(customerId: string): Promise<ActiveSurveyDto | null> {
    const survey = await this.repo.findActiveForCustomer(customerId);
    return survey ? toActiveSurveyDto(survey) : null;
  }

  /** تاریخچه نظرسنجی‌های پاسخ‌داده‌شده مشتری (Read Only). */
  async history(customerId: string): Promise<SurveyHistoryItemDto[]> {
    const answers = await this.repo.findHistoryForCustomer(customerId);
    return answers.map(toSurveyHistoryItem);
  }

  /**
   * ثبت پاسخ نظرسنجی (بخش ۱۱.۷). اعتبارسنجی‌ها به ترتیب:
   *  - نظرسنجی وجود دارد و PUBLISHED است (SURVEY_003).
   *  - مشتری قبلاً پاسخ نداده (SURVEY_001، BR-20).
   *  - به همه سوالات پاسخ داده شده و هر گزینه متعلق به همان سوال است (SURVEY_002).
   */
  async submit(
    customerId: string,
    surveyId: string,
    input: SubmitSurveyAnswerInput,
  ): Promise<{ ok: true }> {
    const survey = await this.repo.findByIdWithQuestions(surveyId);
    if (!survey || survey.isDeleted || survey.status !== SurveyStatus.PUBLISHED) {
      throw new AppException('SURVEY_003');
    }

    const existing = await this.repo.findAnswer(surveyId, customerId);
    if (existing) {
      throw new AppException('SURVEY_001');
    }

    // نگاشت سوال → مجموعه گزینه‌های معتبر آن.
    const validOptions = new Map<string, Set<string>>();
    for (const q of survey.questions) {
      validOptions.set(q.id, new Set(q.options.map((o) => o.id)));
    }

    const answered = new Map<string, string>();
    for (const a of input.answers ?? []) {
      answered.set(a.questionId, a.selectedOptionId);
    }

    // همه سوالات باید دقیقاً یک پاسخ معتبر داشته باشند (SURVEY_002).
    if (answered.size !== survey.questions.length) {
      throw new AppException('SURVEY_002');
    }
    for (const q of survey.questions) {
      const selected = answered.get(q.id);
      if (!selected || !validOptions.get(q.id)?.has(selected)) {
        throw new AppException('SURVEY_002');
      }
    }

    await this.repo.createAnswer(
      surveyId,
      customerId,
      survey.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answered.get(q.id) as string,
      })),
    );

    return { ok: true };
  }
}
