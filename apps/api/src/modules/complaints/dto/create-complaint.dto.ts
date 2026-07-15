import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { CreateComplaintInput } from '@cement/shared-types';

/**
 * بدنه ثبت شکایت جدید (بخش ۹.۸). فقط موضوع و شرح؛ بدون پیوست (BR-22).
 * خالی بودن → COMPLAINT_001 در سرویس (برای پیام یکدست کاتالوگ خطا).
 */
export class CreateComplaintDto implements CreateComplaintInput {
  @IsString()
  @IsNotEmpty({ message: 'موضوع شکایت الزامی است' })
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty({ message: 'شرح شکایت الزامی است' })
  @MaxLength(2000)
  description!: string;
}
