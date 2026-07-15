import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { CustomerLoginRequest } from '@cement/shared-types';
import { IsIranianNationalId } from '../../../common/validators/is-iranian-national-id.validator';

/** ورود مشتری: کد ملی (Username) + رمز عبور (بخش ۶.۱ و ۹.۱ PRD). */
export class CustomerLoginDto implements CustomerLoginRequest {
  @ApiProperty({ example: '0013542419', description: 'کد ملی ۱۰ رقمی (Username مشتری)' })
  @IsIranianNationalId()
  nationalId!: string;

  @ApiProperty({ example: 'Customer@12345' })
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;
}
