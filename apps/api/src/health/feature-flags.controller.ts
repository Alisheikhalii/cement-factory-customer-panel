import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FeatureFlagsDto } from '@cement/shared-types';
import { Public } from '../modules/auth/decorators/public.decorator';
import { FeatureFlagsService } from '../common/services/feature-flags.service';

/**
 * انتشار وضعیت Feature Flag ها برای Frontend (فاز پایلوت).
 *
 * عمومی است چون Navbar و لندینگ هم قبل از ورود کاربر به آن نیاز دارند و محتوای آن
 * حساس نیست (فقط روشن/خاموش بودن بخش‌ها). امنیت واقعی سمت Backend با
 * `FeatureFlagGuard` (پاسخ ۴۰۳) اعمال می‌شود، نه با پنهان‌کردن این پاسخ.
 */
@ApiTags('feature-flags')
@Public()
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'وضعیت فعلی پرچم‌های قابلیت' })
  list(): FeatureFlagsDto {
    return this.flags.snapshot();
  }
}
