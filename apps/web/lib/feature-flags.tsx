'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_DEFAULTS,
  type FeatureFlag,
  type FeatureFlagsDto,
} from '@cement/shared-types';
import { apiClient } from './api';

/**
 * تامین‌کننده وضعیت Feature Flag ها در سمت Frontend (فاز پایلوت).
 *
 * منبع حقیقت، Endpoint عمومی `GET /feature-flags` است (نه متغیرهای NEXT_PUBLIC_)
 * تا تغییر یک پرچم فقط با ری‌استارت Backend اعمال شود و نیازی به Build مجدد
 * Frontend نباشد. تا رسیدن پاسخ، مقادیر پیش‌فرض مشترک استفاده می‌شود.
 *
 * ⚠️ این لایه فقط برای UX است؛ اعمال واقعی محدودیت سمت Backend با
 * `FeatureFlagGuard` (پاسخ ۴۰۳ / FEATURE_DISABLED) انجام می‌شود.
 */
const FeatureFlagsContext = createContext<FeatureFlagsDto>(FEATURE_FLAG_DEFAULTS);

export function FeatureFlagsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [flags, setFlags] = useState<FeatureFlagsDto>(FEATURE_FLAG_DEFAULTS);

  useEffect(() => {
    let active = true;
    apiClient
      .get<FeatureFlagsDto>('/feature-flags')
      .then((result) => {
        if (active) {
          setFlags(result);
        }
      })
      .catch(() => {
        // در دسترس نبودن Endpoint نباید پورتال را از کار بیندازد؛ پیش‌فرض‌ها می‌مانند.
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => flags, [flags]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

/** وضعیت یک پرچم مشخص. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useContext(FeatureFlagsContext)[flag];
}

/** همه پرچم‌ها یک‌جا. */
export function useFeatureFlags(): FeatureFlagsDto {
  return useContext(FeatureFlagsContext);
}

export { FEATURE_FLAGS };
