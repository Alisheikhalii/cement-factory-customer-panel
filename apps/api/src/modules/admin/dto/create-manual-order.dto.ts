import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import type { CreateManualOrderInput } from '@cement/shared-types';

/**
 * بدنه ثبت دستی سفارش توسط ادمین (Task 2 — فاز پایلوت).
 * فقط محصول و مقدار؛ فیلدهای مالی در فاز پایلوت وجود ندارند (از ERP می‌آیند).
 */
export class CreateManualOrderDto implements CreateManualOrderInput {
  @IsString()
  @IsNotEmpty({ message: 'انتخاب مشتری الزامی است' })
  customerId!: string;

  @IsString()
  @IsNotEmpty({ message: 'انتخاب محصول الزامی است' })
  productId!: string;

  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'مقدار باید عدد باشد' })
  @IsPositive({ message: 'مقدار باید بزرگ‌تر از صفر باشد' })
  totalQty!: number;
}
