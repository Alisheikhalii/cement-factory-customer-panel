import {
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { CreateCustomerInput } from '@cement/shared-types';
import { IsIranianNationalId } from '../../../common/validators/is-iranian-national-id.validator';

/**
 * بدنه ایجاد مشتری جدید توسط ادمین (بخش ۹.۹.۲، BR-26/BR-28).
 * کد ملی → Username ورود مشتری می‌شود؛ اعتبارسنجی کد ملی ایرانی.
 * تکراری بودن (ADMIN_001) در سرویس بررسی می‌شود.
 */
export class CreateCustomerDto implements CreateCustomerInput {
  @IsString()
  @IsNotEmpty({ message: 'کد تفصیل الزامی است' })
  @MaxLength(50)
  customerCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'نام مشتری الزامی است' })
  @MaxLength(200)
  name!: string;

  @IsIranianNationalId({ message: 'کد ملی معتبر نیست' })
  nationalId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  economicCode?: string;

  @IsMobilePhone('fa-IR', {}, { message: 'شماره موبایل نامعتبر است' })
  mobile!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsNumber({}, { message: 'سقف اعتباری باید عدد باشد' })
  @Min(0)
  creditLimit?: number;
}
