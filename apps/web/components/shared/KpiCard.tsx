import type { LucideIcon } from 'lucide-react';

/**
 * کارت KPI شیشه‌ای مطابق مرجع animated_dashboard_hormozgan_cement:
 * هاله‌ی نور گوشه + مربع آیکون رنگی + عدد بزرگ + زیرنویس/روند (بخش ۱۰.۷).
 */
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
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'primary';
}): React.ReactElement {
  const accentMap: Record<string, { icon: string; glow: string }> = {
    blue: { icon: 'bg-info/10 text-info', glow: 'bg-info/20' },
    green: { icon: 'bg-success/10 text-success', glow: 'bg-success/20' },
    amber: { icon: 'bg-warning/10 text-warning', glow: 'bg-warning/20' },
    red: { icon: 'bg-danger/10 text-danger', glow: 'bg-danger/20' },
    slate: { icon: 'bg-neutral/10 text-neutral', glow: 'bg-neutral/20' },
    primary: { icon: 'bg-primary-container/10 text-primary-container', glow: 'bg-primary-container/20' },
  };
  const a = accentMap[accent] ?? accentMap.blue;
  return (
    <div className="glass-card glass-card-hover relative overflow-hidden rounded-2xl p-5">
      {/* هاله نور گوشه */}
      <div className={`pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full blur-2xl ${a.glow}`} />
      <div className="relative flex items-start justify-between">
        <span className="text-sm font-medium text-on-surface-variant">{title}</span>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="relative mt-3 text-2xl font-extrabold text-on-surface">{value}</div>
      {subtitle && <div className="relative mt-1.5 text-xs text-on-surface-variant/80">{subtitle}</div>}
    </div>
  );
}
