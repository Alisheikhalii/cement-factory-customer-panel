import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ContactMessageInput } from '@cement/shared-types';

/**
 * بدنهٔ فرم «تماس با ما» عمومی (بخش ۹.۱۰.۴).
 * بدون Auth، بدون ذخیره در DB/AuditLog — فقط تبدیل به یک ایمیل.
 * محدودیت طول برای جلوگیری از سوءاستفاده/Spam.
 */
export class ContactMessageDto implements ContactMessageInput {
  @IsString()
  @IsNotEmpty({ message: 'نام الزامی است' })
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'راه ارتباطی (موبایل یا ایمیل) الزامی است' })
  @MaxLength(120)
  phoneOrEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  @MaxLength(2000)
  message!: string;
}
