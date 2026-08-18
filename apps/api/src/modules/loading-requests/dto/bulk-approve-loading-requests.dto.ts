import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import type { BulkApproveLoadingRequestsInput } from '@cement/shared-types';

/**
 * حد بالای تعداد شناسه در یک درخواست تایید گروهی.
 *
 * کارتابل حداکثر ۱۰۰ ردیف در هر صفحه دارد و «انتخاب همه» فقط ردیف‌های همان صفحه
 * را می‌گیرد، پس ۱۰۰ سقفِ طبیعی است. محدودیت لازم است چون هر شناسه یک Transition
 * جداگانه (به‌همراه Notification) اجرا می‌کند و بدنهٔ بی‌حد می‌تواند درخواست را طولانی کند.
 */
export const BULK_APPROVE_MAX_IDS = 100;

/** بدنه تایید گروهی اعلام بار در کارتابل ادمین (فقط SUBMITTED → APPROVED). */
export class BulkApproveLoadingRequestsDto implements BulkApproveLoadingRequestsInput {
  @IsArray()
  @ArrayNotEmpty({ message: 'حداقل یک درخواست را انتخاب کنید' })
  @ArrayMaxSize(BULK_APPROVE_MAX_IDS, {
    message: `حداکثر ${BULK_APPROVE_MAX_IDS} درخواست در هر بار قابل تایید است`,
  })
  @IsString({ each: true })
  ids!: string[];
}
