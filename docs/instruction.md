# instruction.md — راهنمای عملیاتی Claude Code
### این فایل مکمل `PRD.md` است. `PRD.md` می‌گوید **چه چیزی** باید ساخته شود؛ این فایل می‌گوید **چطور** کد نوشته شود.

> **قانون طلایی:** اگر بین این فایل و `PRD.md` تناقضی دیدی (مثلاً یک قانون معماری اینجا با یک Business Rule در PRD تداخل دارد)، `PRD.md` همیشه در مورد **رفتار محصول/کسب‌وکار** ارجح است و این فایل در مورد **نحوه نوشتن کد** ارجح است. در صورت ابهام واقعی، متوقف شو و بپرس؛ حدس نزن.

---

## 1. نحوه کار کردن با این پروژه (Workflow با Agent)

1. ابتدا کل `PRD.md` و کل این فایل را بخوان. خلاصه‌ای از برداشتت از فاز اول (بخش ۱۵ PRD) بنویس و **قبل از نوشتن اولین خط کد**، تایید بگیر.
2. پروژه را دقیقاً طبق فازبندی بخش ۱۵ PRD.md پیش ببر. **هیچ فازی را قبل از تکمیل و تست فاز قبل شروع نکن.**
3. در پایان هر فاز: (الف) تست‌های مربوطه را اجرا و نتیجه را گزارش کن، (ب) یک خلاصه کوتاه از آنچه ساخته شد + هر فرض/انحرافی از PRD که مجبور به اتخاذ آن شدی بنویس، (ج) منتظر تایید بمان قبل از فاز بعد.
4. اگر بخشی از PRD واقعاً ابهام دارد (نه این‌که فقط پیچیده است)، متوقف شو و دقیقاً بپرس؛ به‌جای حدس زدن، مفروضه پیش‌فرض معقول را پیشنهاد بده و منتظر تایید بمان.
5. هرگز فاز‌های بعدی را «پیش‌خرید» نکن (مثلاً کد پنل ادمین را در فاز ۱ ننویس، حتی اگر ساده به‌نظر برسد).

---

## 2. قوانین معماری (Architecture Rules)

- **Monorepo:** ساختار دقیقاً طبق بخش ۱۴ PRD.md. هیچ فایلی خارج از این ساختار قرار نگیرد.
- **Backend = NestJS Modular:** هر Domain (`orders`, `loading-requests`, `deliveries`, `finance`, `surveys`, `complaints`, `customers`, `admin`, `erp-integration`, ...) یک Module مستقل NestJS با `*.module.ts`, `*.controller.ts`, `*.service.ts` است.
- **جداسازی لایه‌ها (اجباری):**
  - `Controller` → فقط دریافت Request، اعتبارسنجی DTO، فراخوانی Service. **هیچ منطق کسب‌وکاری در Controller نباشد.**
  - `Service` → منطق کسب‌وکاری (State Machine ها، BR-01 تا BR-27، محاسبات).
  - `Repository` (یا Prisma مستقیم پشت یک Interface) → تنها لایه‌ای که با دیتابیس صحبت می‌کند.
- **Repository Pattern:** حتی اگر مستقیم از Prisma Client استفاده می‌شود، این استفاده باید پشت یک کلاس/Interface Repository اختصاصی هر Domain باشد (مثلاً `OrdersRepository`) — **هرگز `PrismaClient` را مستقیم داخل یک `Service` تزریق نکن**؛ این کار تست‌نویسی Unit Test را غیرممکن می‌کند (نقض بخش ۱۸ PRD).
- **ERP Adapter Pattern (بخش ۱۲ PRD):** ماژول `erp-integration` هرگز نباید مستقیماً import از `MockErpAdapter` یا `SqlServerErpAdapter` در جای دیگر پروژه داشته باشد؛ فقط از طریق DI Token (`ERP_ADAPTER_TOKEN`) تزریق شود.
- **State Machine Services جدا:** `LoadingRequestStateMachine`, `ComplaintStateMachine`, `SurveyStateMachine` هرکدام یک کلاس مستقل با متد `canTransition(from, to)` و `transition(entity, to, context)`. **هیچ‌جای دیگر کد نباید مستقیماً `status` را Set کند.**
- **Frontend = Next.js App Router:**
  - Route Group جدا برای لندینگ عمومی `(public)`، مشتری `(portal)`، و ادمین `(admin)` — سه Layout کاملاً مجزا اما با Component های مشترک از `components/shared/`.
  - Server Component پیش‌فرض؛ فقط جایی که Interactivity واقعی لازم است (`'use client'`) بزن.
  - Data Fetching سمت کلاینت فقط با TanStack Query، هرگز `useEffect` + `fetch` دستی.
