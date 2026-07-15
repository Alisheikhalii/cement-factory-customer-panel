import {
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { UpdateCustomerInput } from '@cement/shared-types';

/**
 * بدنه ویرایش مشتری (بخش ۹.۹.۲). کد ملی و کد تفصیل تغییرناپذیرند (هویت ورود).
 * همه فیلدها اختیاری‌اند (Patch جزئی).
 */
export class UpdateCustomerDto implements UpdateCustomerInput {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  economicCode?: string;

  @IsOptional()
  @IsMobilePhone('fa-IR', {}, { message: 'شماره موبایل نامعتبر است' })
  mobile?: string;

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
