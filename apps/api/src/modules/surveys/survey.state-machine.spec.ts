import { SurveyStatus } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { SurveyStateMachine } from './survey.state-machine';

/**
 * تست ماشین حالت نظرسنجی (بخش ۸.۳ PRD — فاز ۷e پوشش).
 * DRAFT→PUBLISHED→CLOSED→PUBLISHED مجاز؛ بقیه ممنوع.
 */
describe('SurveyStateMachine', () => {
  const sm = new SurveyStateMachine();

  it.each([
    [SurveyStatus.DRAFT, SurveyStatus.PUBLISHED],
    [SurveyStatus.PUBLISHED, SurveyStatus.CLOSED],
    [SurveyStatus.CLOSED, SurveyStatus.PUBLISHED],
  ])('انتقال مجاز: %s → %s', (from, to) => {
    expect(sm.canTransition(from, to)).toBe(true);
    expect(() => sm.assertTransition(from, to)).not.toThrow();
  });

  it.each([
    [SurveyStatus.DRAFT, SurveyStatus.CLOSED],
    [SurveyStatus.PUBLISHED, SurveyStatus.DRAFT],
    [SurveyStatus.CLOSED, SurveyStatus.DRAFT],
    [SurveyStatus.CLOSED, SurveyStatus.CLOSED],
  ])('انتقال ممنوع: %s → %s', (from, to) => {
    expect(sm.canTransition(from, to)).toBe(false);
    expect(() => sm.assertTransition(from, to)).toThrow(AppException);
  });
});
