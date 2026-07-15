# PROGRESS — پیشرفت فاز ۶ و ۷

آخرین به‌روزرسانی: 2026-07-14

## وضعیت کلی
- فازهای ۰ تا ۵.۵: ✅ کامل (بررسی و تایید شده — typecheck و کل تست‌ها سبز)
- فاز ۶ (اتصال ERP): ✅ کامل (Mock-محور، env-driven) — تایید شد با کل تست‌ها سبز
- فاز ۷ (آماده‌سازی Production): ✅ کامل (7a–7e) — تایید شد با کل تست‌ها سبز

### وضعیت تایید نهایی
✅ **کل مجموعه تست سبز: ۳۷ Suite / ۲۰۱ تست / ۰ خطا** (اجرا شد و تایید شد).
دو خطای اولیهٔ FileStorageService و pagination.dto رفع شدند:
- `file-storage.service.ts` → `resolvePath` کلید خام را resolve می‌کند (نقطهٔ پسوند حفظ
  می‌شود) و هر مسیر خارج از ریشه را با بررسی پیشوند + جداکنندهٔ انتهایی رد می‌کند.
- `pagination.dto.spec.ts` → `import 'reflect-metadata'` به‌عنوان اولین خط اضافه شد.

## کارهای انجام‌شده در جلسات قبل (بازبینی/رفع اشکال)
پنج باگ واقعی پیدا و رفع شد (همه تایید شده با ۸۶ تست سبز):
1. `admin-dashboard.service.ts` — کلید روزِ محورِ نمودار با TZ سرور ساخته می‌شد → `iranDayKey`
2. `admin-dashboard.repository.ts` — `date_trunc` روی روز UTC گروه می‌بست → `+ interval '3 hours 30 minutes'`
3. `finance.repository.ts` — فیلتر `to` کل روز پایان را حذف می‌کرد → کران بالای انحصاری (`lt` نیمه‌شب ایرانِ روز بعد)
4. `jalali.util.spec.ts` — فیکسچرها به TZ رانر وابسته بودند → نیمه‌روز UTC
5. `not-configured.adapter.ts` — پرتاب همزمان به‌جای reject شدن Promise → متدهای `async`

## فاز ۶ — Adapterهای واقعی ERP (env-driven، تست با داده Mock)

### انجام شد (این جلسه)
- **`dto/erp-record.mapper.ts` (جدید)**: مپر مشترک «رکورد خام → DTO مرزی» برای هر سه منبع
  (ردیف SQL / JSON REST / رکورد CSV) + `ErpMappingError` با پیام شفاف (نام فیلد و مقدار).
  قرارداد: نام ستون/فیلد سمت ERP = نام فیلدهای DTO بخش ۱۲.۱.
- **`adapters/adapter-config.util.ts` (جدید)**: `requireEnv` (fail-fast در بوت با فهرست
  متغیرهای گم‌شده) + `ErpConnectionError`.
- **`adapters/csv.util.ts` (جدید)**: پارس/سریال‌سازی CSV سازگار RFC4180 (نقل‌قول، BOM، CRLF).
- **`adapters/sql-server.adapter.ts` (بازنویسی کامل)**: Query از Viewهای قراردادی
  (`portal_*`، قابل تغییر از env)، پارامترهای امن (Parameterized)، نوشتن با Stored Procedure،
  Client تنبل `mssql` (نصب درایور فقط هنگام استفادهٔ واقعی: `pnpm add mssql`)،
  پورت `ErpSqlClient` تزریق‌پذیر برای تست.
- **`adapters/rest-api.adapter.ts` (بازنویسی کامل)**: fetch با Bearer key، timeout، ساخت
  Query String، پذیرش آرایهٔ خام یا پاکت `{data: []}`، پورت `ErpHttpFetch` تزریق‌پذیر.
- **`adapters/file-based.adapter.ts` (بازنویسی کامل)**: خواندن CSVهای `<dir>/in/`،
  فیلتر since/customerCode، نوشتن اتمی (tmp+rename) خروجی‌ها در `<dir>/out/`.
