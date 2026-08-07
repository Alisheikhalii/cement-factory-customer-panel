import { SetMetadata } from '@nestjs/common';
import type { FeatureFlag } from '@cement/shared-types';

export const FEATURE_FLAG_METADATA = 'cement:required-feature-flag';

/**
 * علامت‌گذاری کنترلر یا هندلر به‌عنوان وابسته به یک Feature Flag.
 * وقتی پرچم خاموش باشد `FeatureFlagGuard` پاسخ ۴۰۳ با کد `FEATURE_DISABLED`
 * برمی‌گرداند (بخش ۱۶ PRD)، نه ۴۰۴.
 */
export const RequiresFeature = (flag: FeatureFlag): MethodDecorator & ClassDecorator =>
  SetMetadata(FEATURE_FLAG_METADATA, flag);
