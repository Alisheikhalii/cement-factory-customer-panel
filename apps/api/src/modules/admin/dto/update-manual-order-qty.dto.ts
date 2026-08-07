import { IsNumber, IsPositive } from 'class-validator';
import type { UpdateManualOrderQtyInput } from '@cement/shared-types';

/**
 * بدنه ویرایش مقدار سفارش دستی (Task 2 — فاز پایلوت).
 * قید «مقدار جدید >= مقدار تحویل‌شده» در سرویس بررسی می‌شود (نیاز به وضعیت فعلی رکورد).
 */
export class UpdateManualOrderQtyDto implements UpdateManualOrderQtyInput {
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'مقدار باید عدد باشد' })
  @IsPositive({ message: 'مقدار باید بزرگ‌تر از صفر باشد' })
  newTotalQty!: number;
}
