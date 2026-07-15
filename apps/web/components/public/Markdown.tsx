import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

/**
 * Renderer سبک Markdown → React (بدون وابستگی خارجی) برای محتوای لندینگ پیج.
 * زیرمجموعه‌ای کافی از Markdown را پشتیبانی می‌کند: عنوان (#..###)، پاراگراف،
 * لیست نامرتب (-)، نقل‌قول (>)، و Inline: **bold**، *italic*، [متن](لینک).
 * (برای اخبار/اطلاعیه/درباره ما کافی است؛ نیاز به MDX کامل نیست — بخش ۹.۱۰.۱.)
 *
 * ⚠️ ورودی از فایل‌های مخزن (پشتیبان سایت) می‌آید، نه ورودی کاربر؛ اما برای احتیاط
 * هیچ HTML خامی تزریق نمی‌شود (بدون dangerouslySetInnerHTML) و فقط گره‌های امن React
 * ساخته می‌شود.
 */

/** پردازش عناصر Inline یک خط به گره‌های React (bold/italic/link). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // الگو: لینک | bold | italic — به ترتیب اولویت.
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i}`;
    if (match[1] !== undefined && match[2] !== undefined) {
      const href = match[2];
      const label = match[1];
      const external = /^https?:\/\//.test(href);
      nodes.push(
        external ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 hover:underline"
          >
            {label}
          </a>
        ) : (
          <Link key={key} href={href} className="text-primary-700 hover:underline">
            {label}
          </Link>
        ),
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <strong key={key} className="font-bold">
          {match[3]}
        </strong>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {match[4]}
        </em>,
      );
    }
    lastIndex = match.index + (match[0]?.length ?? 0);
    i += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

/**
 * تبدیل کل بدنهٔ Markdown به گره React.
 * خطوط به بلوک‌های ساده تقسیم می‌شوند (عنوان/لیست/نقل‌قول/تصویر/پاراگراف).
 */
export function Markdown({ content }: { content: string }): ReactElement {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let key = 0;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      const text = paragraph.join(' ');
      blocks.push(
        <p key={`p-${key}`} className="leading-8 text-slate-700 mb-4">
          {renderInline(text, `p-${key}`)}
        </p>,
      );
      key += 1;
      paragraph = [];
    }
  }

  function flushList(): void {
    if (list.length > 0) {
      const items = list;
      blocks.push(
        <ul key={`ul-${key}`} className="list-disc pr-6 mb-4 space-y-2 text-slate-700">
          {items.map((item, idx) => (
            <li key={idx} className="leading-8">
              {renderInline(item, `ul-${key}-${idx}`)}
            </li>
          ))}
        </ul>,
      );
      key += 1;
      list = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // تصویر: ![alt](src)
    const img = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
    if (img) {
      flushParagraph();
      flushList();
      const alt = img[1] ?? '';
      const src = img[2] ?? '';
      // eslint-disable-next-line @next/next/no-img-element
      blocks.push(
        <img
          key={`img-${key}`}
          src={src}
          alt={alt}
          className="rounded-lg my-6 w-full object-cover"
        />,
      );
      key += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h3-${key}`} className="text-lg font-bold text-slate-800 mt-6 mb-3">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
      key += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h2-${key}`} className="text-xl font-bold text-slate-800 mt-8 mb-4">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
      key += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h1 key={`h1-${key}`} className="text-2xl font-bold text-slate-900 mt-4 mb-5">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h1>,
      );
      key += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`bq-${key}`}
          className="border-r-4 border-primary-300 bg-primary-50 pr-4 py-2 my-4 text-slate-600"
        >
          {renderInline(line.slice(2), `bq-${key}`)}
        </blockquote>,
      );
      key += 1;
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }
    // خط عادی → بخشی از پاراگراف جاری.
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();

  return <div className="prose-fa">{blocks}</div>;
}
