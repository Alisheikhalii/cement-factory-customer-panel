import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { RejectLoadingRequestInput } from '@cement/shared-types';

/**
 * بدنه رد درخواست توسط ادمین.
 * ⚠️ BR-11 عمداً شل شد: دلیل رد اختیاری است (قبلاً @IsNotEmpty → ADMIN_002).
 * ادمین می‌تواند با یا بدون دلیل رد کند؛ اگر داده شود فقط طول آن محدود می‌ماند.
 */
export class RejectLoadingRequestDto implements RejectLoadingRequestInput {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
