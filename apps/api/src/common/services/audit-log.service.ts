import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ورودی ثبت یک رویداد در AuditLog (بخش ۵ و ۱۳ PRD).
 * `actorName`/`subjectName` صرفاً برای تولید متن فید فعالیت (۹.۹.۱) استفاده می‌شوند
 * و در `newValue` ذخیره می‌شوند تا Mapping بدون Join اضافه ممکن باشد.
 */
export interface AuditLogInput {
  userId?: string | null;
  userRole?: 'CUSTOMER' | 'ADMIN' | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
  /** نام کاربر انجام‌دهنده (برای متن فید). */
  actorName?: string;
  /** نام موجودیت مرتبط، مثلاً نام مشتری (برای متن فید). */
  subjectName?: string;
  /** شماره مرجع مثل شماره اعلام بار (برای متن فید). */
  ref?: string;
}

/**
 * سرویس مرکزی AuditLog (instruction.md §2: هرگز PrismaClient مستقیم در Service دیگر).
 * علاوه بر نوشتن، دیکشنری Mapping اکشن → متن فارسی خوانا را نگه می‌دارد تا فید
 * Latest Activities (۹.۹.۱) در Backend ساخته شود، نه Hardcode در Frontend.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    const meta: Record<string, unknown> = {};
    if (input.actorName) meta.actorName = input.actorName;
    if (input.subjectName) meta.subjectName = input.subjectName;
    if (input.ref) meta.ref = input.ref;

    const newValue =
      input.newValue !== undefined
        ? ({ ...(input.newValue as object), ...meta } as Prisma.InputJsonValue)
        : (meta as Prisma.InputJsonValue);

    await this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        userRole: input.userRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        previousValue: input.previousValue,
        newValue,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  /** ۲۰ رویداد آخر برای فید فعالیت ادمین (۹.۹.۱ بخش ۲). */
  async latest(limit: number): Promise<
    Array<{ id: string; action: string; newValue: Prisma.JsonValue; createdAt: Date }>
  > {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, action: true, newValue: true, createdAt: true },
    });
  }

  /**
   * تبدیل یک رکورد AuditLog به متن فارسی خوانا (۹.۹.۱).
   * Mapping اینجا در Backend است، نه Frontend (طبق تاکید PRD).
   */
  static toActivityText(action: string, value: Prisma.JsonValue): string {
    const meta = (value ?? {}) as { actorName?: string; subjectName?: string; ref?: string };
    const actor = meta.actorName ?? 'کاربر';
    const subject = meta.subjectName ?? '';
    const ref = meta.ref ?? '';
    switch (action) {
      case 'LOADING_REQUEST_SUBMIT':
        return `مشتری ${subject} درخواست اعلام بار شماره ${ref} ثبت کرد`;
      case 'LOADING_REQUEST_APPROVE':
        return `ادمین ${actor} درخواست شماره ${ref} را تایید کرد`;
      case 'LOADING_REQUEST_REJECT':
        return `ادمین ${actor} درخواست شماره ${ref} را رد کرد`;
      case 'LOADING_REQUEST_CANCEL':
        return `مشتری ${subject} درخواست شماره ${ref} را لغو کرد`;
      case 'COMPLAINT_SUBMIT':
        return `مشتری ${subject} شکایت جدید ثبت کرد`;
      case 'COMPLAINT_REPLY':
        return `ادمین ${actor} به شکایت مشتری ${subject} پاسخ داد`;
      case 'RECEIPT_UPLOAD':
        return `مشتری ${subject} فیش واریزی بارگذاری کرد`;
      case 'CUSTOMER_CREATE':
        return `ادمین ${actor} مشتری جدید ${subject} را ایجاد کرد`;
      case 'CUSTOMER_DELETE':
        return `ادمین ${actor} مشتری ${subject} را حذف کرد`;
      case 'SURVEY_PUBLISH':
        return `ادمین ${actor} نظرسنجی «${ref}» را منتشر کرد`;
      default:
        return `${action}`;
    }
  }
}
