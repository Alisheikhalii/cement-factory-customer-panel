'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** نوار هشدار قطع اینترنت (بخش ۱۰.۹ — Offline، سراسری). */
export function OfflineBanner(): React.ReactElement | null {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = (): void => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) {
    return null;
  }
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-red-600 py-2 text-sm text-white">
      <WifiOff className="h-4 w-4" />
      اتصال اینترنت قطع است
    </div>
  );
}
