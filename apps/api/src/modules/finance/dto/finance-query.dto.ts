import { IsISO8601, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** فیلتر تاریخ مشترک تب‌های مالی (بخش ۹.۳ / ۱۱.۳). */
export class FinanceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
