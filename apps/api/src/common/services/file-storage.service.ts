import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * سرویس ذخیره‌سازی فایل (فاز ۷ — جایگزین placeholder «pending-storage://»).
 *
 * پیاده‌سازی: دیسک محلی با مسیر ریشهٔ env-driven (`FILE_STORAGE_DIR`؛ پیش‌فرض
 * `./storage/uploads`) — هم‌الگو با بقیهٔ پیکربندی پروژه. اگر بعداً S3-compatible
 * لازم شد، فقط بدنهٔ `save` عوض می‌شود؛ قرارداد `storage://` برای مصرف‌کننده‌ها
 * ثابت می‌ماند.
 *
 * نکات امنیتی:
 * - نام فایل ذخیره‌شده هرگز از ورودی کاربر ساخته نمی‌شود (UUID + پسوند امن
 *   استخراج‌شده از نام اصلی) → مصونیت از Path Traversal و برخورد نام.
 * - فایل زیر پوشهٔ هر مشتری (`receipts/<customerId>/`) ذخیره می‌شود تا Data
 *   Scoping (بخش ۶.۲) در سطح فایل هم برقرار باشد.
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly rootDir: string;

  constructor(config: ConfigService) {
    this.rootDir = path.resolve(
      config.get<string>('FILE_STORAGE_DIR', path.join('.', 'storage', 'uploads')),
    );
  }

  /**
   * ذخیرهٔ فایل و بازگرداندن URL منطقی `storage://<key>`.
   * `keyPrefix` مسیر منطقی (مثلاً `receipts/<customerId>`) و `originalName` فقط
   * برای استخراج پسوند به کار می‌رود.
   */
  async save(keyPrefix: string, originalName: string, data: Buffer): Promise<string> {
    const key = `${sanitizeKeyPrefix(keyPrefix)}/${randomUUID()}${safeExtension(originalName)}`;
    const filePath = path.join(this.rootDir, ...key.split('/'));
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    this.logger.log(`فایل ذخیره شد: ${key} (${data.length} بایت)`);
    return `storage://${key}`;
  }

  /** مسیر فیزیکی یک URL منطقی `storage://` (برای سروِ بعدی/پاک‌سازی). */
  resolvePath(storageUrl: string): string {
    const key = storageUrl.replace(/^storage:\/\//, '');
    // کلید خام را resolve می‌کنیم (بدون sanitize؛ وگرنه نقطهٔ پسوند هم حذف می‌شد و
    // مسیر با فایلِ ذخیره‌شده نمی‌خواند). سپس اثبات می‌کنیم داخل ریشه مانده است.
    const resolved = path.resolve(this.rootDir, key);
    // دفاع در عمق: هر مسیری که از ریشه بیرون بزند (مثلاً `../secret`) رد می‌شود.
    // مقایسه با جداکنندهٔ انتهایی تا `/root-evil` با `/root` اشتباه گرفته نشود.
    const rootWithSep = this.rootDir.endsWith(path.sep)
      ? this.rootDir
      : this.rootDir + path.sep;
    if (resolved !== this.rootDir && !resolved.startsWith(rootWithSep)) {
      throw new Error(`URL ذخیره‌سازی نامعتبر: ${storageUrl}`);
    }
    return resolved;
  }
}

/** فقط اجزای مسیر امن (حروف/عدد/خط تیره/زیرخط) نگه داشته می‌شوند. */
function sanitizeKeyPrefix(prefix: string): string {
  const parts = prefix
    .split('/')
    .map((p) => p.replace(/[^A-Za-z0-9_-]/g, ''))
    .filter((p) => p !== '' && p !== '.' && p !== '..');
  if (parts.length === 0) {
    throw new Error(`پیشوند ذخیره‌سازی نامعتبر: ${prefix}`);
  }
  return parts.join('/');
}

/** پسوند امن از نام اصلی (فقط حروف/عدد، حداکثر ۱۰ نویسه) — وگرنه بدون پسوند. */
function safeExtension(originalName: string): string {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(originalName);
  const ext = match?.[1];
  return ext ? `.${ext.toLowerCase()}` : '';
}
