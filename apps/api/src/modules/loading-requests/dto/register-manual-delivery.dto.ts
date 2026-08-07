import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import type { ManualDeliveryData } from '../loading-requests.service';

/**
 * بدنه ثبت دستی تحویل توسط ادمین (Task 3 — فاز پایلوت).
 *
 * ⚠️ عمداً هیچ فیلد مالی (فی پایه/مبلغ پایه/ارزش‌افزوده/مبلغ با عوامل) ندارد:
 * در فاز پایلوت ERP وصل نیست و پورتال قیمت‌گذاری نمی‌کند (BR-18). این فیلدها در
 * رکورد Delivery `null` می‌مانند — نه صفر — تا در جدول تحویل «—» نمایش داده شوند.
 */
export class RegisterManualDeliveryDto implements ManualDeliveryData {
  @IsString()
  @IsNotEmpty({ message: 'شماره توزین الزامی است' })
  @MaxLength(50)
  weighingNumber!: string;

  @IsDateString({}, { message: 'تاریخ تحویل معتبر نیست' })
  deliveryDate!: string;

  @IsOptional()
  @IsString()
  carrierId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  driverName?: string | null;

  @IsOptional()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل راننده معتبر نیست' })
  driverMobile?: string | null;

  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'مقدار تحویل باید عدد باشد' })
  @IsPositive({ message: 'مقدار تحویل باید بزرگ‌تر از صفر باشد' })
  deliveredQty!: number;
}
