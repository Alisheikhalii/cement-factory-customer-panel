import { IsNumberString, IsOptional, MaxLength } from 'class-validator';

/**
 * فیلدهای متادیتای فیش واریزی (بخش ۹.۳؛ خودِ فایل به‌صورت multipart جدا می‌آید).
 * amount اختیاری است؛ رشته عددی که در سرویس به Decimal تبدیل می‌شود.
 */
export class CreateReceiptDto {
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @MaxLength(500)
  description?: string;
}