- **لندینگ پیج عمومی (بخش ۹.۱۰ PRD) از الگوی متفاوتی پیروی می‌کند:** محتوای آن (اخبار/اطلاعیه/گزارش/عکس/فیلم) از فایل‌های Markdown/MDX در `content/` خوانده می‌شود، **نه از دیتابیس PostgreSQL و نه از هیچ Repository/Service Backend**. هیچ Endpoint یا مدل Prisma برای این محتوا نساز؛ فقط فرم تماس (`/public/contact`) یک Endpoint سبک بدون دیتابیس دارد. این بخش را با همان الگوی Repository Pattern بقیه پروژه قاطی نکن.

---

## 3. قوانین TypeScript

- **`strict: true`** در `tsconfig.json` هر دو اپ (Frontend/Backend)، بدون استثنا.
- **ممنوعیت `any`:** استفاده از `any` **مطلقاً ممنوع** است. اگر نوع واقعاً ناشناخته است از `unknown` + Type Guard استفاده کن.
- تمام DTO های Backend با `class-validator` decorator کامل تعریف شوند (`@IsString()`, `@IsEnum()`, `@IsUUID()`, ...) — بدون DTO معتبر، هیچ Endpoint نباید فعال شود.
- تمام Response Type ها به‌صورت صریح Export شوند و در Frontend (از طریق یک پکیج/فولدر مشترک `packages/shared-types` در صورت استفاده از Monorepo واقعی، یا کپی دستی هماهنگ) استفاده شوند — **عدم تکرار دستی Type بین Front و Back.**
- Enum های Prisma (`LoadingRequestStatus`, `Role`, ...) باید عیناً همان‌هایی باشند که در بخش ۵ PRD.md آمده؛ تغییر نام بدون تایید صریح ممنوع است.

---

## 4. Naming Convention

| مورد | قاعده | مثال |
|---|---|---|
| فایل کامپوننت React | PascalCase | `SmartTable.tsx` |
| فایل غیر-کامپوننت (util/hook/service) | kebab-case | `use-loading-requests.ts`, `loading-request.service.ts` |
| نام کلاس (Backend) | PascalCase + پسوند نوع | `LoadingRequestService`, `OrdersRepository`, `AdminGuard` |
| نام متغیر/تابع | camelCase | `getRemainingQty()` |
| نام Enum و مقادیرش | PascalCase برای نام، UPPER_SNAKE برای مقادیر | `enum LoadingRequestStatus { SUBMITTED, APPROVED }` |
| نام Route API | kebab-case، جمع برای منابع | `/loading-requests`, `/admin/customers` |
| نام Branch گیت | `type/short-description` | `feat/loading-request-cutoff-rule` |
| کلید i18n/متن فارسی | camelCase با namespace | `loadingRequest.cutoffError` |

---

## 5. Clean Code و SOLID

- **Single Responsibility:** هر Service فقط یک Domain را مدیریت می‌کند. اگر `OrdersService` شروع به فراخوانی مستقیم منطق `LoadingRequest` کرد، این یک نقض است — باید از طریق `LoadingRequestsService` عبور کند.
- **DRY اجباری روی Frontend:** اگر یک الگوی جدول/فیلتر/Empty State بیش از یک‌بار تکرار شود، باید به `components/shared/` منتقل شود (بخش ۱۰.۷ PRD) — **ممنوعیت کپی-پیست کامپوننت مشابه در چند صفحه.**
- **Dependency Inversion:** Serviceها به Interface وابسته‌اند نه پیاده‌سازی مشخص (خصوصاً `ErpAdapter`، `Repository`ها) تا Mock کردن در تست ساده باشد.
- توابع طولانی‌تر از ~40 خط یا با بیش از ۳ سطح Nesting شرطی، باید Refactor شوند.
- تمام Magic Number/String (مثلاً `15` برای ساعت Cutoff، رشته‌های کد خطا) باید به‌صورت `const` نام‌گذاری‌شده در یک فایل Config/Constants باشند، نه Hardcode پراکنده.

