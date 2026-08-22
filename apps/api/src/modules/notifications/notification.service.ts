import { Injectable } from '@nestjs/common';
import {
  ComplaintEventPayload,
  CustomerCreatedEventPayload,
  LoadingRequestEventPayload,
  NotificationEvent,
  ReceiptEventPayload,
  SurveyEventPayload,
} from './notification-events';
import { NotificationRepository } from './notification.repository';

/**
 * سرویس مرکزی اعلانات (بخش ۱۷ PRD).
 *
 * تنها نقطه‌ای که تصمیم می‌گیرد هر رویداد به «مشتری» یا «همه ادمین‌ها» برود.
 * ماژول‌های کسب‌وکاری فقط `emit(event, payload)` را صدا می‌زنند و از منطق
 * مقصد بی‌خبرند — تا این منطق در کد پخش/تکرار نشود.
 */
@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  async emitLoadingRequest(
    event: NotificationEvent,
    payload: LoadingRequestEventPayload,
  ): Promise<void> {
    switch (event) {
      case NotificationEvent.LOADING_REQUEST_SUBMITTED:
        await this.repo.createForAdmins(
          'درخواست اعلام بار جدید',
          `درخواست اعلام بار جدید از ${payload.customerName} در انتظار بررسی است`,
        );
        return;

      case NotificationEvent.LOADING_REQUEST_APPROVED:
        await this.repo.createForCustomer(
          payload.customerId,
          'تایید اعلام بار',
          `درخواست اعلام بار شماره ${payload.requestNumber} شما تایید شد`,
        );
        return;

      case NotificationEvent.LOADING_REQUEST_REJECTED:
        await this.repo.createForCustomer(
          payload.customerId,
          'رد اعلام بار',
          // دلیل رد اختیاری است (BR-11 شل شد): اگر خالی باشد فقط جملهٔ پایه بدون
          // «: » معلق نمایش داده می‌شود، نه «null/undefined».
          payload.reason
            ? `درخواست اعلام بار شماره ${payload.requestNumber} شما رد شد: ${payload.reason}`
            : `درخواست اعلام بار شماره ${payload.requestNumber} شما رد شد.`,
        );
        return;

      case NotificationEvent.LOADING_REQUEST_CANCELED:
        await this.repo.createForAdmins(
          'لغو اعلام بار',
          `مشتری ${payload.customerName} درخواست شماره ${payload.requestNumber} را لغو کرد`,
        );
        return;

      case NotificationEvent.LOADING_REQUEST_LOADED:
        await this.repo.createForCustomer(
          payload.customerId,
          'بارگیری انجام شد',
          `بارگیری درخواست شماره ${payload.requestNumber} شما انجام شد`,
        );
        return;

      default: {
        // این متد فقط رویدادهای اعلام بار را می‌پذیرد؛ سایر رویدادها متد
        // اختصاصی خود را دارند (emitComplaint*, emitSurvey*, ...).
        throw new Error(`رویداد اعلام بار پشتیبانی‌نشده: ${String(event)}`);
      }
    }
  }

  /** ثبت شکایت جدید → همه ادمین‌ها (بخش ۱۷). */
  async emitComplaintSubmitted(payload: ComplaintEventPayload): Promise<void> {
    await this.repo.createForAdmins(
      'شکایت جدید',
      `شکایت جدید از ${payload.customerName} ثبت شد`,
    );
  }

  /** پاسخ به شکایت → همان مشتری (بخش ۱۷). */
  async emitComplaintAnswered(customerId: string): Promise<void> {
    await this.repo.createForCustomer(
      customerId,
      'پاسخ به شکایت',
      'به شکایت شما پاسخ داده شد',
    );
  }

  /** انتشار نظرسنجی جدید → همه مشتریان فعال (Broadcast مشتری، بخش ۱۷). */
  async emitSurveyPublished(payload: SurveyEventPayload): Promise<void> {
    await this.repo.createForAllActiveCustomers(
      'نظرسنجی جدید',
      `نظرسنجی «${payload.surveyTitle}» منتظر پاسخ شماست`,
    );
  }

  /** بارگذاری فیش واریزی توسط مشتری → همه ادمین‌ها (بخش ۱۷). */
  async emitReceiptUploaded(payload: ReceiptEventPayload): Promise<void> {
    await this.repo.createForAdmins(
      'فیش واریزی جدید',
      `فیش واریزی جدید از ${payload.customerName} بارگذاری شد`,
    );
  }

  /** ایجاد مشتری جدید توسط ادمین → سایر ادمین‌ها (بخش ۱۷). */
  async emitCustomerCreated(payload: CustomerCreatedEventPayload): Promise<void> {
    await this.repo.createForAdmins(
      'مشتری جدید',
      `مشتری جدید ${payload.customerName} توسط ${payload.adminName} ایجاد شد`,
    );
  }
}
