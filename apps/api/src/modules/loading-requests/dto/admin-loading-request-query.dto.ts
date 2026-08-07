import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsISO8601, IsOptional } from 'class-validator';
import { LoadingRequestStatus } from '@cement/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * ستون‌های مجاز مرتب‌سازی کارتابل ادمین.
 *
 * ⚠️ فهرست بسته (Whitelist) است و مستقیماً به `orderBy` پریزما می‌رود؛ پس هر مقدار
 * دیگری باید در سطح اعتبارسنجی رد شود، نه در Repository.
 */
export const ADMIN_CARTABLE_SORT_FIELDS = [
  'requestNumber',
  'customerName',
  'requestedQty',
  'requestDate',
  'submittedAt',
  'status',
] as const;

export type AdminCartableSortField = (typeof ADMIN_CARTABLE_SORT_FIELDS)[number];

/**
 * رشتهٔ خالی را به `undefined` تبدیل می‌کند.
 *
 * چرا لازم است: `@IsOptional()` فقط `undefined`/`null` را رد می‌کند، پس
 * `?status=` (خالی، حالت «همه وضعیت‌ها») بدون این تبدیل به `@IsEnum` می‌رسد و ۴۰۰
 * می‌گیرد. Frontend فعلاً کلید خالی نمی‌فرستد، ولی این تبدیل قرارداد را مستقل از
 * رفتار Frontend امن می‌کند.
 */
const emptyToUndefined = Transform(({ value }: { value: unknown }) =>
  value === '' ? undefined : value,
);

/**
 * پارامترهای کارتابل اعلام بار ادمین (بخش ۹.۹.۳).
 *
 * ⚠️ چرا این کلاس ساخته شد: کنترلر قبلاً `@Query('status')` را جدا می‌گرفت ولی کل
 * Query را با `PaginationQueryDto` اعتبارسنجی می‌کرد. `ValidationPipe` سراسری با
 * `forbidNonWhitelisted: true` اجرا می‌شود (main.ts خط ۵۲)، پس `status` به‌عنوان
 * فیلد ناشناخته رد می‌شد و کارتابل روی «در انتظار بررسی» همیشه ۴۰۰ می‌گرفت
 * («خطا در دریافت اطلاعات»). با اعلام صریح فیلدها، هم خطا رفع می‌شود و هم مقدار
 * `status` به‌جای `string` خام اعتبارسنجی می‌شود.
 */
export class AdminLoadingRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @emptyToUndefined
  @IsEnum(LoadingRequestStatus)
  status?: LoadingRequestStatus;

  /** بازهٔ «تاریخ ثبت» برای گرفتن اعلام‌بارهای یک روز مشخص (خروجی Excel روزانه). */
  @IsOptional()
  @emptyToUndefined
  @IsISO8601()
  from?: string;

  @IsOptional()
  @emptyToUndefined
  @IsISO8601()
  to?: string;

  @IsOptional()
  @emptyToUndefined
  @IsIn(ADMIN_CARTABLE_SORT_FIELDS)
  sortBy?: AdminCartableSortField;

  @IsOptional()
  @emptyToUndefined
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