- **`adapters/not-configured.adapter.ts` حذف شد** (دیگر لازم نیست؛ fail-fast به سطح env منتقل شد).
- **تست‌ها (جدید)**: `erp-record.mapper.spec.ts`، `csv.util.spec.ts`،
  `sql-server.adapter.spec.ts` (Client ساختگی)، `rest-api.adapter.spec.ts` (fetch ساختگی)،
  `file-based.adapter.spec.ts` (پوشهٔ موقت واقعی)، `skeleton-adapters.spec.ts` (بازنویسی:
  fail-fast پیکربندی ناقص).
- **`.env.example`**: بلوک‌های `ERP_SQL_*`، `ERP_REST_*`، `ERP_FILE_*` مستند شد.
- **`erp-integration.module.ts`**: کامنت‌ها به‌روز شد (هر ۴ Adapter عملیاتی).

### قرارداد «فقط .env تغییر کند»
پس از دریافت اطلاعات کارخانه:
- SQL Server: `ERP_ADAPTER=sql-server` + `ERP_SQL_HOST/PORT/DATABASE/USER/PASSWORD`
  (+ در صورت نیاز نام Viewها) + `pnpm add mssql`
- REST: `ERP_ADAPTER=rest-api` + `ERP_REST_BASE_URL/API_KEY` (+ مسیر Endpointها در صورت تفاوت)
- فایل: `ERP_ADAPTER=file-based` + `ERP_FILE_EXCHANGE_DIR`

### باقی‌مانده در فاز ۶
- [x] اجرای typecheck + کل تست‌ها و سبز شدن — ✅ انجام و تایید شد (۲۰۱ تست سبز)
- [ ] تست با ERP واقعی: ⏸ بلوکه به دریافت اطلاعات اتصال از کارخانه (طبق تصمیم کاربر skip)

## فاز ۷ — وضعیت
### 7a: Rate Limiting با Redis — پیاده‌سازی شد (در انتظار تایید تست)
- **`common/throttling/redis-throttler.storage.ts` (جدید)**: `ThrottlerStorage` مبتنی بر
  Redis با اسکریپت Lua اتمی (INCR + PEXPIRE + کلید Block)، اتصال از `REDIS_URL`،
  درایور `ioredis` تنبل (نصب هنگام استفادهٔ واقعی: `pnpm add ioredis`)،
  Fail-open در قطعی Redis، بستن اتصال در Shutdown، پورت `RedisEvalClient` تزریق‌پذیر.
- **`app.module.ts`**: `ThrottlerModule.forRootAsync` با `storage: RedisThrottlerStorage`.
- **تست**: `redis-throttler.storage.spec.ts` (Client ساختگی — کلیدها/نگاشت رکورد/Fail-open/Shutdown).

### 7b: ذخیره‌سازی واقعی فایل فیش — پیاده‌سازی شد (در انتظار تایید تست)
- **`common/services/file-storage.service.ts` (جدید)**: دیسک محلی env-driven
  (`FILE_STORAGE_DIR`، پیش‌فرض `./storage/uploads`)، نام فایل UUID + پسوند امن
  (مصونیت Path Traversal)، پوشهٔ جدا برای هر مشتری، URL منطقی `storage://`.
- **`finance.service.ts`**: `pending-storage://` حذف شد → `storage.save(...)` واقعی.
- **`common-services.module.ts`**: ثبت/Export سرویس جدید.
- **تست**: `file-storage.service.spec.ts` (پوشهٔ موقت واقعی + سناریوهای Traversal).

### 7c: SMTP واقعی — پیاده‌سازی شد (در انتظار تایید تست)
- **`common/services/mailer.service.ts` (بازنویسی)**: با `SMTP_HOST` پر، از طریق
  `nodemailer` (require تنبل — `pnpm add nodemailer` هنگام فعال‌سازی) واقعاً می‌فرستد؛
  بدون آن فقط Log (رفتار قبلی حفظ شد). خطای ارسال Log می‌شود نه پرتاب.
  پورت `MailTransport` + توکن اختیاری `MAIL_TRANSPORT_FACTORY` برای تست.
- **تست**: `mailer.service.spec.ts` (Transport ساختگی — سه سناریو).

### 7d: Sentry + هدرهای امنیتی — پیاده‌سازی شد (در انتظار تایید تست)
- **`common/observability/sentry.util.ts` (جدید)**: `initSentry` (فقط با `SENTRY_DSN`;
  `@sentry/node` تنبل — بدون DSN کاملاً no-op) + `captureException`.
