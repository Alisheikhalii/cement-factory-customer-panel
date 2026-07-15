import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { AdminLoginRequest } from '@cement/shared-types';

/** ورود ادمین: شناسه دلخواه (نه کد ملی) + رمز عبور (بخش ۶.۱/۶.۲ PRD). */
export class AdminLoginDto implements AdminLoginRequest {
  @ApiProperty({ example: 'admin', description: 'نام کاربری ادمین (شناسه انتخابی)' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsString()
  @MinLength(6)
  password!: string;
}
