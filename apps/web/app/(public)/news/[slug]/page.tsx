import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getCollection, getItem } from '../../../../lib/content';
import { formatJalaliDate } from '../../../../lib/format';
import { Markdown } from '../../../../components/public/Markdown';

/** جزئیات خبر — `/news/[slug]` (بخش ۹.۱۰.۳). SSG با generateStaticParams. */
export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

/** همهٔ slugها برای تولید استاتیک در زمان Build. */
export function generateStaticParams(): Array<{ slug: string }> {
  return getCollection('news').map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const item = getItem('news', params.slug);
  if (!item) {
    return { title: 'خبر یافت نشد' };
  }
  return {
    title: item.title,
    description: item.summary ?? item.title,
    openGraph: {
      title: item.title,
      description: item.summary ?? item.title,
      type: 'article',
      images: item.cover ? [{ url: item.cover }] : undefined,
    },
  };
}

export default function NewsDetailPage({ params }: PageProps): React.ReactElement {
  const item = getItem('news', params.slug);
  if (!item) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به اخبار
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{item.title}</h1>
      <div className="text-sm text-slate-400 mb-6">{formatJalaliDate(item.date)}</div>

      {item.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.cover}
          alt={item.title}
          className="rounded-lg w-full object-cover mb-8"
        />
      )}

      <Markdown content={item.body} />
    </article>
  );
}
