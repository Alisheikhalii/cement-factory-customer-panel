/**
 * DTOهای تعاملی سمت مشتری — نظرسنجی، شکایات، اعلانات (بخش ۹.۷/۹.۸/۱۱.۷/۱۱.۸/۱۱.۹).
 * منبع واحد قرارداد Front/Back (instruction.md §3).
 * قرارداد سریال‌سازی: تاریخ‌ها → ISO string.
 */

import type { ComplaintStatus, SurveyStatus } from './enums';

// ==================== SURVEY (۱۱.۷ / ۹.۷) ====================

export interface SurveyOptionDto {
  id: string;
  text: string;
}

export interface SurveyQuestionDto {
  id: string;
  text: string;
  options: SurveyOptionDto[];
}

/** نظرسنجی فعال در انتظار پاسخ مشتری (وضعیت PUBLISHED، پاسخ‌نداده). */
export interface ActiveSurveyDto {
  id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestionDto[];
}

/** پاسخ ثبت‌شده مشتری به یک سوال (برای نمای تاریخچه). */
export interface SurveyHistoryAnswerDto {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  selectedOptionText: string;
}

/** یک نظرسنجی پاسخ‌داده‌شده در تاریخچه مشتری. */
export interface SurveyHistoryItemDto {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  submittedAt: string;
  answers: SurveyHistoryAnswerDto[];
}

/** بدنه ثبت پاسخ نظرسنجی توسط مشتری (BR-19/BR-20). */
export interface SubmitSurveyAnswerInput {
  answers: Array<{ questionId: string; selectedOptionId: string }>;
}

// ==================== COMPLAINT (۱۱.۸ / ۹.۸) ====================

export interface ComplaintDto {
  id: string;
  subject: string;
  description: string;
  submittedAt: string;
  status: ComplaintStatus;
  reply: string | null;
  repliedAt: string | null;
}

/** بدنه ثبت شکایت جدید (subject + description؛ بدون پیوست — BR-22). */
export interface CreateComplaintInput {
  subject: string;
  description: string;
}

// ==================== NOTIFICATION (۱۱.۹) ====================

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
