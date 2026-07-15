import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ReplyComplaintInput } from '@cement/shared-types';

/** بدنه ثبت پاسخ به شکایت (بخش ۹.۹.۴). متن پاسخ اجباری. */
export class ReplyComplaintDto implements ReplyComplaintInput {
  @IsString()
  @IsNotEmpty({ message: 'متن پاسخ الزامی است' })
  @MaxLength(2000)
  reply!: string;
}
