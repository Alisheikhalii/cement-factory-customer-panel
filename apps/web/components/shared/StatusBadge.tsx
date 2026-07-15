import {
  ComplaintStatus,
  DeliveryStatus,
  LoadingRequestStatus,
  OrderStatus,
  ReceiptStatus,
} from '@cement/shared-types';

/**
 * Badge وضعیت مطابق DESIGN.md: پس‌زمینه ۱۰٪ + حاشیه ۲۵٪ رنگ وضعیت، متن Bold ریز.
 * نگاشت رنگ واحد در همه‌جا: زرد=ثبت‌شده، آبی=تایید، قرمز=رد، سبز=بارگیری/تکمیل، خاکستری=لغو.
 */
const MAP: Record<string, { label: string; className: string }> = {
  // LoadingRequest (بخش ۹.۵)
  [LoadingRequestStatus.SUBMITTED]: { label: 'ثبت‌شده', className: 'bg-warning/10 text-warning border-warning/25' },
  [LoadingRequestStatus.APPROVED]: { label: 'تایید‌شده', className: 'bg-info/10 text-info border-info/25' },
  [LoadingRequestStatus.REJECTED]: { label: 'رد‌شده', className: 'bg-danger/10 text-danger border-danger/25' },
  [LoadingRequestStatus.LOADED]: { label: 'بارگیری‌شده', className: 'bg-success/10 text-success border-success/25' },
  [LoadingRequestStatus.CANCELED]: { label: 'لغو‌شده', className: 'bg-neutral/10 text-neutral border-neutral/25' },
  // Order
  [OrderStatus.IN_USE]: { label: 'در حال استفاده', className: 'bg-info/10 text-info border-info/25' },
  [OrderStatus.COMPLETED]: { label: 'تکمیل‌شده', className: 'bg-success/10 text-success border-success/25' },
  [OrderStatus.EXPIRED]: { label: 'منقضی', className: 'bg-neutral/10 text-neutral border-neutral/25' },
  // Delivery
  [DeliveryStatus.FINALIZED]: { label: 'نهایی', className: 'bg-success/10 text-success border-success/25' },
  [DeliveryStatus.DISPUTED]: { label: 'دارای اختلاف', className: 'bg-danger/10 text-danger border-danger/25' },
  // Complaint
  [ComplaintStatus.PENDING]: { label: 'در حال بررسی', className: 'bg-warning/10 text-warning border-warning/25' },
  [ComplaintStatus.ANSWERED]: { label: 'پاسخ داده‌شده', className: 'bg-success/10 text-success border-success/25' },
  // Receipt
  // ⚠️ ReceiptStatus.PENDING/REJECTED با ComplaintStatus.PENDING و LoadingRequestStatus.REJECTED
  // هم‌مقدار رشته‌ای هستند؛ چون این نگاشت با مقدار رشته‌ای کلید می‌خورد، فقط مقادیر یکتا اضافه می‌شوند.
  [ReceiptStatus.REVIEWED]: { label: 'بررسی‌شده', className: 'bg-success/10 text-success border-success/25' },
};

export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const entry = MAP[status] ?? {
    label: status,
    className: 'bg-neutral/10 text-neutral border-neutral/25',
  };
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}
