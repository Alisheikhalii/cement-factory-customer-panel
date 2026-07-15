import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { ConfigService } from '@nestjs/config';
import { FileStorageService } from './file-storage.service';

/**
 * تست FileStorageService روی پوشهٔ موقت واقعی (فاز ۷).
 * اثبات می‌کند: ذخیره با نام UUID + پسوند امن، URL منطقی `storage://`،
 * و مصونیت از Path Traversal در پیشوند/نام فایل.
 */

function config(dir: string): ConfigService {
  const values: Record<string, string> = { FILE_STORAGE_DIR: dir };
  return { get: (key: string, def?: unknown): unknown => values[key] ?? def } as unknown as ConfigService;
}

describe('FileStorageService', () => {
  let dir: string;
  let service: FileStorageService;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-storage-'));
    service = new FileStorageService(config(dir));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('فایل را ذخیره و URL منطقی storage:// برمی‌گرداند؛ محتوا سالم است', async () => {
    const url = await service.save('receipts/cust-1', 'فیش بانکی.PDF', Buffer.from('DATA'));
    expect(url).toMatch(/^storage:\/\/receipts\/cust-1\/[0-9a-f-]{36}\.pdf$/);
    const physical = service.resolvePath(url);
    expect(physical.startsWith(path.resolve(dir))).toBe(true);
    await expect(fs.readFile(physical, 'utf8')).resolves.toBe('DATA');
  });

  it('نام فایل کاربر در مسیر ذخیره‌سازی استفاده نمی‌شود (فقط پسوند امن)', async () => {
    const url = await service.save('receipts/c1', '..\\..\\evil<script>.png', Buffer.from('x'));
    expect(url).not.toContain('evil');
    expect(url.endsWith('.png')).toBe(true);
  });

  it('نام بدون پسوند معتبر → بدون پسوند ذخیره می‌شود', async () => {
    const url = await service.save('receipts/c1', 'noext', Buffer.from('x'));
    expect(url).toMatch(/storage:\/\/receipts\/c1\/[0-9a-f-]{36}$/);
  });

  it('پیشوند شامل .. یا نویسه‌های خطرناک پاک‌سازی می‌شود', async () => {
    const url = await service.save('receipts/../../etc', 'a.png', Buffer.from('x'));
    // اجزای «..» حذف شده‌اند؛ فایل داخل ریشه می‌ماند.
    expect(url).toMatch(/^storage:\/\/receipts\/etc\//);
    expect(service.resolvePath(url).startsWith(path.resolve(dir))).toBe(true);
  });

  it('پیشوند کاملاً نامعتبر → خطا (نه ذخیرهٔ خاموش در ریشه)', async () => {
    await expect(service.save('../..', 'a.png', Buffer.from('x'))).rejects.toThrow();
  });

  it('resolvePath مسیر خارج از ریشه را رد می‌کند', () => {
    expect(() => service.resolvePath('storage://../secret')).toThrow();
  });
});
