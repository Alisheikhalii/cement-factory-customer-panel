'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';

/**
 * مودال نمایش یک‌باره رمز موقت مشتری (BR-26). رمز فقط همین‌جا در دسترس است؛
 * ادمین باید آن را به مشتری اطلاع دهد (تا اتصال SMS Provider در فاز بعد).
 */
export function TempPasswordModal({
  customerName,
  password,
  onClose,
}: {
  customerName: string;
  password: string;
  onClose: () => void;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* کلیپ‌بورد در دسترس نیست — کاربر دستی کپی کند */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <KeyRound className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-bold text-slate-800">رمز عبور موقت</h3>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          رمز موقت برای مشتری «{customerName}» تولید شد. این رمز فقط همین یک‌بار نمایش داده می‌شود؛
          لطفاً آن را به مشتری اطلاع دهید. مشتری در اولین ورود باید رمز خود را تغییر دهد.
        </p>
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <code className="text-lg font-bold tracking-wider text-slate-800" dir="ltr">
            {password}
          </code>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-white"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'کپی شد' : 'کپی'}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-900"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
}
