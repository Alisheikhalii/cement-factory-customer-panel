import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { RejectLoadingRequestInput } from '@cement/shared-types';

/** بدنه رد درخواست توسط ادمین (BR-11: دلیل اجباری → خالی = ADMIN_002). */
export class RejectLoadingRequestDto implements RejectLoadingRequestInput {
  @IsString()
  @IsNotEmpty({ message: 'برای رد درخواست، ذکر دلیل الزامی است' })
  @MaxLength(500)
  reason!: string;
}
