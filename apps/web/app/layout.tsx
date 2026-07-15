import type { Metadata } from 'next';
import './globals.css';
import { OfflineBanner } from '../components/shared/OfflineBanner';

/**
 * Root Layout — کل سایت RTL و فارسی (بخش ۱۰.۵ PRD).
 * OfflineBanner سراسری (بخش ۱۰.۹ — حالت Offline).
 */
/**
 * metadataBase مبنای URLهای نسبی OG/Twitter را مشخص می‌کند (رفع اخطار Next).
 * از NEXT_PUBLIC_SITE_URL خوانده می‌شود و در توسعه به localhost برمی‌گردد.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'پورتال سیمان خاکستری نی‌ریز',
  description: 'سامانه خدمات الکترونیک مشتریان کارخانه سیمان خاکستری نی‌ریز',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
