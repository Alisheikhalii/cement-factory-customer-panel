import type { Metadata } from 'next';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { companyInfo } from '../../lib/company-info';

/**
 * Layout بخش عمومی (Route Group `(public)`، بخش ۹.۱۰.۶) — کاملاً جدا از پورتال/ادمین.
 * Navbar و Footer عمومی؛ سبک بازاریابی‌محور (نه Glassmorphism فشردهٔ داشبورد).
 * SEO: این بخش برخلاف پورتال باید Index شود (بخش ۹.۱۰.۵).
 */
export const metadata: Metadata = {
  title: {
    default: `${companyInfo.name} | وب‌سایت رسمی`,
    template: `%s | ${companyInfo.name}`,
  },
  description:
    'وب‌سایت رسمی کارخانه سیمان خاکستری نی‌ریز — اخبار، اطلاعیه‌ها، گزارش‌ها و خدمات الکترونیک مشتریان.',
  openGraph: {
    title: `${companyInfo.name} | وب‌سایت رسمی`,
    description: 'وب‌سایت رسمی کارخانه سیمان خاکستری نی‌ریز',
    type: 'website',
    locale: 'fa_IR',
    siteName: companyInfo.name,
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
