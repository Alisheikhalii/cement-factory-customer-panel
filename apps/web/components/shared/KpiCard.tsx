import type { LucideIcon } from 'lucide-react';

/** کارت KPI با عدد بزرگ + آیکون (بخش ۱۰.۷ — KpiCard). */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}): React.ReactElement {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm text-slate-500">{title}</span>
        <span className={`rounded-lg p-2 ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-800">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}