---

## 6. قوانین کامپوننت React (Component Rules)

- هر کامپوننت مشترک بخش ۱۰.۷ PRD باید:
  - Props Interface صریح و مستند (JSDoc کوتاه) داشته باشد
  - پیش‌فرض بدون Prop اجباری غیرضروری کار کند (مطابق راهنمای عمومی Artifact/Component)
  - تمام ۸ حالت بخش ۱۰.۹ PRD (Loading/Empty/Error/Forbidden/Unauthorized/Success/Skeleton/Offline) را در نظر بگیرد؛ کامپوننت‌های لیستی (`SmartTable`) این حالات را داخلی مدیریت کنند، نه هر صفحه جداگانه.
- **ممنوعیت Inline Style** (`style={{...}}`) مگر برای مقادیر واقعاً Dynamic (مثل درصد پیشرفت محاسبه‌شده در Runtime) — همه‌چیز دیگر از طریق کلاس‌های Tailwind + Design Tokens (بخش ۱۰.۶ PRD).
- **ممنوعیت رنگ/فاصله/اندازه Hardcode** خارج از Tokenهای بخش ۱۰.۶ (مثلاً ننویس `#6D28D9`؛ از متغیر Token/کلاس Tailwind تعریف‌شده استفاده کن).
- فرم‌ها همیشه با React Hook Form + Zod Schema (نه State دستی پراکنده با `useState` برای هر فیلد).
- تمام متن قابل‌مشاهده به کاربر فارسی و از طریق یک منبع متن مرکزی (i18n ساده یا فایل ثابت) باشد، نه پراکنده در JSX.

---

## 7. ممنوعیت‌های صریح (Prohibitions)

این‌ها **هرگز** نباید در کد این پروژه دیده شوند:

- ❌ استفاده از `any` در TypeScript
- ❌ Inline Style در React (به‌جز موارد کاملاً Dynamic)
- ❌ فراخوانی مستقیم `PrismaClient` داخل یک `*.service.ts` بدون عبور از Repository
- ❌ نوشتن منطق کسب‌وکاری (مثل بررسی BR-04 مهلت ساعت ۱۵) داخل Controller
- ❌ Hardcode رشته خطا به‌جای استفاده از کاتالوگ خطا (بخش ۱۶ PRD)
- ❌ `DELETE` واقعی SQL روی مدل‌های Soft-Delete‌پذیر (بخش ۵.۲ PRD) — همیشه Update با `isDeleted=true`
- ❌ فیلتر کردن داده مشتری بر اساس `customerId` ارسالی از Frontend/Query Param — همیشه از JWT
- ❌ فراخوانی مستقیم یک پیاده‌سازی خاص ERP Adapter به‌جای Interface مشترک
- ❌ Commit مستقیم به `main`/`master` بدون Pull Request (حتی در محیط توسعه فردی، عادت درست را رعایت کن)
- ❌ استفاده از `console.log` در کد نهایی Backend (از Logger رسمی NestJS/Pino استفاده کن)
- ❌ نوشتن تست‌هایی که به ساعت واقعی سیستم وابسته‌اند (برای BR-04، ساعت را Mock کن، منتظر ساعت ۱۵ واقعی نمان)

---

## 8. نحوه تولید Commit ها

از **Conventional Commits** استفاده کن:

```
<type>(<scope>): <short description>

[optional body]
```

| Type | استفاده |
|---|---|
| `feat` | قابلیت جدید (مثلاً `feat(loading-requests): add cutoff time validation`) |
| `fix` | رفع باگ |
| `refactor` | بازنویسی بدون تغییر رفتار |
| `test` | افزودن/اصلاح تست |
| `docs` | تغییر مستندات (شامل PRD.md/instruction.md) |
| `chore` | تنظیمات، وابستگی‌ها، CI |
| `style` | فرمت‌بندی صرف (بدون تغییر منطق) |

