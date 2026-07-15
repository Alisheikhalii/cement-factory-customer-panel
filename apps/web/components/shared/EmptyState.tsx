import { Inbox } from 'lucide-react';

/**
 * حالت خالی (بخش ۱۰.۹ — Empty). متن پیش‌فرض دقیقاً مطابق سیستم فعلی (بخش ۹.۰)
 * برای حفظ آشنایی کاربر.
 */
export function EmptyState({ message }: { message?: string }): React.ReactElement {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-on-surface-variant/70">
      <Inbox className="h-12 w-12" />
      <p className="text-sm">
        {message ??
          'مقداری برای نمایش وجود ندارد. از منوی فیلتر جهت تغییر تاریخ استفاده نمایید'}
      </p>
    </div>
  );
}
