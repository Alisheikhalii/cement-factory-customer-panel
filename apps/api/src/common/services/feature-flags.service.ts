import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FEATURE_FLAG_DEFAULTS, type FeatureFlag } from '@cement/shared-types';

/**
 * سرویس Feature Flag (فاز پایلوت یک‌هفته‌ای).
 *
 * تمام تغییرهای فاز پایلوت پشت این پرچم‌ها هستند تا برگشت‌پذیری کامل داشته باشیم؛
 * هیچ کدی حذف یا بازنویسی نمی‌شود و با عوض کردن مقدار env، رفتار قبلی عیناً برمی‌گردد
 * (PILOT_MODE.md).
 *
 * قرارداد خواندن: فقط رشتهٔ `'true'` (بدون توجه به بزرگی/کوچکی حرف) یعنی روشن؛
 * مقدار غایب → پیش‌فرض همان پرچم از `FEATURE_FLAG_DEFAULTS`.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  isEnabled(flag: FeatureFlag): boolean {
    const raw = this.config.get<string>(flag);
    if (raw === undefined || raw === null || raw.trim() === '') {
      return FEATURE_FLAG_DEFAULTS[flag];
    }
    return raw.trim().toLowerCase() === 'true';
  }

  /** نمای فعلی همه پرچم‌ها — برای Endpoint عمومی مصرف Frontend. */
  snapshot(): Record<FeatureFlag, boolean> {
    const out = {} as Record<FeatureFlag, boolean>;
    for (const flag of Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlag[]) {
      out[flag] = this.isEnabled(flag);
    }
    return out;
  }
}
