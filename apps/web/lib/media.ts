import fs from 'node:fs';
import path from 'node:path';

/**
 * لودر فایل‌های Manifest چندرسانه‌ای (photos.json / videos.json) از پوشهٔ public.
 * فقط در زمان Build/Server اجرا می‌شود (fs) — برای SSG گالری عکس/فیلم (بخش ۹.۱۰.۳).
 * مستقل از دیتابیس (بخش ۹.۱۰.۱).
 */

/** یک عکس گالری (هماهنگ با photos.json). */
export interface PhotoEntry {
  src: string;
  title: string;
  description?: string;
}

/** یک ویدیو گالری (هماهنگ با videos.json). */
export interface VideoEntry {
  title: string;
  description?: string;
  provider: 'aparat' | 'youtube' | 'file';
  embedUrl: string;
  thumbnail?: string;
}

const MEDIA_ROOT = path.join(process.cwd(), 'public', 'media');

/** خواندن امن یک فایل JSON آرایه‌ای؛ در صورت نبود/خطا، آرایهٔ خالی. */
function readJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function getPhotos(): PhotoEntry[] {
  return readJsonArray<PhotoEntry>(path.join(MEDIA_ROOT, 'photos', 'photos.json'));
}

export function getVideos(): VideoEntry[] {
  return readJsonArray<VideoEntry>(path.join(MEDIA_ROOT, 'videos', 'videos.json'));
}
