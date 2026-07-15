import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { ChangePasswordRequest } from '@cement/shared-types';

/** تغییر رمز توسط کاربر لاگین‌شده (بخش ۱۱.۱ PRD). */
export class ChangePasswordDto implements ChangePasswordRequest {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'رمز جدید — حداقل ۶ کاراکتر' })
  @IsString()
  @MinLength(6, { message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' })
  newPassword!: string;
}
