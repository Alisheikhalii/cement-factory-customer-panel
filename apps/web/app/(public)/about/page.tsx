import type { Metadata } from 'next';
import { getSingle } from '../../../lib/content';
import { Markdown } from '../../../components/public/Markdown';

/** دربارهٔ ما — `/about` (بخش ۹.۱۰.۳). محتوا از content/about.mdx. SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'دربارهٔ ما',
  description: 'معرفی، تاریخچه و محصولات کارخانه سیمان خاکستری نی‌ریز.',
};

export default function AboutPage(): React.ReactElement {
  const about = getSingle('about');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {about ? (
        <Markdown content={about.body} />
      ) : (
        <p className="py-16 text-center text-slate-400">محتوای این صفحه هنوز آماده نشده است.</p>
      )}
    </div>
  );
}
