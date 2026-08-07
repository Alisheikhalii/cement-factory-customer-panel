/**
 * بارگذاری متغیرهای محیطی برای تست‌های E2E.
 *
 * جِست از داخل `apps/api` اجرا می‌شود، ولی `.env` پروژه در ریشهٔ مونوریپو است؛
 * این فایل هر دو محل را (به ترتیب اولویت: apps/api/.env سپس ریشه) می‌خواند.
 * عمداً به بستهٔ `dotenv` وابسته نیست تا نیازی به افزودن Dependency نباشد.
 *
 * برای جلوگیری از آسیب به دادهٔ توسعه، اگر `DATABASE_URL_TEST` تنظیم شده باشد
 * جایگزین `DATABASE_URL` می‌شود (بخش ۱۸: تست روی دیتابیس تست).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    // مقدارهایی که از قبل در محیط هستند (مثلاً در CI) بازنویسی نمی‌شوند.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, '..', '.env'));
loadEnvFile(resolve(__dirname, '..', '..', '..', '.env'));

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// تست E2E رفتار «حالت پایلوت» را می‌سنجد، پس پرچم‌ها را صریح تثبیت می‌کنیم تا
// نتیجه به مقدار `.env` توسعه‌دهنده وابسته نباشد.
process.env.FEATURE_FINANCE_ENABLED = 'false';
process.env.FEATURE_ORDERS_ENABLED = 'false';
process.env.FEATURE_MANUAL_ORDER_ENTRY = 'true';
process.env.FEATURE_MANUAL_DELIVERY_ENTRY = 'true';
// مهلت ۱۵:۰۰ (BR-04) در پایلوت خاموش است. صریح تثبیت می‌شود چون سنجهٔ ۴ یک اعلام بار
// واقعی ثبت می‌کند: با پرچم روشن، اجرای تست بعد از ساعت ۱۵ به LOAD_002 می‌خورد و
// نتیجه به ساعتِ اجرا وابسته می‌شد.
process.env.FEATURE_REQUEST_CUTOFF_ENFORCED = 'false';
