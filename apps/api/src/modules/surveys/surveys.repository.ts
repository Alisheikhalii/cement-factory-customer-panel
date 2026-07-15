import { Injectable } from '@nestjs/common';
import { Prisma, SurveyStatus as PrismaSurveyStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SurveyWithQuestions = Prisma.SurveyGetPayload<{
  include: {
    questions: {
      include: { options: true };
    };
  };
}>;

/**
 * Repository نظرسنجی (بخش ۹.۷/۹.۹.۵).
 * ⚠️ سوالات/گزینه‌های حذف‌شده (isDeleted) فیلتر می‌شوند.
 */
@Injectable()
export class SurveyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly questionInclude = {
    questions: {
      where: { isDeleted: false },
      orderBy: { order: 'asc' as const },
      include: {
        options: {
          where: { isDeleted: false },
          orderBy: { order: 'asc' as const },
        },
      },
    },
  };

  /**
   * نظرسنجی فعال (PUBLISHED) که مشتری هنوز پاسخ نداده (بخش ۱۱.۷).
   * فقط یک نظرسنجی PUBLISHED در هر لحظه وجود دارد (BR-27).
   */
  async findActiveForCustomer(customerId: string): Promise<SurveyWithQuestions | null> {
    const published = await this.prisma.survey.findFirst({
      where: { status: PrismaSurveyStatus.PUBLISHED, isDeleted: false },
      orderBy: { publishedAt: 'desc' },
      include: this.questionInclude,
    });
    if (!published) {
      return null;
    }
    const alreadyAnswered = await this.prisma.surveyAnswer.findUnique({
      where: { surveyId_customerId: { surveyId: published.id, customerId } },
      select: { id: true },
    });
    return alreadyAnswered ? null : published;
  }

  /** نظرسنجی‌هایی که مشتری قبلاً پاسخ داده، همراه با پاسخ‌های ثبت‌شده (بخش ۱۱.۷). */
  findHistoryForCustomer(customerId: string): Promise<
    Array<
      Prisma.SurveyAnswerGetPayload<{
        include: {
          survey: { include: { questions: { include: { options: true } } } };
          details: true;
        };
      }>
    >
  > {
    return this.prisma.surveyAnswer.findMany({
      where: { customerId },
      orderBy: { submittedAt: 'desc' },
      include: {
        survey: { include: this.questionInclude },
        details: true,
      },
    });
  }

  /** بارگذاری نظرسنجی با سوالات/گزینه‌ها برای اعتبارسنجی ثبت پاسخ. */
  findByIdWithQuestions(id: string): Promise<SurveyWithQuestions | null> {
    return this.prisma.survey.findUnique({
      where: { id },
      include: this.questionInclude,
    });
  }

  findAnswer(surveyId: string, customerId: string): Promise<{ id: string } | null> {
    return this.prisma.surveyAnswer.findUnique({
      where: { surveyId_customerId: { surveyId, customerId } },
      select: { id: true },
    });
  }

  /**
   * ثبت اتمیک پاسخ نظرسنجی (SurveyAnswer + SurveyAnswerDetailها).
   * قید @@unique([surveyId, customerId]) مانع پاسخ تکراری در سطح DB است (BR-20).
   */
  async createAnswer(
    surveyId: string,
    customerId: string,
    details: Array<{ questionId: string; selectedOptionId: string }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const answer = await tx.surveyAnswer.create({
        data: { surveyId, customerId },
      });
      await tx.surveyAnswerDetail.createMany({
        data: details.map((d) => ({
          surveyAnswerId: answer.id,
          questionId: d.questionId,
          selectedOptionId: d.selectedOptionId,
        })),
      });
    });
  }

  // ==================== ادمین (بخش ۹.۹.۵) ====================

  /** لیست همه نظرسنجی‌ها با شمارش سوال/پاسخ (بخش ۹.۹.۵). */
  findAllForAdmin(status: string | undefined): Promise<
    Array<
      Prisma.SurveyGetPayload<{
        include: { _count: { select: { questions: true; answers: true } } };
      }>
    >
  > {
    const where: Prisma.SurveyWhereInput = { isDeleted: false };
    if (status) {
      where.status = status as Prisma.SurveyWhereInput['status'];
    }
    return this.prisma.survey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true, answers: true } } },
    });
  }

  /** ایجاد نظرسنجی جدید در وضعیت DRAFT با سوالات و گزینه‌های تودرتو. */
  async createSurvey(
    title: string,
    description: string | null,
    questions: Array<{ text: string; options: string[] }>,
  ): Promise<string> {
    const created = await this.prisma.survey.create({
      data: {
        title,
        description,
        status: PrismaSurveyStatus.DRAFT,
        questions: {
          create: questions.map((q, qi) => ({
            text: q.text,
            order: qi,
            options: {
              create: q.options.map((text, oi) => ({ text, order: oi })),
            },
          })),
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  findMeta(id: string): Promise<{ id: string; status: string; title: string } | null> {
    return this.prisma.survey.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, status: true, title: true },
    });
  }

  /** انتشار: بستن نظرسنجی PUBLISHED قبلی و انتشار این یکی، اتمیک (BR-27). */
  async publish(id: string, now: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.survey.updateMany({
        where: { status: PrismaSurveyStatus.PUBLISHED, isDeleted: false, id: { not: id } },
        data: { status: PrismaSurveyStatus.CLOSED, closedAt: now },
      }),
      this.prisma.survey.update({
        where: { id },
        data: { status: PrismaSurveyStatus.PUBLISHED, publishedAt: now, closedAt: null },
      }),
    ]);
  }

  async close(id: string, now: Date): Promise<void> {
    await this.prisma.survey.update({
      where: { id },
      data: { status: PrismaSurveyStatus.CLOSED, closedAt: now },
    });
  }

  /** نتایج آماری: تعداد انتخاب هر گزینه + تعداد کل پاسخ‌دهندگان (BR-27). */
  async results(id: string): Promise<{
    survey: SurveyWithQuestions | null;
    totalRespondents: number;
    counts: Array<{ selectedOptionId: string; count: number }>;
  }> {
    const [survey, totalRespondents, grouped] = await Promise.all([
      this.findByIdWithQuestions(id),
      this.prisma.surveyAnswer.count({ where: { surveyId: id } }),
      this.prisma.surveyAnswerDetail.groupBy({
        by: ['selectedOptionId'],
        where: { surveyAnswer: { surveyId: id } },
        _count: { selectedOptionId: true },
      }),
    ]);
    return {
      survey,
      totalRespondents,
      counts: grouped.map((g) => ({
        selectedOptionId: g.selectedOptionId,
        count: g._count.selectedOptionId,
      })),
    };
  }

  /** نظرسنجی فعال + تعداد پاسخ‌ها برای KPI داشبورد ادمین (۹.۹.۱). */
  async activeSurveyKpi(): Promise<{ id: string; title: string; answerCount: number } | null> {
    const survey = await this.prisma.survey.findFirst({
      where: { status: PrismaSurveyStatus.PUBLISHED, isDeleted: false },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, _count: { select: { answers: true } } },
    });
    if (!survey) {
      return null;
    }
    return { id: survey.id, title: survey.title, answerCount: survey._count.answers };
  }
}
