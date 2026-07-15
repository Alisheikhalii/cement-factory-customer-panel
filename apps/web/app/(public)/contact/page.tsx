import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { companyInfo } from '../../../lib/company-info';
import { ContactForm } from '../../../components/public/ContactForm';

/** تماس با ما — `/contact` (بخش ۹.۱۰.۳). اطلاعات تماس + فرم. */
export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'راه‌های ارتباطی و فرم تماس با کارخانه سیمان خاکستری نی‌ریز.',
};

export default function ContactPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">تماس با ما</h1>

      <div className="grid gap-10 md:grid-cols-2">
        {/* اطلاعات تماس */}
        <div className="space-y-6">
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 text-primary-700 shrink-0" />
              <span>{companyInfo.address}</span>
            </li>
            {companyInfo.phones.map((phone) => (
              <li key={phone} className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-700 shrink-0" />
                <span dir="ltr">{phone}</span>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-700 shrink-0" />
              <span dir="ltr">{companyInfo.email}</span>
            </li>
            <li className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary-700 shrink-0" />
              <span dir="ltr">{companyInfo.website}</span>
            </li>
          </ul>

          {/* نقشه — Placeholder تا دریافت مختصات واقعی (بخش ۹.۱۰.۳ / ۲۰.۲) */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 h-56 flex items-center justify-center text-center text-sm text-slate-400 p-4">
            نقشهٔ موقعیت کارخانه (Google Maps / نشان)
            <br />
            پس از دریافت مختصات واقعی از کارفرما جای‌گذاری می‌شود.
          </div>
        </div>

        {/* فرم تماس */}
        <div className="rounded-lg bg-white shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4">ارسال پیام</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
