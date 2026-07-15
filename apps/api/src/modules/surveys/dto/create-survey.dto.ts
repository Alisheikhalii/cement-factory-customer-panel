import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { CreateSurveyInput } from '@cement/shared-types';

class CreateSurveyQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'متن سوال الزامی است' })
  @MaxLength(300)
  text!: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'هر سوال باید حداقل دو گزینه داشته باشد' })
  @IsString({ each: true })
  options!: string[];
}

/** بدنه ایجاد نظرسنجی جدید (فرم‌ساز ۹.۹.۵). ذخیره اولیه در وضعیت DRAFT. */
export class CreateSurveyDto implements CreateSurveyInput {
  @IsString()
  @IsNotEmpty({ message: 'عنوان نظرسنجی الزامی است' })
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'نظرسنجی باید حداقل یک سوال داشته باشد' })
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions!: CreateSurveyQuestionDto[];
}
