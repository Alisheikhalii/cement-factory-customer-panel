import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * پارامترهای صفحه‌بندی مشترک همه Endpointهای لیستی (بخش ۱۱.۱۱ / ۹.۰).
 * pageSize مجاز: ۱۰/۲۰/۵۰/۱۰۰ (بخش ۹.۰) — با Min/Max محدود می‌شود.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

/** نرمال‌سازی page/pageSize و محاسبه skip/take برای Prisma. */
export function resolvePagination(query: PaginationQueryDto): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
  const pageSize =
    query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
