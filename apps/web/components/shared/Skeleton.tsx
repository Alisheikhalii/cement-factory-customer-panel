/** اسکلت بارگذاری جدول (بخش ۱۰.۹ — Loading/Skeleton؛ به‌جای Spinner ساده). */
export function SkeletonTable({
  rows = 8,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}): React.ReactElement {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex gap-2 border-b border-slate-200 bg-slate-50 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2 border-b border-slate-100 p-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 flex-1 rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** اسکلت کارت KPI. */
export function SkeletonCards({ count = 8 }: { count?: number }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
