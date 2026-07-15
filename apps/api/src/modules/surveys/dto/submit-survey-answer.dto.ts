import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import type { SubmitSurveyAnswerInput } from '@cement/shared-types';

class SurveyAnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  selectedOptionId!: string;
}

/** بدنه ثبت پاسخ نظرسنجی (بخش ۱۱.۷). اعتبار محتوایی کامل در سرویس (SURVEY_002). */
export class SubmitSurveyAnswerDto implements SubmitSurveyAnswerInput {
  @IsArray()
  @ArrayNotEmpty({ message: 'حداقل یک پاسخ لازم است' })
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerItemDto)
  answers!: SurveyAnswerItemDto[];
}