- **`global-exception.filter.ts`**: خطاهای ≥۵۰۰ به Sentry گزارش می‌شوند.
- **`main.ts`**: `initSentry()` در bootstrap + HSTS در Production (helmet از قبل فعال بود:
  CSP/CORP؛ حالا `strictTransportSecurity` با maxAge یک سال + includeSubDomains).
- **تست**: `sentry.util.spec.ts`.
- **`.env.example`**: `FILE_STORAGE_DIR`، `SENTRY_DSN`، `SENTRY_TRACES_SAMPLE_RATE` و توضیح SMTP.

### 7e: پوشش ≥۸۰٪ + تست بار — در حال انجام
- **اسکریپت تست بار**: `loadtest/loadtest.mjs` (بدون وابستگی، Node fetch) + اسکریپت
  `pnpm loadtest` — سنجش p50/p95/p99 روی `/health` و (با ورود موفق) `/orders` و
  `/finance/transactions`؛ شمارش جداگانهٔ 429. فقط روی توسعه/استیجینگ اجرا شود.
- **تست‌های پوشش جدید (این جلسه)**:
  - `common/utils/decimal.util.spec.ts` — toNum/toNumOrNull (تمایز null از صفر)
  - `common/utils/role.util.spec.ts` — پل نقش Prisma→enum مشترک
  - `common/utils/customer-scope.util.spec.ts` — requireCustomerId (AUTH_004)
  - `common/dto/pagination.dto.spec.ts` — resolvePagination (پیش‌فرض/skip/دفاع)
  - `common/filters/global-exception.filter.spec.ts` — سه مسیر خطا + گزارش Sentry فقط ≥۵۰۰
  - `common/interceptors/transform.interceptor.spec.ts` — قالب استاندارد ۱۱.۱۱ + meta
  - `modules/surveys/survey.state-machine.spec.ts` — جدول انتقال کامل
  - `modules/surveys/surveys.mapper.spec.ts` — درصدگیری BR-27 (بدون تقسیم بر صفر)
  - `modules/orders/orders.mapper.spec.ts` — نگاشت Decimal/enum/تاریخ + جمع null
  - `modules/finance/finance.mapper.spec.ts` — چهار نگاشت مالی
  - `modules/finance/finance.service.spec.ts` — createReceipt (BR-16 + ذخیرهٔ واقعی فاز ۷b)
  - `modules/complaints/complaints.mapper.spec.ts` — نگاشت شکایت (مشتری/ادمین)
  - `modules/loading-requests/loading-requests.mapper.spec.ts` — ماندهٔ درخواست (کف صفر)
  - `modules/auth/services/otp.service.spec.ts` — صدور/مصرف/انقضا/ضدشمارش OTP
  - `modules/auth/services/login-throttle.service.spec.ts` — قفل ۵ تلاش/۱۵ دقیقه (BR بخش ۹.۱)
  - `modules/notifications/notification.service.spec.ts` — ماتریس مقصد اعلانات (بخش ۱۷)
- [x] اجرای کل تست‌ها و سبز شدن — ✅ ۲۰۱ تست سبز، ۰ خطا

### وضعیت تایید — ✅ حل شد
کل مجموعه تست با موفقیت اجرا شد: **۳۷ Suite / ۲۰۱ تست / ۰ خطا**.
مرحلهٔ بعد: QA دستی محلی توسط کاربر روی مرورگر، سپس (فقط پس از تایید صریح کاربر)
`git init` و کامیت‌های per-sub-task با سبک Conventional Commits.

## فاز ۷ — کارهای برنامه‌ریزی‌شده (مرجع اولیه)
- [x] 7a: Rate limiting با Redis (جایگزین in-memory) — کدنویسی شد
- [x] 7b: ذخیره‌سازی واقعی فایل فیش (جایگزین `pending-storage://`) — کدنویسی شد
- [x] 7c: SMTP واقعی برای ایمیل — کدنویسی شد
- [x] 7d: Sentry + تایید Security Headers/HTTPS — کدنویسی شد
- [ ] 7e: پوشش تست ≥۸۰٪ + تست بار پایه

## نکته‌ها
- پروژه مخزن git نیست (`git rev-parse` → not a repository). برای commit های خواسته‌شده باید
  ابتدا `git init` شود — پیش از این کار از کاربر تایید گرفته شود.
