import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** پارامترهای فیلتر صفحه تحویل (بخش ۹.۶ / ۱۱.۶). */
export class DeliveryQueryDto extends PaginationQueryDto {
  /** ریز تحویل (detail، پیش‌فرض)، سرجمع محصول (by-product)، سرجمع تاریخ (by-date). */
  @IsOptional()
  @IsIn(['detail', 'by-product', 'by-date'])
  view?: 'detail' | 'by-product' | 'by-date';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
