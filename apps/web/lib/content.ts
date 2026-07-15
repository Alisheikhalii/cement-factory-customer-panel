import fs from 'node:fs';
import path from 'node:path';

/**
 * لایهٔ محتوای عمومی لندینگ پیج (بخش ۹.۱۰.۱).
 *
 * تصمیم معماری: محتوا از فایل‌های Markdown داخل `apps/web/content/` خوانده می‌شود،
 * کاملاً مستقل از دیتابیس/Backend (طبق تایید کارفرما، ۹.۱۰.۱). این ماژول فقط در
 * زمان Build/Server اجرا می‌شود (fs) و برای SSG/ISR مناسب است.
 *
 * ⚠️ چرا بدون کتابخانهٔ خارجی (mdx/gray-matter/remark)؟ تا افزودن این بخش هیچ
 * وابستگی جدیدی به پروژه تحمیل نکند و Build بدون نصب پکیج تازه کار کند. یک Parser
 * سبکِ Frontmatter + یک Renderer سادهٔ Markdown (کافی برای اخبار/اطلاعیه/درباره ما)
 * اینجا پیاده شده است. اگر بعداً به MDX کامل نیاز شد، همین API حفظ و پیاده‌سازی
 * درونی ارتقا می‌یابد.
 */

/** ریشهٔ فایل‌های محتوا (نسبت به ریشهٔ اپ web در زمان اجرا). */
const CONTENT_ROOT = path.join(process.cwd(), 'content');

/** Frontmatter استاندارد یک آیتم محتوا (اخبار/اطلاعیه/گزارش). */
export interface ContentFrontmatter {
  title: string;
  /** تاریخ انتشار به‌صورت ISO (YYYY-MM-DD). برای مرتب‌سازی نزولی. */
  date: string;
  /** خلاصهٔ کوتاه برای کارت‌های لیست. */
  summary?: string;
  /** مسیر تصویر Cover (نسبت به /public). */
  cover?: string;
  /** لینک فایل ضمیمه (مثلاً PDF گزارش، نسبت به /public). */
  attachment?: string;
}

/** یک آیتم محتوا شامل Frontmatter، slug و بدنهٔ Markdown خام. */
export interface ContentItem extends ContentFrontmatter {
  slug: string;
  /** بدنهٔ Markdown خام (بعد از حذف Frontmatter). */
  body: string;
}

/** دسته‌های محتوای مبتنی بر پوشه. */
export type ContentCollection = 'news' | 'announcements' | 'reports';

/**
 * Parser سبک Frontmatter به سبک YAML خطی (`key: value`) بین دو خط `---`.
 * فقط مقادیر رشته‌ای تک‌خطی پشتیبانی می‌شود (کافی برای این محتوا).
 */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);
  if (!match) {
    return { data: {}, body: normalized.trim() };
  }
  const block = match[1] ?? '';
  const body = normalized.slice(match[0].length).trim();
  const data: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // حذف کوتیشن اطراف مقدار در صورت وجود.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) {
      data[key] = value;
    }
  }
  return { data, body };
}

/** تبدیل یک ردیف داده به Frontmatter تایپ‌دار با پیش‌فرض‌های امن. */
function toFrontmatter(data: Record<string, string>): ContentFrontmatter {
  return {
    title: data.title ?? 'بدون عنوان',
    date: data.date ?? '',
    summary: data.summary,
    cover: data.cover,
    attachment: data.attachment,
  };
}

/** مسیر پوشهٔ یک دسته. اگر وجود نداشته باشد، لیست خالی برمی‌گردد. */
function collectionDir(collection: ContentCollection): string {
  return path.join(CONTENT_ROOT, collection);
}

/**
 * همهٔ آیتم‌های یک دسته، مرتب‌شده بر اساس تاریخ نزولی (جدیدترین اول).
 * فقط فایل‌های `.md`/`.mdx` خوانده می‌شوند؛ slug از نام فایل بدون پسوند است.
 */
export function getCollection(collection: ContentCollection): ContentItem[] {
  const dir = collectionDir(collection);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  const items = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx?$/, '');
    return { slug, body, ...toFrontmatter(data) };
  });

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** یک آیتم محتوا با slug مشخص، یا null اگر یافت نشود. */
export function getItem(
  collection: ContentCollection,
  slug: string,
): ContentItem | null {
  const dir = collectionDir(collection);
  for (const ext of ['.md', '.mdx']) {
    const file = path.join(dir, `${slug}${ext}`);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      const { data, body } = parseFrontmatter(raw);
      return { slug, body, ...toFrontmatter(data) };
    }
  }
  return null;
}

/** خواندن یک فایل تک (مثل about.mdx). null اگر نبود. */
export function getSingle(fileName: string): ContentItem | null {
  for (const ext of ['.md', '.mdx']) {
    const file = path.join(CONTENT_ROOT, `${fileName}${ext}`);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      const { data, body } = parseFrontmatter(raw);
      return { slug: fileName, body, ...toFrontmatter(data) };
    }
  }
  return null;
}
