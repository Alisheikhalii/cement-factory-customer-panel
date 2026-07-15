import { SurveyStatus } from '@cement/shared-types';
import type {
  ActiveSurveyDto,
  AdminSurveyListItem,
  SurveyHistoryItemDto,
  SurveyResultsDto,
} from '@cement/shared-types';
import type { Prisma } from '@prisma/client';
import type { SurveyWithQuestions } from './surveys.repository';

function toStatus(status: string): SurveyStatus {
  return SurveyStatus[status as keyof typeof SurveyStatus];
}

export function toActiveSurveyDto(survey: SurveyWithQuestions): ActiveSurveyDto {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

type SurveyAnswerWithSurvey = Prisma.SurveyAnswerGetPayload<{
  include: {
    survey: { include: { questions: { include: { options: true } } } };
    details: true;
  };
}>;

export function toSurveyHistoryItem(answer: SurveyAnswerWithSurvey): SurveyHistoryItemDto {
  const optionText = new Map<string, string>();
  const questionText = new Map<string, string>();
  for (const q of answer.survey.questions) {
    questionText.set(q.id, q.text);
    for (const o of q.options) {
      optionText.set(o.id, o.text);
    }
  }
  return {
    id: answer.survey.id,
    title: answer.survey.title,
    description: answer.survey.description,
    status: toStatus(answer.survey.status),
    submittedAt: answer.submittedAt.toISOString(),
    answers: answer.details.map((d) => ({
      questionId: d.questionId,
      questionText: questionText.get(d.questionId) ?? '',
      selectedOptionId: d.selectedOptionId,
      selectedOptionText: optionText.get(d.selectedOptionId) ?? '',
    })),
  };
}

export function toAdminSurveyListItem(
  survey: Prisma.SurveyGetPayload<{
    include: { _count: { select: { questions: true; answers: true } } };
  }>,
): AdminSurveyListItem {
  return {
    id: survey.id,
    title: survey.title,
    status: toStatus(survey.status),
    questionCount: survey._count.questions,
    answerCount: survey._count.answers,
    createdAt: survey.createdAt.toISOString(),
    publishedAt: survey.publishedAt ? survey.publishedAt.toISOString() : null,
    closedAt: survey.closedAt ? survey.closedAt.toISOString() : null,
  };
}

/** ساخت DTO نتایج آماری با محاسبه درصد هر گزینه (BR-27). */
export function buildSurveyResults(
  survey: SurveyWithQuestions,
  totalRespondents: number,
  counts: Array<{ selectedOptionId: string; count: number }>,
): SurveyResultsDto {
  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(c.selectedOptionId, c.count);
  }
  return {
    id: survey.id,
    title: survey.title,
    status: toStatus(survey.status),
    totalRespondents,
    questions: survey.questions.map((q) => ({
      questionId: q.id,
      text: q.text,
      options: q.options.map((o) => {
        const count = countMap.get(o.id) ?? 0;
        return {
          optionId: o.id,
          text: o.text,
          count,
          percentage: totalRespondents > 0 ? Math.round((count / totalRespondents) * 100) : 0,
        };
      }),
    })),
  };
}
