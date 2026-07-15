import { IsEnum, IsIn, IsISO8601, IsOptional } from 'class-validator';
import { LoadingRequestStatus } from '@cement/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** پارامترهای فیلتر صفحه اعلام بار (بخش ۹.۵ / ۱۱.۵). */
export class LoadingRequestQueryDto extends PaginationQueryDto {
  /** نمای «ریز» (detail) یا «سرجمع تاریخ» (by-date). */
  @IsOptional()
  @IsIn(['detail', 'by-date'])
  view?: 'detail' | 'by-date';

  @IsOptional()
  @IsEnum(LoadingRequestStatus)
  status?: LoadingRequestStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
