import {
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { LoadType, VehicleType } from '@cement/shared-types';
import type { CreateLoadingRequestInput } from '@cement/shared-types';

/**
 * بدنه ثبت درخواست اعلام بار جدید (BR-07). پیاده‌سازی `CreateLoadingRequestInput`.
 *
 * ⚠️ عمداً `requestDate` را از مشتری نمی‌گیریم؛ Backend آن را «فردا» ست می‌کند (BR-04).
 * ⚠️ `customerId` از JWT می‌آید، نه از این بدنه (بخش ۶.۲).
 * ⚠️ `vehicleNumber`/`driverName` هرگز از مشتری گرفته نمی‌شوند (BR-09).
 */
export class CreateLoadingRequestDto implements CreateLoadingRequestInput {
  // اختیاری در سطح DTO چون در حالت `FEATURE_PILOT_PRODUCT_SELECTION` ارسال نمی‌شود.
  // اجباری‌بودنِ آن در حالت عادی توسط سرویس اعمال می‌شود (نبودنش → ORDER_001)، تا
  // یک DTO هر دو حالت را پوشش دهد و مسیر دومی برای ثبت درخواست ساخته نشود.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsPositive({ message: 'مقدار درخواستی باید بزرگ‌تر از صفر باشد' })
  requestedQty!: number;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsEnum(LoadType)
  loadType!: LoadType;

  @IsString()
  @IsNotEmpty({ message: 'شهر مقصد بار الزامی است' })
  @MaxLength(100)
  destinationCity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  destinationPostalCode?: string;

  // BR-24: موبایل تحویل‌گیرنده اجباری است (خالی → LOAD_006 در سرویس).
  @IsMobilePhone('fa-IR', {}, { message: 'شماره موبایل تحویل‌گیرنده نامعتبر است' })
  recipientMobile!: string;

  @IsOptional()
  @IsString()
  carrierId?: string;
}
