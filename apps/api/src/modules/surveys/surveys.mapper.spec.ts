import { SurveyStatus } from '@cement/shared-types';
import { buildSurveyResults } from './surveys.mapper';
import type { SurveyWithQuestions } from './surveys.repository';

/**
 * تست محاسبه نتایج آماری نظرسنجی (BR-27 — فاز ۷e پوشش).
 * فقط بخش «منطق خالص» (شمارش/درصد) — نگاشت‌های مستقیم Prisma در تست‌های
 * سرویس/E2E پوشش داده می‌شوند.
 */
describe('buildSurveyResults', () => {
  const survey = {
    id: 's1',
    title: 'نظرسنجی رضایت',
    status: SurveyStatus.PUBLISHED,
    questions: [
      {
        id: 'q1',
        text: 'کیفیت محصول؟',
        options: [
          { id: 'o1', text: 'عالی' },
          { id: 'o2', text: 'خوب' },
          { id: 'o3', text: 'ضعیف' },
        ],
      },
    ],
  } as unknown as SurveyWithQuestions;

  it('درصد هر گزینه نسبت به کل پاسخ‌دهندگان و گرد شده محاسبه می‌شود', () => {
    const results = buildSurveyResults(survey, 3, [
      { selectedOptionId: 'o1', count: 2 },
      { selectedOptionId: 'o2', count: 1 },
    ]);
    const options = results.questions[0]?.options ?? [];
    expect(options.map((o) => ({ id: o.optionId, count: o.count, pct: o.percentage }))).toEqual([
      { id: 'o1', count: 2, pct: 67 },
      { id: 'o2', count: 1, pct: 33 },
      { id: 'o3', count: 0, pct: 0 },
    ]);
    expect(results.totalRespondents).toBe(3);
  });

  it('بدون پاسخ‌دهنده → درصدها صفر (بدون تقسیم بر صفر)', () => {
    const results = buildSurveyResults(survey, 0, []);
    for (const option of results.questions[0]?.options ?? []) {
      expect(option.percentage).toBe(0);
      expect(option.count).toBe(0);
    }
  });
});
