'use client';

import { MessageSquareWarning } from 'lucide-react';
import { useRequireCustomer } from '../../lib/use-require-customer';
import { PortalShell } from '../../components/shared/PortalShell';

/** Placeholder شکایات — پیاده‌سازی کامل در فاز ۴. */
export default function ComplaintsPage(): React.ReactElement {
  const user = useRequireCustomer();
  if (!user) {
    return <main className="flex min-h-screen items-center justify-center">در حال بارگذاری…</main>;
  }
  return (
    <PortalShell user={user}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
        <MessageSquareWarning className="h-5 w-5" />
        شکایات
      </h2>
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        ماژول شکایات در فاز ۴ فعال می‌شود.
      </div>
    </PortalShell>
  );
}
