import { Injectable } from '@nestjs/common';
import { LoadingRequestStatus } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';

/**
 * ماشین حالت درخواست اعلام بار (بخش ۸.۱ PRD).
 *
 * تنها مرجع مجاز تغییر `status`؛ هیچ‌جای دیگر کد نباید مستقیم Status را عوض کند
 * (جلوگیری از Bug ناشی از تغییر دستی در چند نقطه — instruction.md §2 / بخش ۸.۱).
 *
 * جدول انتقال مجاز:
 *   SUBMITTED → APPROVED | REJECTED | CANCELED
 *   APPROVED  → LOADED   | CANCELED
 *   REJECTED  → SUBMITTED  (فقط با «ویرایش و ارسال مجدد» توسط خودِ مشتری)
 *   (LOADED, CANCELED پایانی هستند)
 *
 * ⚠️ `REJECTED → SUBMITTED` تنها انتقال «برگشتی» جدول است: مشتری علتِ رد را اصلاح
 * می‌کند و همان رکورد (با همان `requestNumber`) دوباره به کارتابل ادمین می‌رود، پس
 * تاریخچه‌اش قابل پیگیری می‌ماند. رکورد جدید ساخته نمی‌شود.
 */
@Injectable()
export class LoadingRequestStateMachine {
  private static readonly TRANSITIONS: Readonly<
    Record<LoadingRequestStatus, readonly LoadingRequestStatus[]>
  > = {
    [LoadingRequestStatus.SUBMITTED]: [
      LoadingRequestStatus.APPROVED,
      LoadingRequestStatus.REJECTED,
      LoadingRequestStatus.CANCELED,
    ],
    [LoadingRequestStatus.APPROVED]: [
      LoadingRequestStatus.LOADED,
      LoadingRequestStatus.CANCELED,
    ],
    [LoadingRequestStatus.REJECTED]: [LoadingRequestStatus.SUBMITTED],
    [LoadingRequestStatus.LOADED]: [],
    [LoadingRequestStatus.CANCELED]: [],
  };

  /** آیا انتقال from→to طبق جدول بخش ۸.۱ مجاز است؟ */
  canTransition(from: LoadingRequestStatus, to: LoadingRequestStatus): boolean {
    return LoadingRequestStateMachine.TRANSITIONS[from].includes(to);
  }

  /**
   * انتقال را اعتبارسنجی می‌کند و در صورت غیرمجاز بودن، خطای مناسب پرتاب می‌کند.
   * - تلاش برای لغو درخواست LOADED → LOAD_004 (BR-10، HTTP 409).
   * - سایر انتقال‌های غیرمجاز (مثلاً تایید درخواستی که دیگر SUBMITTED نیست) هم
   *   یک تعارض وضعیت است → HTTP 409 با پیام فارسی مشخص (کد LOAD_004 با پیام Override؛
   *   استفاده از GENERIC_500 نادرست بود چون خطای سرور نیست بلکه تعارض حالت است).
   */
  assertTransition(
    from: LoadingRequestStatus,
    to: LoadingRequestStatus,
  ): void {
    if (this.canTransition(from, to)) {
      return;
    }
    // مورد ویژه BR-10: لغو یک درخواست بارگیری‌شده باید پیام اختصاصی بدهد.
    if (to === LoadingRequestStatus.CANCELED && from === LoadingRequestStatus.LOADED) {
      throw new AppException('LOAD_004');
    }
    throw new AppException(
      'LOAD_004',
      `این عملیات روی درخواست در وضعیت فعلی مجاز نیست`,
    );
  }
}
