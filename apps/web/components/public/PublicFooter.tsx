import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { companyInfo } from '../../lib/company-info';

/**
 * Footer عمومی لندینگ پیج (بخش ۹.۱۰) — اطلاعات تماس سریع + لینک‌ها.
 * اطلاعات از company-info.ts (نقطهٔ واحد؛ Placeholder تا دریافت داده واقعی).
 */
export function PublicFooter(): React.ReactElement {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-content px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-3">{companyInfo.name}</h3>
          <p className="text-sm leading-7 text-slate-400">
            سامانهٔ خدمات الکترونیک و وب‌سایت رسمی کارخانه سیمان خاکستری نی‌ریز.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/news" className="hover:text-white transition">
                اخبار کارخانه
              </Link>
            </li>
            <li>
              <Link href="/reports" className="hover:text-white transition">
                گزارش‌ها
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition">
                دربارهٔ ما
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition">
                پورتال مشتریان
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">تماس با ما</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 shrink-0" />
              <span>{companyInfo.address}</span>
            </li>
            {companyInfo.phones.map((phone) => (
              <li key={phone} className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span dir="ltr">{phone}</span>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span dir="ltr">{companyInfo.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {companyInfo.name} — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}
