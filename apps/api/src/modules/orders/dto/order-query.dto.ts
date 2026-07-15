import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@cement/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** پارامترهای فیلتر صفحه سفارشات (بخش ۹.۴ / ۱۱.۴). page/pageSize از کلاس پایه. */
export class OrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  /** فیلتر سریع «دارای مانده» (remainingQty > 0). */
  @IsOptional()
  @IsBooleanString()
  hasRemaining?: string;

  /** سرجمع محصول (رزرو برای نمای Group By Product). */
  @IsOptional()
  @IsBooleanString()
  groupByProduct?: string;
}