- هر Commit باید به یک آیتم مشخص از چک‌لیست فازبندی (بخش ۱۵ PRD) قابل ردیابی باشد.
- Commit های بزرگ و آمیخته (مثلاً یک Commit که هم فرم لاگین را می‌سازد هم State Machine اعلام بار را) ممنوع است؛ هر Commit یک تغییر منطقی.

---

## 9. استانداردهای تست (تکمیل بخش ۱۸ PRD)

- هر Service جدید باید همراه با فایل `*.spec.ts` در همان Commit/PR بیاید — **کد بدون تست ادغام نشود.**
- نام تست‌ها توصیفی و به زبان رفتار باشد: `it('should reject loading request after 15:00 Tehran time', ...)`.
- برای تست BR-04 (مهلت ساعت ۱۵)، از `jest.useFakeTimers()` یا تزریق یک `ClockService` Mock‌پذیر استفاده کن؛ هرگز به ساعت واقعی وابسته نباش.
- تست‌های API (Supertest) باید هم مسیر موفق و هم تمام کدهای خطای مرتبط از کاتالوگ بخش ۱۶ را پوشش دهند.
- قبل از ادعای «فاز کامل شد»، خروجی اجرای تست‌ها (تعداد Pass/Fail، درصد Coverage) را گزارش کن.

---

## 10. نحوه استفاده از Mock Data

- از روز اول، `ERP_ADAPTER=mock` در `.env` باشد؛ هرگز منتظر تصمیم واقعی ERP برای نمایش یک نسخه کاربردی نمان (بخش ۱۲.۲ PRD).
- اسکریپت Seed (`prisma/seed.ts`) باید **Idempotent** باشد: اجرای مکرر آن نباید داده تکراری بسازد (چک با `upsert` یا پاک‌سازی قبل از Insert در محیط توسعه فقط).
- حجم و سناریوهای دقیق Seed را از بخش ۱۹ PRD (نه از حدس خودت) بردار.
- داده Mock هرگز نباید در کد Production (مسیر واقعی Runtime غیر از Seed Script) هارد‌کد شود.

---

## 11. قوانین طراحی UI (تکمیل بخش ۱۰ PRD)

- هر صفحه/کامپوننت جدید باید ابتدا Design Tokens بخش ۱۰.۶ را چک کند؛ اگر Token لازم وجود ندارد، به این فایل/PRD اضافه شود، نه این‌که مقدار Hardcode بشود.
- پیش از ساخت هر صفحه لیستی جدید، چک کن که آیا `SmartTable`/`FilterDrawer`/... از قبل پوشش می‌دهد؛ کامپوننت مشابه نساز.
- تمام صفحات باید در حالت RTL/فارسی و با اعداد فارسی تست بصری شوند (نه فقط LTR/انگلیسی در حین توسعه).
- انیمیشن‌ها باید از مقادیر `animation` در Design Tokens استفاده کنند (نه مقدار دلخواه در هر کامپوننت).

---

## 12. مراحل اجرای پروژه (خلاصه عملیاتی)

اجرای گام‌به‌گام دقیقاً طبق بخش ۱۵ PRD.md است. این‌جا فقط تاکید عملیاتی:

1. **قبل از هر فاز:** خلاصه برداشت را بنویس و تایید بگیر (بخش ۱ همین فایل).
2. **در حین فاز:** فقط روی آیتم‌های همان فاز کار کن؛ اگر نیاز به چیزی از فاز بعد احساس شد (مثلاً یک Component داشبورد ادمین حین فاز ۲)، آن را در یک TODO مستند کن و به فاز مربوطه موکول کن.
3. **در پایان فاز:** تست بزن، گزارش بده، منتظر تایید بمان.
4. اگر در طول کار متوجه شدی یک تصمیم قبلی (مثلاً یک مفروضه بخش ۲۰.۲ PRD) اشتباه بوده، **متوقف شو، توضیح بده، و منتظر تصمیم جدید بمان** — خودسرانه معماری تایید‌شده را تغییر نده.

---

**پایان instruction.md.**
این فایل همراه با `PRD.md` باید به‌طور کامل در اختیار Claude Code قرار گیرد؛ این دو سند مکمل یکدیگرند.
