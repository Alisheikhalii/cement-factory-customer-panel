import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FeatureFlag } from '@cement/shared-types';
import { AppException } from '../exceptions/app.exception';
import { FeatureFlagsService } from '../services/feature-flags.service';
import { FEATURE_FLAG_METADATA } from './feature-flag.decorator';

/**
 * Guard پرچم‌های قابلیت (فاز پایلوت).
 *
 * اگر روی هندلر یا کنترلر `@RequiresFeature(...)` باشد و آن پرچم خاموش باشد،
 * درخواست با `FEATURE_DISABLED` (HTTP 403) رد می‌شود. دلیل ۴۰۳ به‌جای ۴۰۴:
 * مسیر واقعاً وجود دارد و فقط موقتاً بسته است؛ پاسخ باید با کاتالوگ خطای بخش ۱۶
 * سازگار باشد و پیام یکنواخت به کاربر بدهد.
 *
 * وقتی پرچم روشن شود این Guard کاملاً شفاف است و رفتار قبلی مسیر عیناً برمی‌گردد.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<FeatureFlag | undefined>(FEATURE_FLAG_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!flag) {
      return true;
    }
    if (!this.flags.isEnabled(flag)) {
      throw new AppException('FEATURE_DISABLED');
    }
    return true;
  }
}
