import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * پارامترهای لیست/جستجوی مشتریان (بخش ۹.۹.۲).
 *
 * ⚠️ چرا یک DTO جدا و نه افزودن `search` به `PaginationQueryDto`:
 * `ValidationPipe` سراسری با `forbidNonWhitelisted: true` اجرا می‌شود، پس هر پارامتر
 * Query که در DTO اعلام نشده باشد کل درخواست را ۴۰۰ می‌کند. `search` پیش‌تر فقط با
 * `@Query('search')` جداگانه خوانده می‌شد و در هیچ DTOای تعریف نشده بود؛ نتیجه این بود
 * که جعبهٔ جستجوی صفحهٔ مشتریان (که `?search=` می‌فرستد) همیشه ۴۰۰ می‌گرفت — با آنکه
 * `AdminCustomerRepository.buildWhere` جستجو را کامل پیاده کرده بود.
 *
 * `PaginationQueryDto` مشترک همهٔ مسیرهای لیستی است؛ افزودن `search` به آن یعنی هر
 * مسیر لیستی دیگری هم بی‌دلیل این پارامتر را می‌پذیرد. پس فقط همین مسیر گسترش می‌یابد.
 */
export class ListCustomersQueryDto extends PaginationQueryDto {
  /** جستجو روی نام، کد تفصیل، کد ملی و موبایل (منطق در Repository). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
