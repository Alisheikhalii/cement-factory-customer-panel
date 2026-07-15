import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';
import type { ForgotPasswordRequest, ResetPasswordRequest } from '@cement/shared-types';
import { IsIranianNationalId } from '../../../common/validators/is-iranian-national-id.validator';

/** شروع فراموشی رمز: شناسایی حساب با کد ملی (بخش ۶.۱ PRD). */
export class ForgotPasswordDto implements ForgotPasswordRequest {
  @ApiProperty({ example: '0013542419' })
  @IsIranianNationalId()
  nationalId!: string;
}

/** تایید OTP و تنظیم رمز جدید (بخش ۶.۱ PRD). */
export class ResetPasswordDto implements ResetPasswordRequest {
  @ApiProperty({ example: '0013542419' })
  @IsIranianNationalId()
  nationalId!: string;

  @ApiProperty({ example: '123456', description: 'کد یکبارمصرف ۶ رقمی' })
  @IsString()
  @Length(6, 6)
  otp!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' })
  newPassword!: string;
}
