import { Injectable } from '@nestjs/common';
import { SurveyStatus } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';

/**
 * ماشین حالت نظرسنجی (بخش ۸.۳ PRD).
 *
 * جدول انتقال مجاز:
 *   DRAFT     → PUBLISHED
 *   PUBLISHED → CLOSED
 *   CLOSED    → PUBLISHED (انتشار مجدد یک نظرسنجی بسته‌شده، طبق ۱۱.۱۰)
 *
 * تنها مرجع مجاز تغییر `status` نظرسنجی؛ هیچ‌جای دیگر نباید مستقیم Status را عوض کند.
 */
@Injectable()
export class SurveyStateMachine {
  private static readonly TRANSITIONS: Readonly<
    Record<SurveyStatus, readonly SurveyStatus[]>
  > = {
    [SurveyStatus.DRAFT]: [SurveyStatus.PUBLISHED],
    [SurveyStatus.PUBLISHED]: [SurveyStatus.CLOSED],
    [SurveyStatus.CLOSED]: [SurveyStatus.PUBLISHED],
  };

  canTransition(from: SurveyStatus, to: SurveyStatus): boolean {
    return SurveyStateMachine.TRANSITIONS[from].includes(to);
  }

  assertTransition(from: SurveyStatus, to: SurveyStatus): void {
    if (this.canTransition(from, to)) {
      return;
    }
    throw new AppException(
      'GENERIC_500',
      'تغییر وضعیت نظرسنجی در حالت فعلی مجاز نیست',
    );
  }
}
