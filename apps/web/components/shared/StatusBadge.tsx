import {
  ComplaintStatus,
  DeliveryStatus,
  LoadingRequestStatus,
  OrderStatus,
  ReceiptStatus,
} from '@cement/shared-types';

/**
 * Badge وضعیت رنگی (بخش ۱۰.۷/۹.۵). نگاشت رنگ واحد در همه‌جا:
 * زرد=ثبت‌شده، آبی=تایید، قرمز=رد، سبز=بارگیری/تکمیل، خاکستری=لغو.
 */
const MAP: Record<string, { label: string; className: string }> = {
  // LoadingRequest (بخش ۹.۵)
  [LoadingRequestStatus.SUBMITTED]: { label: 'ثبت‌شده', className: 'bg-amber-100 text-amber-800' },
  [LoadingRequestStatus.APPROVED]: { label: 'تایید‌شده', className: 'bg-blue-100 text-blue-800' },
  [LoadingRequestStatus.REJECTED]: { label: 'رد‌شده', className: 'bg-red-100 text-red-800' },
  [LoadingRequestStatus.LOADED]: { label: 'بارگیری‌شده', className: 'bg-green-100 text-green-800' },
  [LoadingRequestStatus.CANCELED]: { label: 'لغو‌شده', className: 'bg-slate-100 text-slate-600' },
  // Order
  [OrderStatus.IN_USE]: { label: 'در حال استفاده', className: 'bg-blue-100 text-blue-800' },
  [OrderStatus.COMPLETED]: { label: 'تکمیل‌شده', className: 'bg-green-100 text-green-800' },
  [OrderStatus.EXPIRED]: { label: 'منقضی', className: 'bg-slate-100 text-slate-600' },
  // Delivery
  [DeliveryStatus.FINALIZED]: { label: 'نهایی', className: 'bg-green-100 text-green-800' },
  [DeliveryStatus.DISPUTED]: { label: 'دارای اختلاف', className: 'bg-red-100 text-red-800' },
  // Complaint
  [ComplaintStatus.PENDING]: { label: 'در حال بررسی', className: 'bg-amber-100 text-amber-800' },
  [ComplaintStatus.ANSWERED]: { label: 'پاسخ داده‌شده', className: 'bg-green-100 text-green-800' },
  // Receipt
  // ⚠️ ReceiptStatus.PENDING/REJECTED با ComplaintStatus.PENDING و LoadingRequestStatus.REJECTED
  // هم‌مقدار رشته‌ای هستند؛ چون این نگاشت با مقدار رشته‌ای کلید می‌خورد، فقط مقادیر یکتا اضافه می‌شوند.
  [ReceiptStatus.REVIEWED]: { label: 'بررسی‌شده', className: 'bg-green-100 text-green-800' },
};

export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const entry = MAP[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}
