import { SetMetadata } from '@nestjs/common';

/** کلید Metadata برای مسیرهای عمومی (بدون نیاز به JWT). */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * مسیرهایی که نباید توسط JwtAuthGuard سراسری محافظت شوند
 * (مثل login و health). استفاده: `@Public()` بالای متد یا کنترلر.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
