# PRD — پورتال الکترونیک مشتریان کارخانه سیمان خاکستری نی‌ریز (نسخه بازطراحی‌شده)
### سند فنی و محصولی جامع برای پیاده‌سازی توسط ایجنت Claude Code

**نسخه سند:** 1.3
**تاریخ تهیه:** 1404 (2026)
**نوع سند:** PRD + Technical/Design Specification (نسخه محصول‌محور — قوانین کدنویسی در `instruction.md` مجزا آمده است)

**تغییرات نسخه 1.3 نسبت به 1.2:**
- **اصلاح برندینگ:** نام رسمی پروژه از «سیمان هرمزگان» (که فقط یک نمونه UI مرجع بود) به **«سیمان خاکستری نی‌ریز»** (کارفرمای واقعی) در سراسر سند اصلاح شد؛ داده‌های نمونه/آدرس متعلق به شرکت مرجع حذف و Placeholder جایگزین شد (بخش ۱ و ۲۰.۲)
- **تغییر مدل ورود مشتری:** نام کاربری از «شماره موبایل» به **«کد ملی»** تغییر کرد؛ نام کاربری به‌صورت خودکار توسط ادمین هنگام تعریف مشتری از روی کد ملی ساخته می‌شود (BR-28 جدید، بخش ۶.۱ و ۹.۱)؛ فرآیند فراموشی رمز به‌روزرسانی شد (شناسایی با کد ملی، OTP همچنان به موبایل ثبت‌شده)
- **افزودن لندینگ پیج عمومی کارخانه** (بخش جدید ۹.۱۰): وب‌سایت عمومی بدون نیاز به ورود با ۸ صفحه (خانه، اخبار، اطلاعیه‌ها، گزارش‌ها، گالری عکس/فیلم، درباره ما، تماس با ما) + دکمه ورود به پورتال مشتریان؛ محتوا به‌صورت فایل Markdown/MDX توسط پشتیبان سایت مدیریت می‌شود، **کاملاً مستقل از داشبورد ادمین و دیتابیس اصلی** (طبق تایید صریح کارفرما)
- افزودن فاز ۵.۵ به نقشه راه برای پیاده‌سازی لندینگ پیج

**تغییرات نسخه 1.2 نسبت به 1.1 (بر اساس بازخورد بازبینی فنی):**
- افزودن کاتالوگ خطا (بخش ۱۶)، ماتریس اعلانات (بخش ۱۷)، استراتژی تست (بخش ۱۸)، مشخصات کامل Seed Data (بخش ۱۹)
- تکمیل State Machine برای Complaint (۸.۲) و Survey (۸.۳)؛ تغییر مدل Survey از `isActive` boolean به چرخه `DRAFT→PUBLISHED→CLOSED`
- افزودن Design Tokens کامل، Component Library گسترده، Dashboard Widget Catalog، Frontend State Matrix (بخش‌های ۱۰.۶ تا ۱۰.۹)
- تبدیل داشبورد ادمین به Command Center کامل: Latest Activities Feed، شمارنده کاربران آنلاین، نمودار دوم (روند ثبت اعلام بار) (بخش ۹.۹.۱)
- افزودن Soft Delete (بخش ۵.۲)، تقویت AuditLog (previousValue/newValue/userAgent)، مدل `Attachment` آماده‌به‌کار غیرفعال (بخش ۵)
- تکمیل ERP Adapter Interface و افزودن `MockErpAdapter` به‌عنوان پیش‌فرض فاز ۱ (بخش ۱۲.۱ و ۱۲.۲)
- افزودن استراتژی Caching با Redis (بخش ۱۳.۱)
- تفکیک از `instruction.md` (قوانین کدنویسی/معماری مخصوص Claude Code اکنون در فایل جدا)

**تغییرات نسخه 1.1 نسبت به 1.0:**
- افزودن ماژول کامل **داشبورد ادمین/مدیر فروش کارخانه** (بخش جدید ۹.۹) شامل: تعریف مشتری، کارتابل تایید/رد اعلام بار، مدیریت شکایات، مدیریت نظرسنجی
- افزودن فیلدهای جدید به فرم/مدل درخواست اعلام بار: نوع بار (فیکس/غیرفیکس)، شهر مقصد، آدرس تکمیلی، کد پستی مقصد، موبایل تحویل‌گیرنده (BR-07، BR-24)
- فعال‌سازی کامل نقش ADMIN در RBAC (بخش ۶.۲) و Endpointهای اختصاصی (بخش ۱۱.۱۰)
- به‌روزرسانی State Machine: تایید/رد اعلام بار اکنون از داشبورد ادمین انجام می‌شود، نه صرفاً Internal API

---

## فهرست مطالب

1. معرفی، اهداف و دامنه پروژه (Scope)
2. فرآیند کسب‌وکار (Business Flow) — نسخه نهایی تایید شده
3. Stack فنی انتخاب‌شده و دلایل انتخاب
4. معماری کلی سیستم (Architecture)
5. مدل داده و ERD کامل (شامل Soft Delete و Attachment)
6. احراز هویت و سطوح دسترسی (Auth & RBAC)
7. قوانین کسب‌وکار (Business Rules) — دقیق و بدون ابهام
8. ماشین‌های حالت (LoadingRequest، Complaint، Survey)
9. مشخصات دقیق صفحه‌به‌صفحه (Frontend Spec کامل + داشبورد ادمین + لندینگ پیج عمومی)
10. سیستم طراحی بصری (Design System، Tokens، Component Library، Widget Catalog، Frontend States)
11. قرارداد کامل API (Endpoints)
12. لایه یکپارچه‌سازی با ERP + Mock ERP Adapter
13. الزامات غیرفنی (NFR) + استراتژی Caching
14. ساختار پوشه‌بندی پروژه (Folder Structure)
15. نقشه راه و چک‌لیست پیاده‌سازی برای ایجنت
16. کاتالوگ خطاها (Error Catalog)
17. ماتریس اعلانات (Notification Matrix)
18. استراتژی تست (Test Strategy)
19. مشخصات کامل Seed Data
20. پیوست‌ها (واژه‌نامه، مفروضات باز)

---

## 1. معرفی، اهداف و دامنه پروژه

### 1.1 معرفی
این سند مشخصات کامل بازطراحی **پورتال الکترونیک مشتریان کارخانه سیمان خاکستری نی‌ریز** را تعریف می‌کند. سیستم فعلی که تصاویر آن بررسی و پیوست شده (سامانه «سیمان هرمزگان») **صرفاً به‌عنوان نمونه UI/UX مرجع** بررسی شده و متعلق به شرکت دیگری است؛ ساختار صفحات و الگوی تعامل از آن الگوبرداری شده، اما برند، نام، آدرس، اطلاعات تماس و داده‌های نمونه در سراسر این سند باید متعلق به **سیمان خاکستری نی‌ریز** باشد. این یک B2B Customer Portal است که مشتریان کارخانه (خریداران سیمان از طریق بورس کالا) پس از ورود می‌توانند وضعیت مالی، سفارش‌ها، اعلام بار، تحویل‌ها را پیگیری کنند و نظرسنجی/شکایت ثبت کنند.

> ⚠️ **نکته مهم برای Agent:** هر جای این سند که به «سیمان هرمزگان» یا آدرس/تلفن استان هرمزگان اشاره باقی مانده باشد، یک باقیمانده از تصاویر مرجع است، **نه داده واقعی نی‌ریز**. مقادیر واقعی (آدرس کارخانه، تلفن، ایمیل، لوگو) باید توسط کارفرما تامین و در فایل `company-info.ts` (بخش ۹.۱) و Seed Data (بخش ۱۹) جایگزین شود؛ تا آن زمان از مقادیر Placeholder مشخص (مثل `[آدرس کارخانه نی‌ریز]`) استفاده شود، نه داده‌های واقعی شرکت دیگر.

هدف این پروژه، **بازطراحی کامل (Rewrite)** این پورتال است؛ نه صرفاً تغییر ظاهر. تمام قابلیت‌های فعلی باید حفظ شوند، اما با:
- معماری تمیز، قابل‌نگهداری و قابل‌توسعه
- UI/UX مدرن، مینیمال و با جلوه‌ی Glassmorphism (به‌خصوص در داشبورد)
- یکپارچگی استاندارد با سیستم ERP کارخانه
- امکانات جدیدی که در Q&A مشخص شد (بارگذاری فیش واریزی، لغو اعلام بار، و ...)

### 1.2 دامنه پروژه (Scope)

**در دامنه (In-Scope):**
- پورتال مشتریان (Customer-Facing Web App) شامل ۷ ماژول: داشبورد، مالی، سفارشات، اعلام بار، تحویل، نظرسنجی، شکایات
- Backend API کامل برای تمام این ماژول‌ها
- لایه Integration/Adapter برای اتصال به ERP کارخانه (نوع دقیق ERP نامشخص است — طراحی باید مستقل از نوع ERP و قابل‌جایگزین باشد)
- احراز هویت مشتریان (تک‌کاربره به ازای هر مشتری)
- تولید PDF از جدول تحویل (فاکتور/رسید)
- Export Excel در همه جداول
- سیستم اعلان‌ها (Notifications) ساده

**به‌روزرسانی (نسخه 1.1): پنل ادمین اکنون در دامنه پروژه است.** طبق تایید کارفرما، این پروژه شامل **دو رابط کاربری مجزا روی یک Backend مشترک** است:
1. **پورتال مشتریان** (توضیح‌داده‌شده در بخش‌های ۹.۱ تا ۹.۸)
2. **داشبورد ادمین/مدیر فروش کارخانه** — رابط کاربری داخلی برای تعریف مشتری، بررسی/تایید/رد درخواست‌های اعلام بار، پاسخ به شکایات و مدیریت نظرسنجی (شرح کامل در بخش جدید **۹.۹**)

**خارج از دامنه (Out-of-Scope در این فاز):**
- پرداخت آنلاین (درگاه بانکی)
- اتصال نهایی و کامل به ERP واقعی کارخانه (طراحی Adapter آماده است؛ اتصال نهایی منوط به تعیین نوع ERP توسط کارخانه است — بخش ۱۲)
- پرداخت آنلاین (طبق پاسخ شما، بخش مالی فقط Read + آپلود فیش است، نه درگاه پرداخت)

### 1.3 خلاصه ماژول‌ها

| # | ماژول | نوع دسترسی مشتری |
|---|-------|-------------------|
| 1 | داشبورد | Read + ویرایش رمز عبور |
| 2 | مالی | Read + آپلود فیش واریزی |
| 3 | سفارشات | Read Only |
| 4 | اعلام بار | Read + Create (با شرایط) + Cancel |
| 5 | تحویل | Read Only + Print PDF |
| 6 | نظرسنجی | Read + پاسخ (Create) |
| 7 | شکایات | Read + Create |
| 8 | **داشبورد ادمین** (بخش ۹.۹) | نقش جدا (ADMIN): تعریف مشتری، تایید/رد اعلام بار، پاسخ شکایات، مدیریت نظرسنجی |
| 9 | **لندینگ پیج عمومی** (بخش ۹.۱۰) | بدون نیاز به ورود؛ محتوا توسط پشتیبان سایت مدیریت می‌شود، نه از پنل ادمین |

---

## 2. فرآیند کسب‌وکار (Business Flow) — نسخه نهایی

فرآیند زیر توسط کارفرما تایید شده و **مبنای طراحی State Machine و API** است:

```
بورس کالا
   │
   ▼
خرید سیمان توسط مشتری (خارج از این سیستم)
   │
   ▼
اطلاعات خریدار به ERP کارخانه ارسال می‌شود
   │
   ▼
مدیر فروش (بخشی از این پروژه — از طریق داشبورد ادمین):
   ├── ایجاد Customer در ERP
   ├── ایجاد User برای ورود به پورتال (تک‌کاربره)
   └── تخصیص سفارش (Order) به مشتری
   │
   ▼
مشتری وارد پورتال می‌شود (Login)
   │
   ▼
پیگیری سفارش (صفحه سفارشات - Read Only)
   │
   ▼
ثبت درخواست اعلام بار روی یک سفارش خاص
   (محصول + نوع بار/خودرو + تاریخ درخواست، فقط اگر «مانده برگ فروش» کافی باشد)
   │
   ▼
بررسی توسط مدیر فروش (کارتابل ادمین - بخش ۹.۹)
   │
   ├── تایید ──► وضعیت: تایید شده
   └── رد ──► وضعیت: رد شده (پایان مسیر)
   │
   ▼ (در صورت تایید)
بارگیری توسط کارخانه ──► وضعیت: بارگیری شده
   │
   ▼
تکمیل رکورد «تحویل» توسط کارخانه (شماره توزین، راننده، ماشین، مبالغ نهایی)
   │
   ▼
ثبت اسناد مالی در سیستم حسابداری کارخانه (Sync به پورتال از طریق ERP Adapter)
```

**نکته مهم قابل لغو بودن:** مشتری می‌تواند درخواست اعلام بار خود را در وضعیت «ثبت شده» یا «تایید شده» لغو کند، اما **پس از تبدیل وضعیت به «بارگیری شده»، امکان لغو وجود ندارد.**


---

## 3. Stack فنی انتخاب‌شده و دلایل انتخاب

طبق درخواست کارفرما («خودت با توجه به تخصص، بهترین Stack را انتخاب کن»)، Stack زیر برای این پروژه انتخاب شده است. این انتخاب بر اساس نیاز به: پشتیبانی کامل RTL/فارسی، تقویم جلالی، معماری Enterprise قابل‌نگهداری، سرعت توسعه بالا با Claude Code، و اکوسیستم قوی TypeScript در کل Stack (کاهش خطا و افزایش هماهنگی Frontend/Backend) بوده است.

### 3.1 Frontend
| بخش | انتخاب | دلیل |
|---|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** | Server Components، SEO لازم نیست ولی Routing تمیز و Performance بالا؛ اکوسیستم بزرگ |
| استایل | **Tailwind CSS** | توسعه سریع، سازگاری کامل با RTL، کنترل کامل روی Glassmorphism/انیمیشن |
| کامپوننت‌ها | **shadcn/ui** (روی Radix UI) | کامپوننت‌های Accessible، قابل شخصی‌سازی کامل (نه یک UI Kit بسته مثل MUI) |
| مدیریت فرم | **React Hook Form + Zod** | Validation قوی سمت کلاینت، هماهنگ با Zod سمت Backend |
| Data Fetching | **TanStack Query (React Query)** | کش، Refetch، Loading/Error States آماده برای همه جداول |
| نمودارها | **Recharts** | نمودار روند تحویل ماهانه در داشبورد |
| تقویم/تاریخ | **dayjs + dayjs-jalali plugin** یا **react-multi-date-picker** | نمایش و انتخاب تاریخ شمسی در همه فیلترها و فرم اعلام بار |
| اعداد فارسی | Utility اختصاصی (`toPersianDigits`) | نمایش اعداد به فارسی مطابق اسکرین‌شات‌های اصلی |
| آیکون | **lucide-react** | ست آیکون یکدست برای همه صفحات |
| انیمیشن | **Framer Motion** | انیمیشن ورود کارت‌ها، Transition داشبورد Glassmorphism |
| Export Excel (کلاینت) | **SheetJS (xlsx)** یا تولید سمت Backend (ترجیح: Backend، پایین‌تر توضیح داده شده) |

### 3.2 Backend
| بخش | انتخاب | دلیل |
|---|---|---|
| Framework | **NestJS + TypeScript** | معماری Modular، DI، Guard/Interceptor آماده برای RBAC و Audit Log، تولید خودکار Swagger |
| ORM | **Prisma** | Type-safety کامل، Migration ساده، مناسب PostgreSQL |
| دیتابیس | **PostgreSQL** | Enterprise-grade، پشتیبانی JSON، Full-text search برای شکایات/جستجو |
| احراز هویت | **JWT (Access Token کوتاه‌مدت + Refresh Token در httpOnly Cookie)** | امن‌تر از LocalStorage، مناسب SPA/SSR ترکیبی Next.js |
| Validation | **class-validator / class-transformer** (هماهنگ با Zod در Frontend) |
| مستندسازی API | **Swagger (OpenAPI)** خودکار از طریق NestJS |
| تولید PDF | **Puppeteer** (رندر HTML→PDF از همان جدول Print) یا **pdfmake** برای فاکتورهای ساختاریافته |
| تولید Excel | **exceljs** |
| صف/Job (اختیاری فاز بعد) | **BullMQ + Redis** برای Sync دوره‌ای با ERP و Exportهای سنگین |
| فایل/آپلود | ذخیره روی دیسک محلی (یا **MinIO/S3-compatible** برای مقیاس‌پذیری) — برای فیش واریزی |
| Logging | **Pino** + Audit Log اختصاصی در دیتابیس |

### 3.3 زیرساخت
- **Docker Compose** برای orchestration محلی/سرور: `postgres`, `redis`, `backend`, `frontend`, `nginx`
- **Nginx** به‌عنوان Reverse Proxy + SSL Termination
- **CI ساده**: اسکریپت‌های lint/test/build (بدون نیاز به ابزار پیچیده در این فاز)

### 3.4 چرا نه گزینه‌های دیگر؟
- **Vue/Angular** رد شد چون اکوسیستم shadcn/ui + Tailwind با React هماهنگ‌تر و سریع‌تر برای وایب‌کدینگ با Claude Code است.
- **Laravel/Django** رد شد چون TypeScript یکپارچه بین Front/Back، سرعت توسعه با Agent را بالا می‌برد و خطای type mismatch را کم می‌کند.
- **GraphQL** رد شد؛ REST برای این حجم از صفحات (لیست‌محور با فیلتر/صفحه‌بندی ساده) کافی و ساده‌تر برای نگهداری است.
- **SQL Server مستقیم به‌عنوان DB اصلی** رد شد؛ پیشنهاد می‌شود دیتابیس اصلی پورتال PostgreSQL باشد و داده‌های ERP (که احتمالاً روی SQL Server یا سیستم دیگری است) از طریق لایه Adapter/Sync به آن آورده شود (بخش 12). این تصمیم امنیت، Performance و استقلال پورتال از ERP را تضمین می‌کند.

---

## 4. معماری کلی سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│   (Customer Portal UI - RTL - Jalali - Glassmorphism)         │
└───────────────────────────┬────────────────────────────────┘
                             │ REST/JSON (HTTPS)
┌───────────────────────────▼────────────────────────────────┐
│                     NestJS Backend API                       │
│  ┌───────────┬───────────┬───────────┬───────────┬────────┐ │
│  │   Auth    │ Customers │  Orders   │  Loading  │Delivery│ │
│  │  Module   │  Module   │  Module   │  Requests │ Module │ │
│  ├───────────┼───────────┼───────────┼───────────┼────────┤ │
│  │  Finance  │  Survey   │ Complaint │Notification│ Audit │ │
│  │  Module   │  Module   │  Module   │  Module   │ Module │ │
│  └───────────┴───────────┴───────────┴───────────┴────────┘ │
│                             │                                 │
│                  ┌──────────▼──────────┐                     │
│                  │  ERP Integration     │                     │
│                  │  Adapter Layer       │                     │
│                  │  (Port/Adapter Pattern)                    │
│                  └──────────┬──────────┘                     │
└─────────────────────────────┼─────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  ERP System   │ │  SQL Server   │ │  سایر منابع   │
      │ (سپیدار/راهکاران│ │  (در صورت نبود │ │  احتمالی      │
      │  /SAP/اختصاصی) │ │   API از ERP)  │ │              │
      └──────────────┘ └──────────────┘ └──────────────┘

              ┌─────────────┐        ┌─────────────┐
              │ PostgreSQL  │        │    Redis    │
              │ (DB اصلی    │        │ (Cache/Queue│
              │  پورتال)    │        │  اختیاری)   │
              └─────────────┘        └─────────────┘
```

### 4.1 اصول معماری Backend (NestJS)
- **Module-per-domain**: هر ماژول کسب‌وکاری (Orders، LoadingRequests، Delivery، Finance، Survey، Complaint) یک Nest Module مستقل با Controller/Service/Repository خودش
- **Repository Pattern** روی Prisma برای جداسازی منطق دیتابیس از منطق کسب‌وکار
- **Guard لایه‌ای**: `JwtAuthGuard` (احراز هویت) + `CustomerScopeGuard` (اطمینان از این‌که مشتری فقط داده‌های خودش را می‌بیند — بر اساس `customerId` توکن، نه Query Param قابل‌دستکاری)
- **Interceptor برای Audit Log**: تمام عملیات Write (POST/PATCH/DELETE) به‌صورت خودکار در `AuditLog` ثبت می‌شوند
- **DTO + class-validator** برای هر Endpoint (Request/Response Shape مشخص و مستند در Swagger)
- **Global Exception Filter** برای پاسخ خطای یکدست (فرمت JSON استاندارد با کد و پیام فارسی)

### 4.2 اصول معماری Frontend (Next.js)
- **App Router** با ساختار `app/(portal)/dashboard`, `app/(portal)/finance`, ... و یک Layout مشترک برای Header+Navbar
- **Server Components** برای صفحات لیست (fetch اولیه سمت سرور برای سرعت)، **Client Components** برای فرم‌ها/فیلترها/Interactivity
- **TanStack Query** برای refetch/cache بعد از اولین رندر (مثلاً بعد از تغییر فیلتر)
- کامپوننت‌های مشترک: `<DataTable>` (جدول عمومی با صفحه‌بندی/Sort/Sum Row)، `<FilterBar>`، `<ExportButtons>`، `<EmptyState>`، `<StatusBadge>`، `<GlassCard>`
- تمام متن‌ها و اعداد باید از طریق i18n/Utility فارسی‌سازی رندر شوند (نه Hardcode پراکنده)


---

## 5. مدل داده و ERD کامل

### 5.1 نمودار روابط (خلاصه)

```
Customer 1───1 User
Customer 1───* Order
Customer 1───* LoadingRequest
Customer 1───* FinancialTransaction
Customer 1───* Complaint
Customer 1───* SurveyAnswer
Customer 1───* PaymentReceipt
Customer 1───* Notification

Order 1───* LoadingRequest        (یک سفارش، چند اعلام بار)
LoadingRequest 1───1 Delivery      (هر اعلام‌بارِ بارگیری‌شده، دقیقاً یک رکورد تحویل تولید می‌کند)
Product 1───* Order
Product 1───* LoadingRequest
Carrier 1───* LoadingRequest (nullable)
Carrier 1───* Delivery (nullable)

Survey 1───* SurveyQuestion
SurveyQuestion 1───* SurveyOption
Survey 1───* SurveyAnswer
SurveyAnswer 1───* SurveyAnswerDetail
SurveyAnswerDetail *───1 SurveyOption
```

### 5.2 قرارداد Soft Delete

**هیچ رکوردی با `DELETE` واقعی SQL حذف نمی‌شود** — اما این قانون فقط روی موجودیت‌های **مرجع/مدیریت‌شده توسط ادمین** اعمال می‌شود، نه روی رکوردهای تراکنشی:

**✅ Soft Delete دارند** (`Customer`, `User`, `Product`, `Carrier`, `Survey`, `SurveyQuestion`, `SurveyOption`, `Attachment`):
```prisma
// این ۳ فیلد روی همه مدل‌های بالا تکرار می‌شود
isDeleted  Boolean   @default(false)
deletedAt  DateTime?
deletedBy  String?   // userId کاربری که حذف را انجام داده (معمولاً ادمین)
```
- تمام Queryهای Prisma روی این مدل‌ها باید به‌طور پیش‌فرض `where: { isDeleted: false }` داشته باشند (پیشنهاد: Prisma Middleware/Client Extension سراسری برای اعمال خودکار این فیلتر)
- عملیات «حذف» در UI ادمین (مثلاً حذف/غیرفعال‌سازی مشتری) در واقع یک `PATCH` است که `isDeleted=true, deletedAt=now(), deletedBy=<adminUserId>` را ست می‌کند، نه `DELETE` واقعی
- `isDeleted` و `deletedAt` باید همیشه هم‌زمان (در یک Transaction) تغییر کنند تا ناهماهنگ نشوند

**❌ Soft Delete ندارند** (`Order`, `LoadingRequest`, `Delivery`, `FinancialTransaction`, `PaymentReceipt`, `Complaint`, `Notification`, `AuditLog`, `ErpSyncLog`):
- `Order`/`Delivery`/`FinancialTransaction` رکوردهای Sync‌شده از ERP هستند و اساساً از پورتال حذف نمی‌شوند
- `LoadingRequest`/`Complaint` چرخه عمر خودشان را از طریق State Machine (بخش ۸) مدیریت می‌کنند (`CANCELED`/`ANSWERED` و ...) که همان نقش «حذف نرم» را ایفا می‌کند؛ افزودن یک فیلد `isDeleted` جدا روی این مدل‌ها فقط ابهام اضافه می‌کند
- `AuditLog`/`Notification`/`PaymentReceipt` رکوردهای تاریخی/لاگ هستند که اصلاً نباید حذف‌پذیر باشند



### 5.3 تعریف کامل موجودیت‌ها (Prisma Schema — پایه)

```prisma
// ==================== USER & CUSTOMER ====================

model Customer {
  id             String   @id @default(cuid())
  erpCustomerId  String?  @unique          // شناسه مشتری در ERP (کد تفصیل)
  customerCode   String   @unique           // کد تفصیل
  nationalId     String?                    // کد ملی
  economicCode   String?                    // کد اقتصادی
  name           String                     // نام مشتری
  address        String?  @db.Text
  postalCode     String?
  mobile         String   @unique           // شماره موبایل - برای پیامک/OTP و پیش‌فرض recipientMobile (BR-24)؛ Username ورود نیست
  creditLimit    Decimal? @db.Decimal(18,2) // اعتبار
  creditBalance  Decimal? @db.Decimal(18,2) // مانده اعتبار فعلی
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  isDeleted      Boolean  @default(false)   // Soft Delete - بخش ۵.۲
  deletedAt      DateTime?
  deletedBy      String?

  user            User?
  orders          Order[]
  loadingRequests LoadingRequest[]
  transactions    FinancialTransaction[]
  complaints      Complaint[]
  surveyAnswers   SurveyAnswer[]
  paymentReceipts PaymentReceipt[]
  notifications   Notification[]
}

model User {
  id           String   @id @default(cuid())
  customerId   String?  @unique             // هر مشتری فقط یک کاربر؛ برای کاربران ADMIN مقدار null است
  customer     Customer? @relation(fields: [customerId], references: [id])
  username     String   @unique             // برای CUSTOMER = کد ملی (کپی از Customer.nationalId هنگام ایجاد - BR-26)؛ برای ADMIN = شناسه انتخابی ادمین (مثلاً موبایل خودش)
  fullName     String?                      // نام کامل - عمدتاً برای نمایش نام ادمین
  passwordHash String
  role         Role     @default(CUSTOMER)
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  lastActivityAt DateTime?                  // برای KPI «کاربران آنلاین» در داشبورد ادمین (بخش ۹.۹.۱) - هر Request معتبر آن را Update می‌کند
  mustResetPassword Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  isDeleted    Boolean  @default(false)
  deletedAt    DateTime?
  deletedBy    String?

  // قانون سطح اپلیکیشن (Application-level Constraint، نه DB Constraint):
  // اگر role = CUSTOMER ⇒ customerId اجباری است
  // اگر role = ADMIN    ⇒ customerId باید null باشد
}

enum Role {
  CUSTOMER
  ADMIN        // مدیر فروش کارخانه - داشبورد ادمین (بخش ۹.۹) - اکنون در دامنه فاز ۱
}

// ==================== PRODUCT / CARRIER ====================

model Product {
  id          String   @id @default(cuid())
  erpCode     String   @unique             // کد محصول (مثلاً 2001240001)
  name        String                        // نام محصول
  type        ProductType
  isActive    Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  deletedBy   String?

  orders          Order[]
  loadingRequests LoadingRequest[]
  deliveries      Delivery[]
}

enum ProductType {
  BAGGED   // پاکتی
  BULK     // فله
}

model Carrier {
  id          String   @id @default(cuid())
  name        String                        // نام شرکت باربری
  contactInfo String?
  isActive    Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  deletedBy   String?

  loadingRequests LoadingRequest[]
  deliveries      Delivery[]
}

// ==================== ORDER ====================

model Order {
  id                  String   @id @default(cuid())
  erpOrderId          String?  @unique
  orderNumber         String   @unique
  customerId          String
  customer            Customer @relation(fields: [customerId], references: [id])
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  orderDate           DateTime
  totalQty            Decimal  @db.Decimal(18,3)  // مقدار
  deliveredQty        Decimal  @db.Decimal(18,3) @default(0) // مقدار حمل‌شده
  remainingQty        Decimal  @db.Decimal(18,3)  // مقدار باقیمانده (محاسبه‌شده یا Sync از ERP)
  basePrice           Decimal  @db.Decimal(18,2)  // فی پایه
  baseAmount          Decimal  @db.Decimal(18,2)  // مبلغ پایه
  deliveredAmount     Decimal  @db.Decimal(18,2) @default(0) // مبلغ حمل‌شده
  vatAmount           Decimal  @db.Decimal(18,2)  // ارزش افزوده
  priceWithFactors    Decimal  @db.Decimal(18,2)  // فی با عوامل
  amountWithFactors   Decimal  @db.Decimal(18,2)  // مبلغ با عوامل
  remainingAmount     Decimal  @db.Decimal(18,2)  // مبلغ باقیمانده
  status              OrderStatus @default(IN_USE)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  loadingRequests LoadingRequest[]
}

enum OrderStatus {
  IN_USE        // در حال استفاده
  COMPLETED     // تکمیل‌شده (مقدار باقیمانده صفر)
  EXPIRED       // منقضی (در صورت وجود چنین قانونی در ERP)
}

// ==================== LOADING REQUEST (اعلام بار) ====================

model LoadingRequest {
  id               String   @id @default(cuid())
  requestNumber    String   @unique          // شماره اعلام بار (مثلاً 14023۱۷۴۷/۱)
  orderId          String
  order            Order    @relation(fields: [orderId], references: [id])
  customerId       String
  customer         Customer @relation(fields: [customerId], references: [id])
  productId        String
  product          Product  @relation(fields: [productId], references: [id])
  requestedQty     Decimal  @db.Decimal(18,3) // مقدار درخواستی
  vehicleType      VehicleType               // نوع خودرو (فقط مشتری تعیین می‌کند)
  loadType         LoadType                  // نوع بار: فیکس (تناژ ثابت/کامیون کامل) یا غیرفیکس (تناژ متغیر) — تایید‌شده در Q&A
  requestDate      DateTime                   // تاریخ درخواستی برای بارگیری (باید = فردا)
  destinationCity  String                     // شهر مقصد بار
  additionalAddress String? @db.Text          // آدرس تکمیلی و توضیحات (مختصر)
  destinationPostalCode String?               // کد پستی مقصد بار
  recipientMobile  String                     // موبایل تحویل‌گیرنده - پیش‌فرض = موبایل حساب مشتری، مشتری می‌تواند در فرم تغییر دهد (BR-24)
  carrierId        String?                    // باربری - اختیاری، توسط مشتری یا کارخانه
  carrier          Carrier? @relation(fields: [carrierId], references: [id])
  carrierSetBy     CarrierSetBy? 
  status           LoadingRequestStatus @default(SUBMITTED)
  submittedAt      DateTime @default(now())
  reviewedAt       DateTime?
  reviewedBy       String?                    // userId ادمینی که تایید/رد کرده (بخش 9.9)
  reviewedByNote   String?  @db.Text          // یادداشت/دلیل رد یا تایید (نمایش داده می‌شود به مشتری)
  canceledAt       DateTime?
  loadedAt         DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  delivery         Delivery?
}

enum VehicleType {
  TRAILER      // تریلی
  FLATBED      // کفی
  DUMP         // کمپرسی
  TEN_WHEEL    // ده چرخ
}

enum LoadType {
  FIXED        // فیکس: بارگیری کامل کامیون - تناژ ثابت
  NON_FIXED    // غیرفیکس: تناژ متغیر/دلخواه مشتری
}

enum CarrierSetBy {
  CUSTOMER
  FACTORY
}

enum LoadingRequestStatus {
  SUBMITTED   // ثبت شده
  APPROVED    // تایید شده
  REJECTED    // رد شده
  LOADED      // بارگیری شده
  CANCELED    // لغو شده
}

// ==================== DELIVERY (تحویل) ====================

model Delivery {
  id                  String   @id @default(cuid())
  weighingNumber      String   @unique        // شماره توزین
  loadingRequestId    String   @unique
  loadingRequest      LoadingRequest @relation(fields: [loadingRequestId], references: [id])
  deliveryDate        DateTime
  carrierId           String?
  carrier             Carrier? @relation(fields: [carrierId], references: [id])
  vehicleNumber       String?                  // شماره ماشین - تکمیل توسط کارخانه
  driverName          String?                  // راننده - تکمیل توسط کارخانه
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  deliveredQty        Decimal  @db.Decimal(18,3) // تحویل
  basePrice           Decimal  @db.Decimal(18,2) // فی پایه
  baseAmount          Decimal  @db.Decimal(18,2) // مبلغ پایه
  vatAmount           Decimal  @db.Decimal(18,2) // ارزش افزوده
  deductions          Decimal  @db.Decimal(18,2) @default(0) // کسورات
  amountWithFactors   Decimal  @db.Decimal(18,2) // مبلغ با عوامل
  status              DeliveryStatus @default(FINALIZED)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum DeliveryStatus {
  FINALIZED
  DISPUTED     // در صورت وجود شکایت مرتبط
}

// ==================== FINANCE ====================

model FinancialTransaction {
  id            String   @id @default(cuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  docNumber     String                        // شماره سند
  date          DateTime
  operationType String                        // نوع عملیات
  bankName      String?
  accountNumber String?
  amount        Decimal  @db.Decimal(18,2)
  description   String?  @db.Text
  dueDate       DateTime?                      // سررسید
  debit         Decimal? @db.Decimal(18,2)     // بدهکار (برای تب صورت‌وضعیت)
  credit        Decimal? @db.Decimal(18,2)     // بستانکار
  balance       Decimal? @db.Decimal(18,2)     // مانده
  status        String
  source        FinanceSourceType @default(TRANSACTION) // تعیین اینکه این رکورد در کدام تب نمایش داده شود
  createdAt     DateTime @default(now())
}

enum FinanceSourceType {
  TRANSACTION       // تراکنش‌ها
  STATEMENT         // صورت حساب‌ها
  ASSET_REPORT      // گزارش دارایی
  STATUS_STATEMENT  // صورت وضعیت
}

model PaymentReceipt {
  id              String   @id @default(cuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  fileUrl         String
  amount          Decimal? @db.Decimal(18,2)
  description     String?  @db.Text
  uploadedAt      DateTime @default(now())
  status          ReceiptStatus @default(PENDING)
  reviewedAt      DateTime?
  reviewNote      String?
}

enum ReceiptStatus {
  PENDING
  REVIEWED
  REJECTED
}

// ==================== SURVEY (فقط چندگزینه‌ای) ====================

model Survey {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  status      SurveyStatus @default(DRAFT)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  publishedAt DateTime?
  closedAt    DateTime?
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  deletedBy   String?

  questions SurveyQuestion[]
  answers   SurveyAnswer[]
}

enum SurveyStatus {
  DRAFT      // پیش‌نویس - در حال ساخت توسط ادمین، برای مشتری قابل‌مشاهده نیست
  PUBLISHED  // منتشرشده - فعال و قابل پاسخ برای مشتریان
  CLOSED     // بسته‌شده - دیگر قابل پاسخ نیست، اما نتایج آن قابل مشاهده در آرشیو ادمین است
}

model SurveyQuestion {
  id         String   @id @default(cuid())
  surveyId   String
  survey     Survey   @relation(fields: [surveyId], references: [id])
  text       String
  order      Int      @default(0)
  isDeleted  Boolean  @default(false)
  deletedAt  DateTime?

  options SurveyOption[]
}

model SurveyOption {
  id         String   @id @default(cuid())
  questionId String
  question   SurveyQuestion @relation(fields: [questionId], references: [id])
  text       String
  order      Int      @default(0)
  isDeleted  Boolean  @default(false)
  deletedAt  DateTime?
}

model SurveyAnswer {
  id          String   @id @default(cuid())
  surveyId    String
  survey      Survey   @relation(fields: [surveyId], references: [id])
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  submittedAt DateTime @default(now())

  details SurveyAnswerDetail[]

  @@unique([surveyId, customerId]) // هر مشتری فقط یک بار به هر نظرسنجی پاسخ می‌دهد
}

model SurveyAnswerDetail {
  id             String   @id @default(cuid())
  surveyAnswerId String
  surveyAnswer   SurveyAnswer @relation(fields: [surveyAnswerId], references: [id])
  questionId     String
  selectedOptionId String
}

// ==================== COMPLAINT (متن ساده + یک پاسخ نهایی) ====================

model Complaint {
  id           String   @id @default(cuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id])
  subject      String                         // موضوع
  description  String   @db.Text              // شرح شکایت
  submittedAt  DateTime @default(now())
  status       ComplaintStatus @default(PENDING)
  reply        String?  @db.Text              // پاسخ نهایی
  repliedAt    DateTime?
}

enum ComplaintStatus {
  PENDING    // در حال بررسی
  ANSWERED   // پاسخ داده شده
}

// ==================== NOTIFICATION / AUDIT ====================

model Notification {
  id         String   @id @default(cuid())
  customerId String?                          // null = Broadcast برای همه
  customer   Customer? @relation(fields: [customerId], references: [id])
  title      String
  body       String   @db.Text
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model AuditLog {
  id            String   @id @default(cuid())
  userId        String?                          // کاربر انجام‌دهنده (مشتری یا ادمین)
  userRole      Role?                             // نقش در لحظه انجام عملیات (CUSTOMER/ADMIN)
  action        String                            // مثلاً LOADING_REQUEST_APPROVE، CUSTOMER_CREATE
  entityType    String                            // مثلاً LoadingRequest، Customer
  entityId      String?
  previousValue Json?                             // مقدار قبل از تغییر (برای عملیات Update)
  newValue      Json?                             // مقدار بعد از تغییر
  ip            String?
  userAgent     String?  @db.Text                 // Browser/Device اطلاعات
  createdAt     DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
}

// ==================== ATTACHMENT (عمومی - آماده برای آینده) ====================
// ⚠️ طبق تایید صریح کارفرما، شکایات در فاز ۱ پیوست فایل ندارند (BR-22).
// این مدل به‌صورت آماده و Polymorphic طراحی شده تا در صورت نیاز آینده (مثلاً افزودن
// پیوست به شکایات یا اعلام بار) صرفاً با یک Migration کوچک و بدون تغییر معماری اضافه شود.
// در فاز ۱ هیچ UI/Endpoint فعالی از این مدل استفاده نمی‌کند (Feature-Flagged Off).
model Attachment {
  id         String   @id @default(cuid())
  entityType String                                // مثلاً "Complaint", "LoadingRequest"
  entityId   String
  fileUrl    String
  fileName   String
  mimeType   String
  fileSizeKb Int?
  uploadedBy String?                                // userId آپلودکننده
  uploadedAt DateTime @default(now())
  isDeleted  Boolean  @default(false)
  deletedAt  DateTime?
  deletedBy  String?

  @@index([entityType, entityId])
}

// ==================== ERP SYNC ====================

model ErpSyncLog {
  id            String   @id @default(cuid())
  entityType    String                          // Customer, Order, Product, FinancialTransaction, ...
  startedAt     DateTime @default(now())
  finishedAt    DateTime?
  status        String                          // SUCCESS / FAILED / RUNNING
  recordsSynced Int?
  errorMessage  String? @db.Text
}
```

> ⚠️ توجه برای Agent: نام دقیق فیلدها/Enumها را می‌توان در حین پیاده‌سازی با API واقعی ERP هماهنگ کرد؛ ساختار بالا Baseline قابل‌اتکاست و هر تغییری باید Backward-compatible با این PRD مستند شود.

> یادآوری: قرارداد Soft Delete (شامل `Attachment` بالا) طبق بخش ۵.۲ اعمال می‌شود.

---

## 6. احراز هویت و سطوح دسترسی (Auth & RBAC)

### 6.1 مدل احراز هویت

- **ورود مشتری:** با «کد ملی» (Username) + «رمز عبور» — طبق تایید صریح کارفرما، نام کاربری هر مشتری همان **کد ملی** اوست (نه شماره موبایل). فیلد نام کاربری در UI با آیکون کارت‌شناسایی (نه گوشی) و Placeholder «کد ملی خود را وارد نمایید» نمایش داده می‌شود؛ Validation: دقیقاً ۱۰ رقم عددی + الگوریتم استاندارد اعتبارسنجی کد ملی ایران (Checksum).
- **ورود ادمین:** مسیر جدا `/admin/login`؛ نام کاربری ادمین یک شناسه دلخواه (مثلاً موبایل خودِ ادمین) است، نه کد ملی مشتری — چون ادمین به هیچ رکورد Customer متصل نیست (بخش ۶.۲).
- کاربر و رمز عبور اولیه هر مشتری **فقط توسط ادمین از داشبورد ادمین ایجاد می‌شود** (بخش ۹.۹.۲، BR-26)؛ **این پورتال ثبت‌نام (Sign-up) عمومی ندارد.**
- **BR-28 (تولید خودکار Username):** هنگام ایجاد مشتری جدید توسط ادمین، فیلد `User.username` به‌صورت خودکار و غیرقابل‌ویرایش برابر با `Customer.nationalId` ست می‌شود (نه یک فیلد جدا که ادمین وارد کند)؛ اگر کد ملی تکراری باشد، خطای `ADMIN_001` برگردانده می‌شود.
- **JWT Access Token** (عمر ۱۵ دقیقه) در Header `Authorization: Bearer` ارسال می‌شود
- **Refresh Token** (عمر ۷ روز) در Cookie با فلگ‌های `httpOnly, Secure, SameSite=Strict` ذخیره می‌شود
- Endpoint تمدید: `POST /auth/refresh`
- **فراموشی رمز عبور:** مشتری ابتدا «کد ملی» خود را وارد می‌کند (برای شناسایی حساب) → سیستم کد یکبارمصرف (OTP) را به شماره موبایل ثبت‌شده در پروفایل او (`Customer.mobile`، نه فیلدی که در این مرحله وارد می‌شود) پیامک می‌کند، همراه با نمایش بخشی از شماره Mask‌شده (مثلاً «کد به شماره ...۹۸۲۴ ارسال شد») → کاربر OTP را وارد و رمز جدید تعیین می‌کند. (نیازمند SMS Provider - بخش ۲۰.۲ مورد ۵)
- **ویرایش رمز عبور از داشبورد:** مطابق تصویر، فقط فیلد «رمز عبور جدید» (بدون نیاز به رمز فعلی طبق UI فعلی — پیشنهاد می‌شود برای امنیت بیشتر، فیلد «رمز عبور فعلی» هم اضافه شود؛ این یک بهبود امنیتی پیشنهادی است، نه تغییر اجباری)

### 6.2 مدل دسترسی (RBAC)

دو نقش فعال در سیستم:

**نقش CUSTOMER (مشتری):**
- هر رکورد `User` با `role=CUSTOMER` دقیقاً به یک `Customer` متصل است (رابطه ۱ به ۱) — طبق تایید صریح کارفرما («هر مشتری فقط یک کاربر دارد»)
- **Data Scoping اجباری:** تمام Query های Backend در مسیرهای `/api/v1/*` باید بر اساس `customerId` استخراج‌شده از JWT فیلتر شوند، **نه از پارامتر ارسالی در URL/Body**. این مهم‌ترین قانون امنیتی پروژه است تا مشتری A نتواند داده مشتری B را ببیند.
- کاربر و رمز عبور مشتری توسط ادمین از داشبورد ادمین ایجاد می‌شود (بخش ۹.۹.۱)؛ **این پورتال ثبت‌نام عمومی ندارد.**

**نقش ADMIN (مدیر فروش کارخانه) — اکنون در دامنه فاز ۱:**
- کاربران ADMIN رکورد `Customer` ندارند (`customerId = null`)
- ورود ادمین از مسیر جدا `/admin/login` با همان جدول `User` اما `role=ADMIN` (رمز عبور مجزا، بدون اشتراک با حساب مشتری)
- تمام مسیرهای Backend مربوط به ادمین زیر پیشوند `/api/v1/admin/*` قرار می‌گیرند و توسط `AdminGuard` محافظت می‌شوند (بررسی `role === 'ADMIN'` از JWT)
- ادمین به داده **همه مشتریان** دسترسی دارد (بدون Customer Scoping)، اما تمام عملیات نوشتنیِ او (تایید/رد، پاسخ شکایت، ایجاد نظرسنجی، ایجاد مشتری) در `AuditLog` با `userId` ادمین ثبت می‌شود
- کاربران ADMIN اولیه از طریق Seed/Migration مستقیم در دیتابیس ایجاد می‌شوند (چون UI ثبت‌نام ادمین در این فاز نداریم؛ افزودن ادمین جدید فعلاً کار DevOps/DBA است، نه یک صفحه در UI)
- **Internal Service Auth (برای فاز ۶ - یکپارچه‌سازی ERP):** برای فراخوانی‌هایی که مستقیماً از طرف ERP انجام می‌شود (نه از طریق داشبورد ادمین)، مانند Sync خودکار وضعیت «بارگیری شده» (`LOADED`)، از یک **API Key اختصاصی سرویس‌به‌سرویس** استفاده می‌شود (Header: `X-Internal-Api-Key`)، جدا از JWT کاربران. تایید/رد درخواست‌های اعلام بار دیگر Internal API نیست و مستقیماً از داشبورد ادمین (JWT ADMIN) انجام می‌شود.

---

## 7. قوانین کسب‌وکار (Business Rules)

این بخش، دقیق‌ترین و **حیاتی‌ترین** بخش برای پیاده‌سازی بدون ابهام است.

### 7.1 قوانین سفارش (Order)
- BR-01: مشتری هیچ‌گاه نمی‌تواند سفارش ایجاد، ویرایش، حذف یا لغو کند. صفحه سفارشات ۱۰۰٪ Read Only است.
- BR-02: سفارش‌ها از ERP Sync می‌شوند (بخش 12)؛ Backend پورتال هرگز مستقیماً این جدول را از UI مشتری تغییر نمی‌دهد.
- BR-03: فیلتر «دارای مانده» فقط سفارش‌هایی را نشان می‌دهد که `remainingQty > 0`.

### 7.2 قوانین درخواست اعلام بار (LoadingRequest) — هسته اصلی سیستم

- **BR-04 (مهلت ثبت درخواست):** ثبت درخواست اعلام بار فقط برای «روز بعد» (Requested Delivery Date = فردا) امکان‌پذیر است، و فقط تا ساعت **۱۵:۰۰ همان روز**. پس از ساعت ۱۵:۰۰، فرم ثبت درخواست غیرفعال می‌شود (Disabled + پیام «مهلت ثبت درخواست برای فردا به پایان رسیده است»).
  - پیاده‌سازی: Backend باید در لحظه دریافت Request، `now` سرور را با Timezone `Asia/Tehran` بررسی کند؛ اگر `now.hour >= 15` باشد، درخواست رد می‌شود (HTTP 422) حتی اگر UI به‌هر دلیلی فرم را نمایش داده باشد (Defense-in-depth).
- **BR-05 (بررسی موجودی):** قبل از ثبت، Backend باید بررسی کند که: `requestedQty <= (order.totalQty - Σ(loadingRequest.requestedQty که status IN [SUBMITTED, APPROVED, LOADED]))`. اگر موجودی کافی نبود، خطای واضح فارسی برگردانده شود: «مقدار درخواستی بیشتر از باقیمانده سفارش شماست».
- **BR-06 (رابطه سفارش با اعلام بار):** هر سفارش می‌تواند چندین اعلام بار داشته باشد (One Order → Many LoadingRequests)، مثال: سفارش ۱۰۰ تن → ۴ درخواست ۲۵ تنی.
- **BR-07 (فیلدهای فرم ثبت درخواست — به‌روزشده):** مشتری این فیلدها را وارد می‌کند:
  1. محصول (از بین محصولات همان سفارش، همراه با نمایش نوع فله/کیسه)
  2. مقدار درخواستی
  3. نوع خودرو (تریلی/کفی/کمپرسی/ده‌چرخ)
  4. **نوع بار** (فیکس = بارگیری کامل کامیون/تناژ ثابت، غیرفیکس = تناژ متغیر/دلخواه)
  5. تاریخ درخواستی (پیش‌فرض = فردا، غیرقابل تغییر یا محدود به فردا)
  6. **شهر مقصد بار**
  7. **آدرس تکمیلی و توضیحات** (اختیاری، مختصر)
  8. **کد پستی مقصد بار** (اختیاری)
  9. **موبایل تحویل‌گیرنده** — پیش‌فرض با موبایل حساب مشتری پر می‌شود (`recipientMobile = customer.mobile`) اما مشتری می‌تواند آن را در همین فرم به شماره موبایل شخص تحویل‌گیرنده/راننده تغییر دهد (BR-24)
  10. به‌صورت اختیاری: باربری (در صورت تمایل مشتری به تعیین آن)
- **BR-08 (باربری اختیاری دوطرفه):** انتخاب باربری اختیاری است و هم مشتری هم کارخانه می‌توانند آن را تعیین/تغییر دهند. اگر مشتری تعیین نکند، `carrierSetBy = null` تا زمانی که کارخانه در مرحله بارگیری آن را تعیین کند (`carrierSetBy = FACTORY`).
- **BR-09 (شماره ماشین و راننده):** این دو فیلد **هرگز توسط مشتری وارد نمی‌شوند**؛ فقط پس از بارگیری، توسط کارخانه در رکورد Delivery تکمیل می‌شوند.
- **BR-10 (لغو درخواست):** مشتری می‌تواند درخواست را در وضعیت `SUBMITTED` یا `APPROVED` لغو کند. به محض تغییر وضعیت به `LOADED`، دکمه لغو باید در UI غیرفعال/مخفی شود و Backend هم این تلاش را رد کند (HTTP 409 Conflict با پیام «امکان لغو درخواست بارگیری‌شده وجود ندارد»).
- **BR-11 (رد درخواست):** رد درخواست فقط توسط مدیر فروش، از داشبورد ادمین (بخش ۹.۹.۲) انجام می‌شود؛ دلیل رد (`reviewedByNote`) اجباری است و باید به مشتری نمایش داده شود.
  - ⚠️ **به‌روزرسانی (شل شدن عمدی):** الزامی‌بودن دلیل رد برداشته شد — ادمین می‌تواند با یا بدون دلیل رد کند. دلیلِ خالی به‌صورت `reviewedByNote = null` ذخیره و به مشتری «بدون نمایش دلیل» (نه «null») نشان داده می‌شود. کد خطای `ADMIN_002` دیگر برای این حالت پرتاب نمی‌شود.
- **BR-24 (موبایل تحویل‌گیرنده):** فیلد `recipientMobile` هنگام باز شدن فرم به‌صورت خودکار با شماره موبایل حساب مشتری (`customer.mobile`) پر می‌شود؛ مشتری اجازه دارد این مقدار را به شماره دیگری (مثلاً موبایل راننده یا شخص حاضر در مقصد بار) تغییر دهد. این فیلد اجباری است و نباید خالی ارسال شود.
- **BR-25 (بررسی موجودی در کارتابل ادمین):** در صفحه جزئیات هر درخواست در داشبورد ادمین، «مانده موجودی محصول درخواستی مشتری» (`order.remainingQty` در لحظه بررسی) باید نمایش داده شود تا ادمین بتواند آگاهانه تایید/رد کند.
- **BR-26 (تعریف مشتری توسط ادمین):** ادمین می‌تواند مشتری و کاربر جدید ایجاد کند (بخش ۹.۹.۲). نام کاربری به‌صورت خودکار برابر کد ملی مشتری ست می‌شود (BR-28، بخش ۶.۱). رمز عبور اولیه به‌صورت خودکار تولید (Random) یا توسط ادمین تعیین می‌شود و فلگ `mustResetPassword=true` ست می‌شود تا مشتری در اولین ورود مجبور به تغییر رمز شود.
- **BR-27 (چرخه عمر نظرسنجی):** ادمین نظرسنجی جدید را ابتدا در وضعیت `DRAFT` می‌سازد (عنوان + چند سوال چندگزینه‌ای، هرکدام با حداقل ۲ گزینه) و می‌تواند پیش از انتشار آن را ویرایش کند. با انتشار (`PUBLISHED`)، نظرسنجی برای مشتریان قابل‌مشاهده و پاسخ‌دهی می‌شود. فقط یک نظرسنجی می‌تواند هم‌زمان در وضعیت `PUBLISHED` باشد (انتشار نظرسنجی جدید، نظرسنجی قبلی را به‌طور خودکار `CLOSED` می‌کند) تا با UI فعلی مشتری (فقط یک نظرسنجی فعال) سازگار بماند. جزئیات کامل در بخش ۸.۳.

### 7.3 قوانین تحویل (Delivery)
- BR-12: رکورد Delivery فقط زمانی ایجاد می‌شود که LoadingRequest به وضعیت `LOADED` برسد (از طریق Sync/Internal API کارخانه).
- BR-13: تمام فیلدهای Delivery (شماره توزین، ماشین، راننده، مبالغ نهایی) Read Only برای مشتری هستند.
- BR-14: دکمه Print باید از داده‌های همان جدول (فیلترشده طبق نمای فعلی: ریز تحویل/سرجمع محصول/سرجمع تاریخ) یک PDF قابل‌دانلود/چاپ تولید کند (نه فقط `window.print()` مرورگر — باید یک PDF ساختاریافته با Header/Logo/Footer شرکت باشد).

### 7.4 قوانین مالی (Finance)
- BR-15: تمام داده‌های مالی (هر ۴ زیر-تب) صرفاً Read Only و منبع آن‌ها سیستم حسابداری کارخانه (از طریق ERP Sync) است؛ هیچ محاسبه‌ای در پورتال انجام نمی‌شود.
- BR-16: بارگذاری فیش واریزی یک قابلیت جدید مستقل است (نه بخشی از رکوردهای Sync شده) — مشتری فایل تصویر/PDF فیش را آپلود می‌کند، وضعیت اولیه `PENDING` است تا واحد مالی کارخانه آن را بررسی کند (بررسی خارج از دامنه UI این پروژه است، اما وضعیت باید در پورتال قابل‌مشاهده باشد).
- محدودیت فایل آپلود فیش: فرمت‌های مجاز `jpg, png, pdf`، حداکثر حجم ۵ مگابایت.

### 7.5 قوانین محصول
- BR-17: در حال حاضر فقط ۲ محصول فعال است (پرتلند نوع ۲ رده ۳۲.۵ فله/کیسه)، اما لیست محصولات باید **پویا از ERP خوانده شود** (نه Hardcode)، چون کارخانه قصد افزودن محصولات دیگر (پوزولانی، رده ۴۲.۵) را دارد.

### 7.6 قوانین قیمت‌گذاری
- BR-18: تمام مقادیر قیمتی (فی پایه، ارزش‌افزوده، عوامل) مستقیماً از سیستم حسابداری/ERP کارخانه Sync می‌شوند و پورتال **هیچ محاسبه یا override قیمتی انجام نمی‌دهد.**

### 7.7 قوانین نظرسنجی
- BR-19: سوالات نظرسنجی **فقط چندگزینه‌ای (Single-choice)** هستند (طبق تایید کارفرما) — بدون امتیاز ستاره‌ای یا متن باز در فاز ۱.
- BR-20: هر مشتری فقط یک‌بار می‌تواند به هر نظرسنجی فعال پاسخ دهد (`@@unique([surveyId, customerId])`).
- BR-21: پس از پاسخ، نظرسنجی از لیست «فعال» آن مشتری حذف و به تب «لیست» (پاسخ‌داده‌شده‌ها) منتقل می‌شود.

### 7.8 قوانین شکایات
- BR-22: شکایت فقط شامل «موضوع» و «شرح شکایت» (متن ساده) است — **بدون پیوست فایل** و **بدون گفتگوی دوطرفه/Thread** (طبق تایید صریح کارفرما).
- BR-23: هر شکایت فقط یک پاسخ نهایی از کارخانه دریافت می‌کند (`reply` + `repliedAt`)؛ پس از پاسخ، وضعیت به `ANSWERED` تغییر می‌کند و دیگر قابل ویرایش/پاسخ مجدد نیست.


---

## 8. ماشین‌های حالت (State Machines)

> این بخش State Machine کامل هر سه موجودیتی که چرخه وضعیت دارند را پوشش می‌دهد: درخواست اعلام بار، شکایت، نظرسنجی.

### 8.1 درخواست اعلام بار (LoadingRequest)

> ⚠️ **نکته مهم:** وضعیت‌های زیر (ثبت‌شده/تایید‌شده/رد‌شده/بارگیری‌شده/لغو‌شده) دقیقاً همان‌هایی هستند که کارفرما به‌صراحت در جلسه Q&A تایید کرده است. این وضعیت‌ها **نباید** با نام‌های عمومی‌تر مثل Draft/Delivered/Closed جایگزین شوند مگر کارفرما صراحتاً بخواهد، چون تغییر این‌ها هم Business Logic تایید‌شده را نقض می‌کند و هم با UI موجود (که همین ۵ Badge وضعیت را نشان می‌دهد) ناسازگار می‌شود.

```
                    ┌─────────────┐
                    │  SUBMITTED   │  (ثبت شده)
                    │ ثبت اولیه توسط│
                    │    مشتری     │
                    └──────┬───────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
       (تایید ادمین)  (رد ادمین)   (لغو توسط مشتری)
              │            │             │
              ▼            ▼             ▼
      ┌─────────────┐┌─────────────┐┌─────────────┐
      │  APPROVED    ││  REJECTED    ││  CANCELED    │
      │  تایید شده   ││   رد شده     ││  لغو شده     │
      └──────┬───────┘└─────────────┘└─────────────┘
             │               (پایانی)      (پایانی)
    ┌────────┼─────────┐
    │                  │
(بارگیری توسط        (لغو توسط
   کارخانه)             مشتری)
    │                  │
    ▼                  ▼
┌─────────────┐  ┌─────────────┐
│   LOADED     │  │  CANCELED    │
│ بارگیری شده  │  │  لغو شده     │
└──────┬───────┘  └─────────────┘
       │ (پایانی - غیرقابل لغو)   (پایانی)
       ▼
  ایجاد خودکار رکورد Delivery
```

#### جدول انتقال وضعیت (Transition Table)

| From | To | Trigger | مجاز برای |
|---|---|---|---|
| — | SUBMITTED | ثبت فرم درخواست جدید | مشتری (با اعتبارسنجی BR-04 و BR-05) |
| SUBMITTED | APPROVED | تایید مدیر فروش | داشبورد ادمین (بخش ۹.۹.۲) |
| SUBMITTED | REJECTED | رد مدیر فروش (با ذکر دلیل) | داشبورد ادمین (بخش ۹.۹.۲) |
| SUBMITTED | CANCELED | لغو توسط مشتری | مشتری |
| APPROVED | LOADED | تکمیل بارگیری در کارخانه | Internal/ERP Sync API (یا ثبت دستی ادمین در فاز ۲ در صورت نیاز) |
| APPROVED | CANCELED | لغو توسط مشتری (قبل از بارگیری) | مشتری |
| LOADED | — | (پایانی - Delivery ساخته می‌شود) | — |
| REJECTED | — | (پایانی) | — |
| CANCELED | — | (پایانی) | — |

> پیاده‌سازی پیشنهادی: یک `LoadingRequestStateMachine` Service مجزا در Backend که تمام Transitionها را validate می‌کند و از تغییر مستقیم Status بدون عبور از این سرویس جلوگیری می‌کند (جلوگیری از Bug ناشی از تغییر دستی وضعیت در جاهای مختلف کد). این الگو باید برای Complaint و Survey هم (بخش‌های ۸.۲ و ۸.۳) تکرار شود.

### 8.2 شکایت (Complaint)

طبق تایید صریح کارفرما، مدل شکایت **عمداً ساده** نگه داشته شده (بدون پیوست، بدون Thread)، بنابراین فقط دو وضعیت دارد — نه چرخه پیچیده‌تری که برخی الگوهای عمومی پیشنهاد می‌دهند:

```
┌─────────────┐        ثبت پاسخ توسط ادمین        ┌─────────────┐
│  PENDING     │ ──────────────────────────────►  │  ANSWERED    │
│در حال بررسی  │        (بخش ۹.۹.۴)                │پاسخ داده‌شده  │
└─────────────┘                                    └─────────────┘
     (اولیه)                                          (پایانی)
```

| From | To | Trigger | مجاز برای |
|---|---|---|---|
| — | PENDING | ثبت شکایت جدید | مشتری |
| PENDING | ANSWERED | ثبت پاسخ نهایی | ادمین (`/admin/complaints/:id/reply`) |
| ANSWERED | — | (پایانی - غیرقابل ویرایش/پاسخ مجدد) | — |

### 8.3 نظرسنجی (Survey)

```
┌─────────────┐   انتشار توسط ادمین   ┌─────────────┐   بستن (دستی یا با انتشار    ┌─────────────┐
│   DRAFT      │ ────────────────────► │  PUBLISHED   │   نظرسنجی جدید - BR-27)      │   CLOSED     │
│  پیش‌نویس    │                       │ منتشرشده     │ ────────────────────────────► │  بسته‌شده    │
└─────────────┘                       └─────────────┘                                └─────────────┘
  (فقط ادمین می‌بیند)              (مشتریان پاسخ می‌دهند)                    (فقط آرشیو/نتایج - غیرقابل پاسخ)
```

| From | To | Trigger | مجاز برای |
|---|---|---|---|
| — | DRAFT | ایجاد نظرسنجی جدید | ادمین |
| DRAFT | PUBLISHED | انتشار | ادمین |
| PUBLISHED | CLOSED | بستن دستی، یا خودکار با انتشار نظرسنجی جدید دیگر | ادمین / سیستم |
| CLOSED | — | (پایانی - فقط مشاهده نتایج آرشیوی) | — |

> توجه: بر‌خلاف LoadingRequest و Complaint، رکورد `SurveyAnswer` (پاسخ مشتری) خودش State ندارد — یا ثبت شده یا نشده (`@@unique([surveyId, customerId])` مانع پاسخ تکراری می‌شود).

---

## 9. مشخصات دقیق صفحه‌به‌صفحه (Frontend Spec)

### 9.0 عناصر مشترک در همه صفحات

**Header (ثابت در همه صفحات):**
- راست: عنوان «سامانه خدمات الکترونیک مشتریان سیمان خاکستری نی‌ریز» + لوگو کوچک کارخانه
- چپ: آواتار کاربر + نام مشتری + آیکون Chevron برای Dropdown (شامل: پروفایل، خروج از حساب)

**Navbar (پس‌زمینه گرادیانت آبی تیره در نسخه جدید، به‌جای رنگ صاف قبلی):**
هفت آیتم از راست به چپ: داشبورد، مالی، سفارشات، اعلام بار، تحویل، نظرسنجی، شکایات
- آیتم فعال: Highlight با زمینه روشن‌تر/Underline انیمیشنی
- هر آیتم آیکون مخصوص از `lucide-react` (مثلاً: `LayoutDashboard`, `Wallet`, `ShoppingCart`, `Truck`, `PackageCheck`, `ClipboardList`, `MessageSquareWarning`)
- در حالت Responsive/Mobile: تبدیل به Hamburger Menu یا Bottom Navigation

**کامپوننت DataTable عمومی (استفاده در سفارشات/اعلام‌بار/تحویل/مالی):**
- Toolbar بالا: دکمه Export Excel (سبز)، Print (زرد → تولید PDF واقعی نه Browser Print خام)، Filter (آبی، باز کردن Drawer/Popover فیلتر با فیلدهای تاریخ از-تا + وضعیت + محصول)
- Sticky Header ستون‌ها هنگام اسکرول
- ردیف Footer «جمع کل» برای ستون‌های عددی (محاسبه سمت Backend، نه صرفاً Frontend، تا با Export هم یکی باشد)
- Pagination: انتخاب تعداد ردیف (۱۰/۲۰/۵۰/۱۰۰)، دکمه قبلی/بعدی، نمایش «تعداد کل: N»
- Empty State: آیکون + متن «مقداری برای نمایش وجود ندارد. از منوی فیلتر جهت تغییر تاریخ استفاده نمایید» — دقیقاً مطابق سیستم فعلی برای حفظ آشنایی کاربر

---

### 9.1 صفحه ورود (Login) — `/login`

| عنصر | نوع | جزئیات |
|---|---|---|
| تصویر کارخانه | Illustration | حفظ سبک خط‌طرح آبی مشابه نسخه فعلی یا آپدیت مدرن‌تر با همان حس |
| کارت اطلاعات تماس | Static | آدرس، ۲ شماره تلفن، ایمیل، وبسایت — از Config/CMS ساده (نه Hardcode در Component، بلکه یک فایل تنظیمات company-info.ts) — ⚠️ مقادیر واقعی نی‌ریز هنوز دریافت نشده، فعلاً Placeholder |
| فیلد نام کاربری (کد ملی) | Input (numeric, maxLength=10) | آیکون کارت‌شناسایی، Placeholder «کد ملی خود را وارد نمایید»، Validation: ۱۰ رقم + الگوریتم Checksum کد ملی ایران |
| فیلد رمز عبور | Input (password) | آیکون قفل، دکمه Show/Hide، Placeholder «لطفا رمز عبور خود را وارد نمایید» |
| دکمه ورود | Button (Primary/بنفش) | متن «ورود به سایت»، Loading State هنگام ارسال، غیرفعال تا پر شدن هر دو فیلد |
| لینک فراموشی رمز | Link | باز کردن فرم بازیابی (کد ملی → OTP به موبایل ثبت‌شده → رمز جدید؛ جزئیات بخش ۶.۱) |
| مدیریت خطا | Toast/Inline | «نام کاربری یا رمز عبور اشتباه است» (بدون افشای این‌که کدام فیلد غلط است — امنیت) |
| Rate Limiting | Backend | حداکثر ۵ تلاش ناموفق در ۱۵ دقیقه، سپس قفل موقت حساب + پیام مناسب |

---

### 9.2 صفحه داشبورد — `/dashboard`

بازطراحی کامل با Glassmorphism (جزئیات کامل بصری در بخش ۱۰). ساختار محتوایی:

**ردیف بالا — کارت‌های KPI (طبق تایید کارفرما، ۸ مورد):**
1. مانده حساب (از FinancialTransaction آخرین `balance`)
2. تعداد سفارش فعال (`Order.status = IN_USE`)
3. مقدار باقی‌مانده سفارش (Σ `Order.remainingQty`)
4. مجموع تحویل ماه جاری (Σ `Delivery.deliveredQty` این ماه شمسی)
5. آخرین اعلام بار (جدیدترین `LoadingRequest` + وضعیت آن با Badge رنگی)
6. آخرین صورت‌حساب (جدیدترین `FinancialTransaction` نوع STATEMENT)
7. وضعیت اعتبار مشتری (`creditBalance` / `creditLimit` به‌صورت Progress Bar)
8. (آخرین شکایت نیز طبق پیشنهاد اولیه در نظر گرفته شود ولی کارفرما آن را در تایید نهایی ذکر نکرد — **پیشنهاد می‌شود این کارت هم اضافه شود** چون داده‌اش موجود است؛ لطفاً تایید کنید یا حذف شود)

**نمودار:** روند تحویل ماهانه (Recharts Line/Bar Chart، ۱۲ ماه اخیر شمسی)

**بخش اطلاعات محصول:** جدول کوچک (کد، نام، مانده برگ فروش، اعلام بار امروز، تحویل امروز) — حفظ از نسخه فعلی با ظاهر مدرن‌تر (کارت‌های Glass به‌جای جدول خام، یا جدول با Style جدید)

**بخش اطلاعات کاربری:** Read Only (نام، کد تفصیل، کد ملی، کد اقتصادی، آدرس، کد پستی، موبایل)

**بخش ویرایش رمز عبور:** فرم مطابق نسخه فعلی

**اعلانات/اخبار:** لیست کوچک آخرین Notificationها (اگر موجود باشد)

---

### 9.3 صفحه مالی — `/finance`

چهار زیر-تب (Tab Navigation بالای صفحه، دقیقاً مطابق تصویر ۸):

| تب | Endpoint | ستون‌ها |
|---|---|---|
| تراکنش‌ها (پیش‌فرض) | `GET /finance/transactions` | ردیف، تاریخ، شماره، نوع عملیات، بانک، شماره حساب، مبلغ، شرح، سررسید، وضعیت |
| صورت وضعیت | `GET /finance/status-statement` | ردیف، شماره سند، تاریخ، شرح، بدهکار، بستانکار، مانده، وضعیت |
| صورت حساب‌ها | `GET /finance/statements` | لیست صورت‌حساب‌های دوره‌ای (ماهانه/فصلی) هرکدام با دکمه دانلود/چاپ PDF |
| گزارش دارایی | `GET /finance/asset-report` | خلاصه اعتبار/مانده/سقف اعتباری (کارت‌های خلاصه به‌جای جدول ردیفی) |

> ⚠️ **مفروضه علامت‌گذاری‌شده:** فقط تب «تراکنش‌ها» در اسکرین‌شات با داده واقعی دیده شد؛ ستون‌های دقیق سه تب دیگر بر اساس الگوی استاندارد پورتال‌های حسابداری ایرانی حدس زده شده و **باید قبل از پیاده‌سازی نهایی توسط کارخانه/واحد مالی تایید شود.**

**بخش جدید (طبق تایید کارفرما):** دکمه/کارت «بارگذاری فیش واریزی» — فرم شامل: آپلود فایل (Drag & Drop)، فیلد مبلغ (اختیاری)، توضیحات (اختیاری)، دکمه ارسال. لیست فیش‌های ارسالی قبلی با وضعیت (در انتظار بررسی / بررسی‌شده / رد‌شده).

Footer جمع: «جمع واریزی‌ها» (فقط در تب تراکنش‌ها).

---

### 9.4 صفحه سفارشات — `/orders`

- Toolbar استاندارد (Export/Print/Filter)
- کنترل‌های بالا-راست: Dropdown «سرجمع محصول» (Group By Product)، Dropdown فیلتر وضعیت («همه سفارشات» / «در حال استفاده» / «تکمیل‌شده»)، دکمه «دارای مانده» (فیلتر سریع `remainingQty > 0`)
- ستون‌ها: [آیکون اعلام‌بار] شماره، تاریخ، محصول، وضعیت، مقدار، مقدار حمل‌شده، مقدار باقیمانده، فی پایه، مبلغ پایه، مبلغ حمل‌شده، ارزش‌افزوده، فی با عوامل، مبلغ با عوامل، مبلغ باقیمانده
- **آیکون کاردکس ابتدای هر ردیف:** کلیک → باز شدن Drawer/Modal شامل: (الف) لیست اعلام‌بارهای ثبت‌شده روی این سفارش با وضعیت هرکدام، (ب) دکمه «+ ثبت درخواست اعلام بار جدید روی این سفارش» (این‌جا نقطه ورود اصلی فرم ثبت اعلام بار است)
- Footer: جمع مقدار، جمع مقدار حمل‌شده، جمع مقدار باقیمانده، جمع مبلغ با عوامل، جمع مبلغ حمل‌شده، جمع مبلغ باقیمانده

---

### 9.5 صفحه اعلام بار — `/loading-requests`

**دو نما (Tab/Toggle):** «ریز اعلام بار» (پیش‌فرض) و «سرجمع تاریخ» (Group By Date)

**جدول ریز اعلام بار:** ردیف، شماره، تاریخ ثبت، محصول، باربری، تاریخ اعلام (تاریخ درخواستی بارگیری)، مقدار اعلام، تحویل‌شده، مانده، **وضعیت (Badge رنگی: زرد=ثبت‌شده، آبی=تایید‌شده، قرمز=رد‌شده، سبز=بارگیری‌شده، خاکستری=لغو‌شده)**، [آیکون مشاهده جزئیات تحویل مرتبط - در صورت LOADED بودن]

**دکمه «+ ثبت درخواست جدید» (بالای صفحه، علاوه بر دسترسی از صفحه سفارشات):**
فرم Modal شامل (به‌روزشده طبق BR-07):
- انتخاب سفارش (Dropdown، فقط سفارش‌های `remainingQty > 0`)
- محصول (خودکار از سفارش انتخابی، غیرقابل تغییر دستی؛ نمایش نوع فله/کیسه کنار نام)
- مقدار درخواستی (Input عددی، Max = مانده سفارش، Validation Real-time)
- نوع خودرو (Select: تریلی/کفی/کمپرسی/ده‌چرخ)
- **نوع بار** (Select/Radio: فیکس = بارگیری کامل کامیون / غیرفیکس = تناژ دلخواه)
- تاریخ درخواستی (Date Picker جلالی، پیش‌فرض و قفل‌شده روی «فردا»، غیرفعال کامل فرم اگر ساعت سرور از ۱۵:۰۰ گذشته با پیام هشدار مشخص)
- **شهر مقصد بار** (Select/Input - لیست شهرهای اطراف نی‌ریز/استان فارس یا Input آزاد - ⚠️ لیست دقیق باید توسط کارخانه تایید شود، بخش ۲۰.۲)
- **آدرس تکمیلی و توضیحات** (Textarea کوتاه، اختیاری)
- **کد پستی مقصد بار** (Input، اختیاری)
- **موبایل تحویل‌گیرنده** (Input، از قبل با موبایل حساب مشتری پر شده و قابل ویرایش - BR-24)
- باربری (Select اختیاری، «کارخانه تعیین کند» به‌عنوان گزینه پیش‌فرض)
- دکمه ثبت (Loading State + پیام موفقیت + بستن Modal + Refresh لیست)

**دکمه لغو (روی هر ردیف در وضعیت SUBMITTED/APPROVED):** Confirm Dialog «آیا از لغو این درخواست مطمئن هستید؟» → `PATCH /loading-requests/:id/cancel`

Footer: جمع تحویل‌شده، جمع اعلام بار (مقدار)

---

### 9.6 صفحه تحویل — `/deliveries`

**سه نما:** «ریز تحویل» (پیش‌فرض)، «سرجمع محصول»، «سرجمع تاریخ»

ستون‌ها (ریز تحویل): ردیف، شماره توزین، درخواست (شماره LoadingRequest مرتبط، لینک‌دار)، تاریخ، باربری، شماره ماشین، راننده، محصول، تحویل (مقدار)، فی پایه، مبلغ پایه، ارزش‌افزوده، مبلغ با عوامل، وضعیت

Footer: جمع تحویل، جمع مبلغ پایه، جمع ارزش‌افزوده، جمع کسورات، جمع مبلغ با عوامل

**دکمه Print:** تولید PDF واقعی (Puppeteer روی Backend) شامل: Header با لوگو کارخانه + عنوان + بازه فیلتر انتخابی + جدول کامل + Footer جمع‌ها + شماره صفحه.

---

### 9.7 صفحه نظرسنجی — `/surveys`

**دو حالت (Toggle بالا-راست):**
- «نظرسنجی» (پیش‌فرض): نمایش نظرسنجی فعالِ در‌انتظارِ پاسخ (اگر نبود → Empty State «در حال حاضر نظرسنجی فعالی وجود ندارد»، دقیقاً مطابق نسخه فعلی)
- «لیست»: تاریخچه نظرسنجی‌های پاسخ‌داده‌شده قبلی (Read Only، نمایش پاسخ‌های ثبت‌شده)

**فرم پاسخ به نظرسنجی (وقتی فعال باشد):**
- عنوان و توضیح نظرسنجی
- لیست سوالات، هرکدام با گزینه‌های چندگزینه‌ای (Radio Button)
- دکمه «ثبت پاسخ» → همه سوالات باید پاسخ داده شوند (Validation) → `POST /surveys/:id/answer`
- پس از ثبت: پیام تشکر + انتقال خودکار به تب «لیست»

---

### 9.8 صفحه شکایات — `/complaints`

- دکمه بنفش «+ ثبت درخواست جدید» → Modal با دو فیلد: «موضوع» (Input متن کوتاه) و «شرح شکایت» (Textarea) → دکمه ثبت
- جدول: موضوع، شرح شکایت، تاریخ شکایت، وضعیت (Badge: زرد=در حال بررسی، سبز=پاسخ داده شده)، پاسخ (متن پاسخ یا «—» اگر هنوز پاسخ داده نشده)، تاریخ پاسخ
- **بدون** Toolbar Export/Print/Filter و **بدون** Footer جمع (مطابق مشاهده دقیق از تصویر اصلی - این صفحه ساده‌تر از بقیه است)
- **بدون پیوست فایل، بدون گفتگوی دوطرفه** (طبق تایید صریح کارفرما)


---

### 9.9 داشبورد ادمین (مدیر فروش کارخانه) — `/admin/*`

رابط کاربری کاملاً مجزا از پورتال مشتریان، با ورود جداگانه (`/admin/login`)، اما **دقیقاً با همان زبان بصری/Design System بخش ۱۰** (Glassmorphism، همان پالت رنگی، همان کامپوننت‌های DataTable/GlassCard/StatusBadge) تا حس یکپارچگی محصول حفظ شود — طبق تاکید صریح کارفرما («خلاصه داشبورد ادمین باید با داشبورد مشتریان مچ باشد»).

Navbar ادمین (ساختار مشابه ولی آیتم‌های متفاوت): داشبورد، مشتریان، اعلام بارها (کارتابل)، شکایات، نظرسنجی

#### 9.9.1 داشبورد اصلی ادمین — `/admin/dashboard` (Command Center)

طبق بازخورد دریافتی، این صفحه فقط چند KPI نیست؛ باید یک **مرکز فرماندهی (Command Center)** کامل با ۵ بخش باشد:

**بخش ۱ — ردیف کارت‌های KPI (Glassmorphism):**

| KPI | منبع داده |
|---|---|
| تعداد کل مشتریان | `count(Customer where isDeleted=false)` |
| تعداد سفارش‌های فعال (کل مشتریان) | `count(Order where status=IN_USE)` — ⚠️ مفروضه: تفسیر «سفارش‌های ارسالی» به‌عنوان سفارش‌های فعال تخصیص‌یافته از ERP؛ اگر منظور چیز دیگری‌ست اطلاع دهید |
| تعداد درخواست‌های اعلام بار در انتظار بررسی | `count(LoadingRequest where status=SUBMITTED)` |
| مجموع تحویل امروز (کل مشتریان) | Σ `Delivery.deliveredQty` با `deliveryDate = امروز` |
| مجموع تحویل هفته جاری (کل مشتریان) | Σ `Delivery.deliveredQty` هفته جاری شمسی |
| تعداد شکایات پاسخ‌نداده | `count(Complaint where status=PENDING)` |
| نظرسنجی فعال + تعداد پاسخ‌های دریافتی | `Survey.status=PUBLISHED` + `count(SurveyAnswer)` |
| تعداد کاربران آنلاین | `count(User where lastActivityAt >= now()-15min)` — بخش ۵.۲ (`lastActivityAt`) |

**بخش ۲ — Latest Activities (فید فعالیت زنده):**
لیست آخرین رویدادهای سیستم، مستقیماً از `AuditLog` خوانده می‌شود (۲۰ مورد آخر، Real-time‌ یا Polling هر ۱۰ ثانیه):
- «مشتری [نام] درخواست اعلام بار شماره [X] ثبت کرد»
- «مشتری [نام] شکایت جدید ثبت کرد»
- «ادمین [نام] درخواست شماره [X] را تایید/رد کرد»
- «مشتری [نام] فیش واریزی بارگذاری کرد»
- «ادمین [نام] مشتری جدید [نام] را ایجاد کرد»
> پیاده‌سازی: یک Endpoint اختصاصی `GET /admin/dashboard/activities?limit=20` که از `AuditLog` Query می‌گیرد و `action` را به متن فارسی خوانا Map می‌کند (Mapping Dictionary در Backend، نه Hardcode در Frontend).

**بخش ۳ — نمودار تحویل روزانه:** Line/Bar Chart تحویل کل کارخانه (Recharts)، بازه ۳۰ روز اخیر شمسی.

**بخش ۴ — نمودار ثبت درخواست‌های اعلام بار:** نمودار روزانه تعداد `LoadingRequest` ثبت‌شده (تفکیک رنگ بر اساس وضعیت نهایی: تایید‌شده/رد‌شده/در انتظار) — به ادمین کمک می‌کند حجم کاری روزانه را ببیند.

**بخش ۵ — Notification Center:** پنل/Dropdown اعلانات مخصوص ادمین (`NotificationBell` مشترک - بخش ۱۰.۷) با اعلان‌های: شکایت جدید، اعلام بار جدید، فیش واریزی جدید.

#### 9.9.2 مدیریت مشتریان — `/admin/customers`

- جدول لیست مشتریان (نام، کد تفصیل، موبایل، وضعیت فعال/غیرفعال، تاریخ ایجاد)
- دکمه «+ تعریف مشتری جدید» → فرم شامل: کد تفصیل، نام مشتری، **کد ملی (این مقدار خودکار Username ورود مشتری می‌شود - BR-28)**، کد اقتصادی، موبایل (برای پیامک/OTP)، آدرس، کد پستی، سقف اعتباری (اختیاری در این مرحله، می‌تواند بعداً از ERP Sync شود)
- پس از ثبت: سیستم به‌صورت خودکار یک `User` با `role=CUSTOMER` و رمز عبور موقت تصادفی می‌سازد (BR-26) و (در صورت اتصال SMS Provider) رمز موقت را برای مشتری پیامک می‌کند؛ در غیر این صورت رمز موقت به ادمین نمایش داده می‌شود تا دستی اطلاع دهد
- امکان غیرفعال/فعال‌سازی حساب مشتری (Toggle) و بازنشانی رمز عبور

#### 9.9.3 کارتابل اعلام بار — `/admin/loading-requests`

- جدول لیست درخواست‌ها با فیلتر پیش‌فرض روی `status=SUBMITTED` (کارتابل کارهای در انتظار)، همراه با تب/فیلتر برای مشاهده همه وضعیت‌ها (تاریخچه)
- ستون‌ها: شماره درخواست، نام مشتری، شماره سفارش، محصول، مقدار درخواستی، تاریخ درخواستی بارگیری، وضعیت، تاریخ ثبت
- کلیک روی هر ردیف → **صفحه/Drawer جزئیات کامل درخواست**، شامل دقیقاً همان فیلدهایی که کارفرما مشخص کرد:
  - نام محصول (فله/کیسه)
  - نوع وسیله نقلیه انتخاب‌شده (تریلی/کفی/کمپرسی/ده‌چرخ)
  - نوع بار (فیکس/غیرفیکس)
  - شهر مقصد
  - آدرس تکمیلی و توضیحات
  - کد پستی مقصد بار
  - موبایل تحویل‌گیرنده
  - **مانده موجودی محصول درخواستی مشتری** (`order.remainingQty` لحظه بررسی — BR-25)
  - اطلاعات مشتری (نام، کد تفصیل، شماره سفارش مرجع)
- دو دکمه عملیاتی: **«تایید»** (سبز) و **«رد»** (قرمز، با Modal اجباری برای وارد کردن دلیل رد)
- پس از تایید/رد: به‌روزرسانی فوری وضعیت، ثبت `reviewedBy`/`reviewedAt`/`reviewedByNote`، و ارسال Notification به مشتری مربوطه

#### 9.9.4 مدیریت شکایات — `/admin/complaints`

- جدول همه شکایات همه مشتریان: نام مشتری، موضوع، شرح شکایت، تاریخ، وضعیت
- کلیک روی هر ردیف → مشاهده کامل متن شکایت + فرم پاسخ (Textarea) → دکمه «ثبت پاسخ» (`PATCH /admin/complaints/:id/reply`) → وضعیت به `ANSWERED` تغییر می‌کند و پاسخ بلافاصله در پورتال مشتری قابل مشاهده می‌شود

#### 9.9.5 مدیریت نظرسنجی — `/admin/surveys`

- دکمه «+ ایجاد نظرسنجی جدید» → فرم‌ساز (Form Builder) شامل: عنوان، توضیح، و افزودن پویای سوالات (هرکدام: متن سوال + حداقل ۲ گزینه چندگزینه‌ای، امکان افزودن/حذف گزینه) → ذخیره اولیه به‌عنوان `DRAFT`
- دکمه «انتشار» → تغییر وضعیت به `PUBLISHED` (و بستن خودکار نظرسنجی منتشرشده قبلی طبق BR-27)
- دکمه «بستن نظرسنجی» → تغییر وضعیت به `CLOSED` دستی (بدون نیاز به نظرسنجی جدید)
- لیست نظرسنجی‌ها با فیلتر وضعیت (پیش‌نویس/منتشرشده/بسته‌شده) + دکمه «مشاهده نتایج» → نمایش گرافیکی (نمودار میله‌ای/دایره‌ای Recharts) درصد انتخاب هر گزینه به تفکیک هر سوال + تعداد کل پاسخ‌دهندگان

### 9.10 لندینگ پیج عمومی کارخانه (Public Corporate Website) — `/` (جدید)

> این یک ماژول کاملاً جدید و **مستقل از پورتال مشتریان و داشبورد ادمین** است: یک وب‌سایت **عمومی و بدون نیاز به ورود** برای معرفی کارخانه سیمان خاکستری نی‌ریز، که دکمه ورود به پورتال مشتریان هم از داخل آن در دسترس است.

#### 9.10.1 معماری و مالکیت محتوا (تصمیم مهم طبق تایید کارفرما)

طبق تایید صریح کارفرما، محتوای این بخش (اخبار، اطلاعیه‌ها، گزارش‌ها، عکس، فیلم) **توسط پشتیبان فنی سایت به‌صورت جداگانه و مستقل از پنل ادمین (مدیر فروش) به‌روزرسانی می‌شود** — یعنی این محتوا از دیتابیس اصلی/RBAC پروژه (بخش ۵ و ۶) کاملاً جداست و **هیچ CMS یا UI مدیریتی داخل داشبورد ادمین برای آن ساخته نمی‌شود.**

تصمیم فنی (به‌عنوان CTO پروژه): محتوا به‌صورت **فایل‌های Markdown/MDX در مخزن کد** نگه‌داری می‌شود، نه در دیتابیس PostgreSQL اصلی:

```
apps/web/content/
├── news/                # اخبار کارخانه
│   ├── 2026-07-01-news-title.mdx
│   └── ...
├── announcements/        # اطلاعیه‌ها
│   └── ...
├── reports/               # گزارش‌ها (هرکدام می‌تواند لینک PDF ضمیمه داشته باشد)
│   └── ...
└── about.mdx              # درباره ما (تک‌فایل)

apps/web/public/media/
├── photos/                 # گالری عکس (فایل‌های jpg/png + یک فایل photos.json برای عنوان/توضیح هرکدام)
└── videos/                 # ویدیوها (فایل mp4 یا لینک Embed آپارات/یوتیوب در videos.json)
```

- پشتیبان سایت با دسترسی مستقیم به مخزن کد (Git) یا یک پنل بسیار ساده و **کاملاً جدا از داشبورد ادمین این پروژه** (مثلاً Git-based CMS مثل Decap CMS/Netlify CMS در فاز بعد، اختیاری) فایل‌ها را اضافه/ویرایش می‌کند.
- صفحات با **Next.js Static Generation + ISR** (`revalidate: 3600` یا مشابه) رندر می‌شوند تا بعد از هر تغییر محتوا (Merge/Deploy)، صفحه به‌روز شود، بدون نیاز به Backend/Database Query در Runtime برای این بخش.
- **مزیت این تصمیم:** هیچ تداخلی با مدل داده/RBAC/Auth پورتال مشتریان و ادمین ندارد (دقیقاً طبق خواسته کارفرما)، و برای پشتیبان سایت (که لزوماً کاربر فنی/توسعه‌دهنده است) ساده و مستقیم است.
- ⚠️ اگر در آینده پشتیبان سایت غیرفنی باشد و نیاز به یک پنل ساده مدیریت محتوا (بدون دسترسی Git) داشته باشد، پیشنهاد می‌شود از یک ابزار Headless CMS آماده (Strapi/Sanity) به‌صورت **کاملاً مجزا** استفاده شود، نه افزودن آن به دیتابیس/Backend این پروژه.

#### 9.10.2 ساختار Navbar عمومی (متفاوت از Navbar پورتال)

Navbar این بخش کاملاً جدا از Navbar پورتال (بخش ۹.۰) است — آیتم‌ها از راست به چپ:

خانه، اخبار کارخانه، اطلاعیه‌ها، گزارش‌ها، چندرسانه‌ای (با زیرمنو: عکس / فیلم)، درباره ما، تماس با ما، و در انتهای سمت چپ یک دکمه متمایز (Filled/برجسته، رنگ Primary) با متن **«پورتال مشتریان»** که مستقیماً کاربر را به `/login` (صفحه Login بخش ۹.۱) هدایت می‌کند — این دکمه یک لینک ساده است، نه یک Tab محتوایی مثل بقیه.

#### 9.10.3 صفحات

| مسیر | عنوان | محتوا |
|---|---|---|
| `/` | خانه | Hero Section (تصویر/اسلایدر کارخانه + عنوان + دکمه CTA «ورود به پورتال مشتریان»)، معرفی کوتاه کارخانه، ۳ خبر/اطلاعیه اخیر (کارت‌های خلاصه با لینک به صفحه کامل)، آمار کوتاه کارخانه (اختیاری: سال تاسیس، ظرفیت تولید، ...)، بخش تماس سریع در Footer |
| `/news` | اخبار کارخانه | لیست کارت‌های خبر (تصویر Cover + عنوان + تاریخ + خلاصه)، Pagination ساده |
| `/news/[slug]` | جزئیات خبر | محتوای کامل MDX + تصاویر |
| `/announcements` | اطلاعیه‌ها | لیست ساده‌تر (بدون لزوماً تصویر) - عنوان + تاریخ + متن/فایل ضمیمه (مثلاً اطلاعیه‌های رسمی/تغییر ساعت کاری و ...) |
| `/reports` | گزارش‌ها | لیست گزارش‌ها (مثلاً گزارش عملکرد سالانه/فصلی)، هرکدام با دکمه دانلود PDF |
| `/media/photos` | گالری عکس | Grid گالری تصاویر با Lightbox (کلیک برای بزرگ‌نمایی) |
| `/media/videos` | گالری فیلم | Grid کارت‌های ویدیو (Embed آپارات/یوتیوب یا پخش مستقیم فایل) |
| `/about` | درباره ما | متن معرفی کارخانه، تاریخچه، شاید تصاویر خط تولید |
| `/contact` | تماس با ما | آدرس، تلفن، ایمیل، نقشه (Google Maps/Neshan Embed)، **فرم تماس ساده** |

#### 9.10.4 فرم «تماس با ما»

برخلاف فرم‌های پورتال، این فرم **نباید** وارد دیتابیس اصلی/AuditLog پروژه شود (چون کاربر لاگین نکرده و این بخش کاملاً مستقل است). پیاده‌سازی پیشنهادی: فیلدهای نام، موبایل/ایمیل، متن پیام → یک Endpoint سبک و مجزا (`POST /public/contact`، بدون نیاز به Auth، با Rate Limiting سخت‌گیرانه برای جلوگیری از Spam) که صرفاً یک **ایمیل** به آدرس ایمیل رسمی کارخانه ارسال می‌کند (از طریق همان زیرساخت SMTP که برای اعلان‌های سیستم استفاده می‌شود)؛ نیازی به ذخیره در جدول دیتابیس یا نمایش در پنل ادمین نیست (طبق همان اصل استقلال محتوای عمومی از بخش ۹.۹.۱).

#### 9.10.5 طراحی بصری

- از همان Design Tokens رنگ/فونت بخش ۱۰.۶ استفاده می‌شود (یکپارچگی برند)، اما Layout این بخش **بازاریابی‌محور (Marketing-style)** است: Hero بزرگ، تصاویر تمام‌عرض، فاصله‌های بیشتر — نه Glassmorphism فشرده داشبورد.
- کاملاً Responsive و RTL (طبق بخش ۱۰.۵).
- SEO: هر صفحه باید `<title>`, `meta description`, Open Graph Tags مناسب فارسی داشته باشد (Next.js Metadata API)؛ این بخش برخلاف پورتال، باید توسط گوگل Index شود.

#### 9.10.6 محل قرارگیری در ساختار پروژه

Route Group مستقل در همان اپ Next.js موجود (بخش ۱۴): `apps/web/app/(public)/` — کاملاً جدا از `app/(auth)` و `app/(portal)` و `app/(admin)`؛ Layout مجزا (Navbar/Footer عمومی، نه Header پورتال).

---

## 10. سیستم طراحی بصری (Design System)

### 10.1 جهت‌گیری کلی
طبق تایید کارفرما: «UI داشبورد بسیار جذاب‌تر، مینیمال‌تر، مدرن‌تر، همراه با انیمیشن و Glassmorphism، همراه با ویجت‌های مدیریتی، کارت‌ها و نمودارها». این سبک باید در داشبورد به‌طور کامل و در سایر صفحات به‌صورت ملایم‌تر (برای حفظ خوانایی جداول داده‌محور) اعمال شود.

### 10.2 پالت رنگی پیشنهادی

| نقش | رنگ | Hex نمونه |
|---|---|---|
| Primary (اصلی برند - بنفش، حفظ هویت فعلی) | بنفش/نیلی | `#6D28D9` تا `#4F46E5` (گرادیانت) |
| Background اصلی | خاکستری بسیار روشن با گرادیانت ملایم | `#F8FAFC` → `#EEF2FF` |
| Glass Surface | سفید نیمه‌شفاف + Blur | `rgba(255,255,255,0.6)` + `backdrop-filter: blur(16px)` |
| Success (تایید‌شده/بارگیری‌شده) | سبز | `#16A34A` |
| Warning (ثبت‌شده/در انتظار) | زرد کهربایی | `#D97706` |
| Danger (رد‌شده) | قرمز | `#DC2626` |
| Neutral (لغو‌شده) | خاکستری | `#6B7280` |
| متن اصلی | خاکستری تیره | `#1E293B` |

### 10.3 اصول Glassmorphism برای کارت‌های داشبورد
```css
.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.18);
}
```
- Background صفحه داشبورد: گرادیانت نرم چندلایه (Mesh Gradient) با رنگ‌های بنفش/آبی کم‌رنگ در پس‌زمینه، یا اشکال محو (Blob) متحرک با انیمیشن آرام (`animate-pulse` کند یا Framer Motion `animate={{ scale: [1,1.05,1] }}`)
- تایپوگرافی: فونت فارسی مدرن مثل **Vazirmatn** یا **IRANSans** (Variable Font برای وزن‌های مختلف)، اعداد به‌صورت Tabular/فارسی
- آیکون‌ها: `lucide-react` با ضخامت خط یکدست (stroke-width: 1.5)
- انیمیشن ورود کارت‌ها: Framer Motion Stagger (کارت‌ها یکی‌یکی با تاخیر ۵۰-۱۰۰ میلی‌ثانیه Fade+Slide-up می‌شوند)
- نمودار روند تحویل: خطوط نرم (Smooth Curve)، گرادیانت زیر خط، Tooltip فارسی با اعداد فارسی

### 10.4 صفحات لیست‌محور (غیر داشبورد)
برای حفظ خوانایی داده، سبک این صفحات سبک‌تر است:
- Card سفید ساده با سایه ملایم (نه Glass کامل) دور جدول
- رنگ Header جدول: خاکستری روشن `#F1F5F9`
- Hover ردیف: `#F8FAFC`
- Badge وضعیت با رنگ‌های جدول ۱۰.۲ + پس‌زمینه کم‌رنگ متناظر (مثلاً سبز کم‌رنگ برای Success Badge)

### 10.5 Responsive / RTL
- جهت کل سایت: `dir="rtl"`, `lang="fa"`
- Breakpoint موبایل: تبدیل جدول‌ها به Card List عمودی (هر ردیف = یک کارت با Label:Value)
- استفاده از واحدهای Tailwind Logical Properties (`ps-`, `pe-`, `ms-`, `me-`) به‌جای `pl-`/`pr-` برای سازگاری کامل RTL

### 10.6 Design Tokens (منبع واحد Truth برای Tailwind Config)

تمام مقادیر بصری باید از این Tokenها بیایند، نه Hardcode پراکنده در Componentها. این‌ها باید در `tailwind.config.ts` و یک فایل `tokens.css` (CSS Variables) تعریف شوند:

```ts
// design-tokens.ts
export const tokens = {
  radius: {
    sm: '8px',
    md: '12px',
    lg: '20px',      // کارت‌های Glass
    full: '9999px',  // Badge/Avatar
  },
  border: {
    thin: '1px solid rgba(255,255,255,0.3)',
    default: '1px solid #E2E8F0',
  },
  blur: {
    card: '20px',     // Glassmorphism کارت‌ها
    modal: '8px',     // Backdrop مودال‌ها
  },
  shadow: {
    sm: '0 2px 8px rgba(15,23,42,0.06)',
    md: '0 8px 32px rgba(31,38,135,0.10)',
    lg: '0 12px 40px rgba(31,38,135,0.18)',   // Hover کارت
  },
  fontScale: {
    xs: '12px', sm: '14px', base: '16px', lg: '18px',
    xl: '20px', '2xl': '24px', '3xl': '30px', '4xl': '36px',
  },
  spacing: {
    unit: '4px',   // مبنای Scale (4/8/12/16/24/32/48/64)
  },
  animation: {
    fast: '150ms',
    base: '250ms',    // Hover/Transition استاندارد
    slow: '400ms',
    stagger: '80ms',  // فاصله بین انیمیشن ورود کارت‌ها (Framer Motion)
  },
  breakpoints: {
    sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
  },
  zIndex: {
    dropdown: 20, modal: 50, toast: 60, tooltip: 70,
  },
  iconSize: {
    sm: '16px', md: '20px', lg: '24px', xl: '32px',  // برای lucide-react (prop size)
  },
  containerWidth: {
    content: '1280px',   // حداکثر عرض محتوای صفحات لیستی
    dashboard: '1440px', // حداکثر عرض کارت‌های داشبورد
  },
  grid: {
    dashboardCols: { mobile: 1, tablet: 2, desktop: 4 },  // تعداد ستون کارت‌های KPI
    gap: '16px',
  },
};
```

### 10.7 Component Library (کامپوننت‌های قابل‌استفاده مجدد)

این کامپوننت‌ها باید یک‌بار در `components/shared/` ساخته و در تمام صفحات (مشتری و ادمین) بازاستفاده شوند — **هیچ کامپوننت مشابهی نباید در فایل‌های مختلف بازنویسی شود.**

| کامپوننت | وظیفه | استفاده در |
|---|---|---|
| `GlassCard` | کارت پایه با افکت Glassmorphism (بخش ۱۰.۳) | داشبورد مشتری و ادمین |
| `KpiCard` | کارت آماری با عدد بزرگ + آیکون + Trend (↑/↓) | هر دو داشبورد |
| `SmartTable` | جدول عمومی: Sort، Pagination، Sum Row، Sticky Header | سفارشات/اعلام‌بار/تحویل/مالی/کارتابل ادمین |
| `EmptyState` | آیکون + پیام سفارشی وقتی داده‌ای نیست | همه جداول |
| `StatusBadge` | Badge رنگی بر اساس Enum وضعیت (نگاشت رنگ در بخش ۱۰.۲) | همه‌جا که Status نشان داده می‌شود |
| `FilterDrawer` | Panel/Drawer فیلتر (تاریخ از-تا، وضعیت، محصول) | همه جداول |
| `SearchBox` | ورودی جستجو با Debounce ۳۰۰ms | لیست مشتریان (ادمین)، جداول |
| `NotificationBell` | آیکون زنگ با Badge تعداد Unread + Dropdown لیست | Header هر دو پورتال |
| `UserAvatar` | آواتار + نام + Dropdown پروفایل/خروج | Header |
| `ConfirmDialog` | مودال تایید عمومی («آیا مطمئنید؟» + دکمه تایید/انصراف) | لغو اعلام بار، رد درخواست، بستن نظرسنجی |
| `ExportButtons` | مجموعه دکمه‌های Excel/Print با Loading State | همه جداول |
| `SkeletonLoader` | حالت Loading اسکلتی (نه Spinner) برای جداول/کارت‌ها | همه صفحات هنگام Fetch اولیه |
| `Stepper` | نشانگر مراحل (مثلاً نمایش مراحل State Machine اعلام بار در جزئیات) | جزئیات اعلام بار (مشتری و ادمین) |
| `Timeline` | نمایش تاریخچه رویدادها (تاریخ ثبت → تایید → بارگیری) | جزئیات درخواست/شکایت |
| `FormBuilderField` | بلوک پویا افزودن/حذف سوال+گزینه | فرم‌ساز نظرسنجی ادمین |
| `SmartFilter` | نوار فیلتر ترکیبی (Select+DateRange+Search در یک ردیف، نسخه فشرده‌تر از FilterDrawer برای صفحاتی که فضای کمتری دارند) | کارتابل ادمین، لیست مشتریان |
| `DateRangePicker` | انتخاب بازه تاریخ جلالی (از-تا) با Presets («امروز»، «این هفته»، «این ماه») | همه فیلترهای تاریخ |
| `ChartCard` | Wrapper یکدست دور نمودارهای Recharts (Title + Legend + GlassCard مشترک) | همه نمودارهای هر دو داشبورد |
| `FilePreview` | پیش‌نمایش فایل آپلودی (تصویر/PDF) قبل/بعد از ارسال | آپلود فیش واریزی |

> نکته Clean Code: `SmartTable` باید تمام صفحات لیستی را با یک Props API واحد پوشش دهد (`columns`, `data`, `sumRow?`, `onFilterChange`, `exportEndpoint`) تا از تکرار کد در ۵+ صفحه جلوگیری شود (قانون DRY - جزئیات در `instruction.md`).

### 10.8 Dashboard Widget Catalog

| Widget | داشبورد مشتری | داشبورد ادمین | منبع داده |
|---|---|---|---|
| KPI Cards | ✅ (۸ کارت - بخش ۹.۲) | ✅ (۸ کارت - بخش ۹.۹.۱) | `GET /dashboard/summary` یا `/admin/dashboard/summary` |
| Monthly/Weekly Trend Chart | ✅ روند تحویل ماهانه | ✅ روند تحویل روزانه کل کارخانه | `delivery-trend` endpoint |
| Loading Request Trend Chart | — | ✅ روند روزانه ثبت اعلام بار | `loading-request-trend` endpoint |
| Latest Activities Feed | — | ✅ (بخش ۹.۹.۱) | `admin/dashboard/activities` |
| Recent Orders | اختیاری (Widget کوچک آخرین سفارش) | — | `GET /orders?pageSize=5` |
| Recent Loading Requests | اختیاری | ✅ (کارتابل کامل در صفحه جدا) | `loading-requests` |
| Recent Delivery | اختیاری | — | `deliveries?pageSize=5` |
| Notification Feed | ✅ | ✅ | `GET /notifications` |
| Remaining Inventory Table | ✅ (اطلاعات محصول - بخش ۹.۲) | — | `dashboard/summary` |
| Financial Status Widget | ✅ (مانده حساب) | — | `finance` |
| Pending Complaints Counter | — | ✅ | `admin/complaints?status=PENDING` |
| Active Survey Response Counter | — | ✅ | `admin/surveys/:id/results` |
| Online Users Counter | — | ✅ | `admin/dashboard/summary` |

### 10.9 Frontend State Matrix

هر Component/صفحه‌ای که داده Async می‌گیرد باید دقیقاً یکی از این حالت‌ها را در هر لحظه نمایش دهد (نه فقط Loading/Success که در نسخه اول PRD بود):

| حالت | چه زمانی | نمایش | کامپوننت |
|---|---|---|---|
| `Loading` | اولین Fetch داده | اسکلت خاکستری متحرک | `SkeletonLoader` |
| `Skeleton` | مترادف Loading برای جداول/کارت‌ها (تمایز از Spinner ساده) | Placeholder با ابعاد نهایی محتوا | `SkeletonLoader` |
| `Empty` | Fetch موفق ولی صفر رکورد | آیکون + پیام راهنما | `EmptyState` |
| `Error` | خطای شبکه/سرور (۵xx) | آیکون خطا + پیام + دکمه «تلاش مجدد» | `ErrorState` (جدید) |
| `Forbidden` (403) | کاربر مجاز نیست (مثلاً CUSTOMER تلاش برای `/admin/*`) | صفحه اختصاصی «دسترسی غیرمجاز» | صفحه `app/(errors)/403` |
| `Unauthorized` (401) | Token نامعتبر/منقضی | Redirect خودکار به Login (نه فقط پیام) | Interceptor سراسری Axios/Fetch |
| `Success` | داده با موفقیت نمایش داده شده | محتوای واقعی | — |
| `Offline` | قطع اتصال اینترنت (`navigator.onLine=false`) | نوار هشدار بالای صفحه «اتصال اینترنت قطع است» | `OfflineBanner` (جدید، سراسری در Root Layout) |

> **قانون برای Agent:** هیچ کامپوننت لیستی/فرمی نباید بدون پیاده‌سازی صریح این ۸ حالت تحویل داده شود. جزئیات الگوی پیاده‌سازی (مثلاً استفاده از TanStack Query's `isLoading`/`isError`/`data.length===0`) در `instruction.md` بخش «UI Rules» آمده است.

---

## 11. قرارداد کامل API (Endpoints)

> پیشوند مسیر همه Endpointهای مشتری: `/api/v1`. Auth: JWT مگر ذکر شود.

### 11.1 احراز هویت
| Method | Path | توضیح |
|---|---|---|
| POST | `/auth/login` | ورود با mobile+password → Access+Refresh Token |
| POST | `/auth/refresh` | تمدید Access Token از روی Refresh Cookie |
| POST | `/auth/logout` | ابطال Refresh Token |
| POST | `/auth/forgot-password` | ارسال OTP به موبایل |
| POST | `/auth/reset-password` | تایید OTP + تنظیم رمز جدید |
| PATCH | `/auth/change-password` | تغییر رمز (کاربر لاگین‌شده) |

### 11.2 داشبورد
| Method | Path | خروجی |
|---|---|---|
| GET | `/dashboard/summary` | تمام KPIها + اطلاعات محصول + اطلاعات کاربری در یک Response واحد (برای کاهش تعداد Request) |
| GET | `/dashboard/delivery-trend?months=12` | داده نمودار روند تحویل |

### 11.3 مالی
| Method | Path |
|---|---|
| GET | `/finance/transactions?from=&to=&page=&pageSize=` |
| GET | `/finance/status-statement?from=&to=` |
| GET | `/finance/statements` |
| GET | `/finance/statements/:id/pdf` |
| GET | `/finance/asset-report` |
| GET | `/finance/transactions/export/excel` |
| GET | `/finance/transactions/export/pdf` |
| POST | `/finance/receipts` (multipart/form-data: file, amount?, description?) |
| GET | `/finance/receipts` |

### 11.4 سفارشات
| Method | Path |
|---|---|
| GET | `/orders?status=&hasRemaining=&groupByProduct=&page=&pageSize=` |
| GET | `/orders/:id` |
| GET | `/orders/:id/loading-requests` |
| GET | `/orders/export/excel` |

### 11.5 اعلام بار
| Method | Path |
|---|---|
| GET | `/loading-requests?view=detail\|by-date&status=&from=&to=` |
| GET | `/loading-requests/:id` |
| POST | `/loading-requests` (body: orderId, productId, requestedQty, vehicleType, loadType, requestDate, destinationCity, additionalAddress?, destinationPostalCode?, recipientMobile, carrierId?) |
| PATCH | `/loading-requests/:id/cancel` |
| GET | `/loading-requests/export/excel` |
| **[Internal - ERP فقط]** PATCH | `/internal/loading-requests/:id/mark-loaded` (Header: X-Internal-Api-Key) — فقط برای انتقال خودکار وضعیت به LOADED هنگام تایید بارگیری در ERP |

### 11.6 تحویل
| Method | Path |
|---|---|
| GET | `/deliveries?view=detail\|by-product\|by-date&from=&to=` |
| GET | `/deliveries/:id` |
| GET | `/deliveries/print/pdf?from=&to=&view=` |
| GET | `/deliveries/export/excel` |
| **[Internal]** POST | `/internal/deliveries` (ایجاد رکورد تحویل توسط کارخانه/ERP وقتی LoadingRequest به LOADED می‌رسد) |

### 11.7 نظرسنجی
| Method | Path |
|---|---|
| GET | `/surveys/active` (وضعیت PUBLISHED که مشتری هنوز پاسخ نداده) |
| GET | `/surveys/history` (وضعیت PUBLISHED/CLOSED که مشتری قبلاً پاسخ داده) |
| POST | `/surveys/:id/answer` (body: answers: [{questionId, selectedOptionId}]) |

### 11.8 شکایات
| Method | Path |
|---|---|
| GET | `/complaints` |
| POST | `/complaints` (body: subject, description) |

> پاسخ به شکایت اکنون از طریق `/admin/complaints/:id/reply` انجام می‌شود (بخش ۱۱.۱۰)، نه یک Internal Endpoint جدا.

### 11.9 اعلانات
| Method | Path |
|---|---|
| GET | `/notifications?unreadOnly=` |
| PATCH | `/notifications/:id/read` |

### 11.9b فرم تماس عمومی (بدون Auth، پیشوند `/api/v1/public`)
| Method | Path | توضیح |
|---|---|---|
| POST | `/public/contact` (body: name, phoneOrEmail, message) | ارسال ایمیل به آدرس رسمی کارخانه (بخش ۹.۱۰.۴)؛ Rate Limit سخت‌گیرانه (مثلاً ۳ درخواست در ساعت به ازای هر IP) برای جلوگیری از Spam؛ بدون ذخیره در دیتابیس اصلی و بدون AuditLog |

### 11.10 داشبورد ادمین (پیشوند `/api/v1/admin` — محافظت‌شده با AdminGuard)

| Method | Path | توضیح |
|---|---|---|
| POST | `/admin/login` | ورود ادمین (username+password، role=ADMIN) |
| GET | `/admin/dashboard/summary` | KPIهای بخش ۹.۹.۱ (شامل تعداد کاربران آنلاین) |
| GET | `/admin/dashboard/activities?limit=20` | فید Latest Activities از AuditLog (بخش ۹.۹.۱) |
| GET | `/admin/dashboard/delivery-trend?range=daily\|weekly` | نمودار تحویل کل کارخانه |
| GET | `/admin/dashboard/loading-request-trend?range=daily` | نمودار روزانه ثبت اعلام بار به تفکیک وضعیت |
| GET | `/admin/customers?search=&page=` | لیست/جستجوی مشتریان |
| POST | `/admin/customers` | ایجاد مشتری + کاربر جدید (BR-26) |
| PATCH | `/admin/customers/:id` | ویرایش اطلاعات مشتری |
| PATCH | `/admin/customers/:id/toggle-active` | فعال/غیرفعال کردن حساب |
| PATCH | `/admin/customers/:id/reset-password` | بازنشانی رمز عبور مشتری |
| GET | `/admin/loading-requests?status=SUBMITTED&page=` | کارتابل اعلام بار (بخش ۹.۹.۳) |
| GET | `/admin/loading-requests/:id` | جزئیات کامل + مانده موجودی (BR-25) |
| PATCH | `/admin/loading-requests/:id/approve` | تایید درخواست |
| PATCH | `/admin/loading-requests/:id/reject` (body: reason) | رد درخواست با دلیل اجباری |
| GET | `/admin/complaints?status=` | همه شکایات همه مشتریان |
| PATCH | `/admin/complaints/:id/reply` (body: reply) | ثبت پاسخ نهایی |
| GET | `/admin/surveys` | لیست همه نظرسنجی‌ها |
| POST | `/admin/surveys` (body: title, description?, questions:[{text, options:[text]}]) | ایجاد نظرسنجی جدید در وضعیت DRAFT (BR-27) |
| PATCH | `/admin/surveys/:id/publish` | انتشار (DRAFT/CLOSED → PUBLISHED)، بستن خودکار نظرسنجی منتشرشده قبلی |
| PATCH | `/admin/surveys/:id/close` | بستن دستی (→ CLOSED) |
| GET | `/admin/surveys/:id/results` | آمار پاسخ‌ها به تفکیک سوال/گزینه |

### 11.11 فرمت پاسخ استاندارد
```json
// موفق
{ "success": true, "data": { ... }, "meta": { "page": 1, "pageSize": 20, "total": 45 } }

// خطا
{ "success": false, "error": { "code": "LOADING_REQUEST_CUTOFF_PASSED", "message": "مهلت ثبت درخواست برای فردا به پایان رسیده است." } }
```


---

## 12. لایه یکپارچه‌سازی با ERP (Integration Layer)

از آن‌جا که نوع دقیق ERP کارخانه مشخص نیست (طبق پاسخ کارفرما)، این لایه باید با **الگوی Adapter/Port** طراحی شود تا مستقل از فناوری ERP باشد و به‌سادگی جایگزین شود.

### 12.1 طراحی Interface مشترک (کامل‌شده)

```typescript
interface ErpAdapter {
  // --- Read (ERP → Portal) ---
  getCustomers(since?: Date): Promise<ErpCustomerDto[]>;
  getOrders(customerCode?: string, since?: Date): Promise<ErpOrderDto[]>;
  getProducts(): Promise<ErpProductDto[]>;
  getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto>; // مانده برگ فروش
  getDeliveries(since?: Date): Promise<ErpDeliveryDto[]>;
  getInvoices(customerCode: string, from: Date, to: Date): Promise<ErpInvoiceDto[]>; // شامل هر ۴ زیرتب مالی

  // --- Write (Portal → ERP) ---
  submitLoadingRequest(request: ErpLoadingRequestSubmissionDto): Promise<{ erpReferenceId: string }>;
  syncLoadingStatus(requestNumber: string, status: string, note?: string): Promise<void>;
}
```

هر پیاده‌سازی (`MockErpAdapter`, `SqlServerErpAdapter`, `RestApiErpAdapter`, `FileBasedErpAdapter`) دقیقاً همین Interface را پیاده‌سازی می‌کند؛ ماژول `erp-integration` هرگز مستقیماً به یک پیاده‌سازی خاص وابسته نیست (تزریق از طریق DI Token در NestJS، انتخاب پیاده‌سازی از `.env`: `ERP_ADAPTER=mock|sql-server|rest-api|file-based`).

### 12.2 Mock ERP Adapter — پیاده‌سازی پیش‌فرض فاز ۱ (بسیار مهم)

از آن‌جا که تصمیم نهایی درباره نوع ERP هنوز مشخص نیست (بخش ۱۲ - تایید کارفرما)، **پروژه از روز اول باید با `MockErpAdapter` به‌طور کامل قابل اجرا و دمو باشد**، بدون هیچ وابستگی به ERP واقعی. این Adapter:
- تمام متدهای `ErpAdapter` را با داده‌های درون‌حافظه‌ای/دیتابیس محلی (همان Seed Data بخش ۱۹) پیاده‌سازی می‌کند
- `submitLoadingRequest` را به‌سادگی در دیتابیس محلی ثبت می‌کند (بدون تماس خارجی واقعی)
- تاخیر مصنوعی (Artificial Latency، مثلاً ۲۰۰-۵۰۰ میلی‌ثانیه Random) شبیه‌سازی می‌کند تا رفتار Loading State های UI در محیط توسعه واقعی‌تر تست شود
- به‌صورت پیش‌فرض در `docker-compose` و محیط توسعه فعال است؛ سوییچ به اداپتور واقعی فقط با تغییر یک متغیر محیطی (`ERP_ADAPTER=sql-server`) انجام می‌شود، بدون تغییر در کد ماژول‌های کسب‌وکاری
- **این یعنی Claude Code باید کل پروژه (هر دو پورتال مشتری و ادمین) را کاملاً کاربردی و قابل‌دمو با MockErpAdapter تحویل دهد؛ اتصال به ERP واقعی صرفاً «تعویض یک پیاده‌سازی» در فاز ۶ خواهد بود.**

### 12.3 پیاده‌سازی‌های ممکن (بسته به تعیین نهایی کارخانه)
- `MockErpAdapter`: پیش‌فرض توسعه/دمو (بخش ۱۲.۲)
- `SqlServerErpAdapter`: اتصال مستقیم Read-Only به دیتابیس SQL Server کارخانه (از طریق View های مشخص که DBA کارخانه فراهم می‌کند) — **پیشنهاد اول در صورت عدم وجود API استاندارد**
- `RestApiErpAdapter`: در صورتی که ERP (مثل راهکاران/سپیدار) API REST/SOAP ارائه دهد
- `FileBasedErpAdapter`: fallback ساده — Export دوره‌ای فایل (CSV/Excel) از ERP در یک پوشه مشترک و Import خودکار توسط Job زمان‌بندی‌شده (کمترین اتکا به هماهنگی فنی طرف ERP)

### 12.4 Sync Job (زمان‌بندی‌شده - با BullMQ/Cron)
- Sync مشتریان و سفارشات: هر ۱۵ دقیقه
- Sync مالی: هر ۳۰ دقیقه یا Real-time در صورت وجود Webhook از ERP
- Sync محصولات: روزانه (تغییرات نادر)
- ثبت هر اجرا در جدول `ErpSyncLog` با وضعیت موفق/ناموفق برای رصدپذیری (Observability)

### 12.5 جهت داده‌ها
- **ERP → Portal (اکثر داده‌ها):** Customer, Order, Product, FinancialTransaction, Delivery-status-updates
- **Portal → ERP/Admin (محدود):** LoadingRequest جدید (به کارتابل مدیر فروش)، PaymentReceipt (اعلام به واحد مالی)، Complaint (اعلام به واحد پاسخگویی)

### 12.6 پیشنهاد امنیتی
- تمام ارتباط با ERP از طریق شبکه داخلی/VPN کارخانه (نه اینترنت عمومی)
- اگر SQL Server مستقیم استفاده شود: کاربر دیتابیس اختصاصی **فقط با دسترسی SELECT** روی View های تعریف‌شده (هرگز دسترسی مستقیم به جداول اصلی ERP)

---

## 13. الزامات غیرفنی (Non-Functional Requirements)

| دسته | الزام |
|---|---|
| امنیت | HTTPS اجباری، Helmet.js، Rate Limiting روی Login و فرم‌های Write، Input Sanitization، CSRF Protection برای Cookie-based Refresh Token |
| Audit | ثبت تمام عملیات Write در `AuditLog` (چه کسی، چه زمانی، چه عملیاتی) |
| کارایی | زمان پاسخ API زیر ۳۰۰ میلی‌ثانیه برای Endpointهای لیستی (با Index مناسب روی `customerId`, `status`, `date`) |
| زبان/محلی‌سازی | فارسی کامل، تقویم شمسی (Jalali) در همه تاریخ‌ها، اعداد فارسی در نمایش (اما ذخیره‌سازی اعداد/تاریخ در دیتابیس همیشه میلادی/عددی استاندارد) |
| دسترس‌پذیری (Accessibility) | Contrast مناسب، ARIA labels روی فرم‌ها (خصوصاً چون shadcn/ui روی Radix بنا شده که خودش Accessible است) |
| ریسپانسیو | پشتیبانی کامل موبایل/تبلت/دسکتاپ |
| مانیتورینگ | Log ساختاریافته (Pino) + آماده برای اتصال به ابزار مانیتورینگ (Sentry برای Error Tracking پیشنهاد می‌شود) |
| پشتیبان‌گیری | Backup روزانه PostgreSQL (خارج از دامنه کد، اما باید در Deployment مستند شود) |
| مقیاس‌پذیری | معماری Stateless Backend (امکان اجرای چند Instance پشت Load Balancer) |

### 13.1 استراتژی Caching (Redis)

هدف: کاهش فشار روی PostgreSQL برای Endpointهای پرتکرار و کم‌تغییر.

| داده Cache‌شونده | TTL پیشنهادی | کلید نمونه | نکته Invalidation |
|---|---|---|---|
| `GET /dashboard/summary` (مشتری) | ۶۰ ثانیه | `dashboard:{customerId}` | Invalidate هنگام تغییر وضعیت هر LoadingRequest/Delivery مرتبط با آن مشتری |
| `GET /admin/dashboard/summary` | ۳۰ ثانیه | `admin:dashboard:summary` | Invalidate هنگام هر Approve/Reject/Delivery جدید |
| `GET /products` (لیست محصولات فعال) | ۱۰ دقیقه | `products:active` | Invalidate هنگام Sync محصولات از ERP (بخش ۱۲.۴) |
| `GET /notifications?unreadOnly=true` (شمارنده) | ۱۵ ثانیه | `notif:unread:{userId}` | Invalidate بلافاصله هنگام ثبت Notification جدید یا Mark-as-read |

- کتابخانه پیشنهادی: `@nestjs/cache-manager` + `cache-manager-redis-store`
- **قانون:** هرگز داده مالی حساس (تراکنش‌ها، مانده حساب دقیق) را برای بیش از چند ثانیه Cache نکنید؛ Cache فقط برای KPI/شمارنده/لیست‌های نسبتاً ایستا مجاز است، نه برای داده‌ای که مبنای تصمیم مالی مشتری است.
- Redis همچنین برای BullMQ (صف Sync ERP، بخش ۱۲.۳) استفاده می‌شود؛ از یک Redis Instance مشترک با Database Index جدا برای Cache و Queue استفاده شود.

---

## 14. ساختار پوشه‌بندی پروژه (Folder Structure پیشنهادی)

```
cement-portal/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (public)/             # لندینگ پیج عمومی - بخش ۹.۱۰ (بدون Auth)
│   │   │   │   ├── page.tsx          # خانه
│   │   │   │   ├── news/
│   │   │   │   ├── announcements/
│   │   │   │   ├── reports/
│   │   │   │   ├── media/{photos,videos}/
│   │   │   │   ├── about/
│   │   │   │   ├── contact/
│   │   │   │   └── layout.tsx        # Navbar/Footer عمومی (متفاوت از Header پورتال)
│   │   │   ├── (auth)/login/         # صفحه Login مشتری
│   │   │   ├── (portal)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── finance/
│   │   │   │   ├── orders/
│   │   │   │   ├── loading-requests/
│   │   │   │   ├── deliveries/
│   │   │   │   ├── surveys/
│   │   │   │   ├── complaints/
│   │   │   │   └── layout.tsx        # Header + Navbar مشترک پورتال مشتری
│   │   │   ├── (admin)/              # داشبورد ادمین - بخش ۹.۹
│   │   │   │   ├── login/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── customers/
│   │   │   │   ├── loading-requests/
│   │   │   │   ├── complaints/
│   │   │   │   ├── surveys/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── content/                  # محتوای Markdown/MDX لندینگ - بخش ۹.۱۰.۱ (مدیریت توسط پشتیبان سایت، جدا از دیتابیس)
│   │   │   ├── news/
│   │   │   ├── announcements/
│   │   │   ├── reports/
│   │   │   └── about.mdx
│   │   ├── public/media/{photos,videos}/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── shared/               # SmartTable, FilterBar, ExportButtons, EmptyState, StatusBadge, GlassCard, ...
│   │   │   ├── dashboard/            # KPI Cards, Charts
│   │   │   └── public-site/          # کامپوننت‌های اختصاصی لندینگ (Hero, NewsCard, MediaGallery, ...)
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   ├── jalali.ts
│   │   │   └── persian-digits.ts
│   │   └── hooks/
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── customers/
│       │   │   ├── orders/
│       │   │   ├── loading-requests/
│       │   │   ├── deliveries/
│       │   │   ├── finance/
│       │   │   ├── surveys/
│       │   │   ├── complaints/
│       │   │   ├── notifications/
│       │   │   ├── public-contact/   # فرم تماس با ما لندینگ - بخش ۹.۱۰.۴ (بدون Auth، بدون DB - فقط ارسال ایمیل)
│       │   │   └── erp-integration/
│       │   │       ├── adapters/
│       │   │       │   ├── sql-server.adapter.ts
│       │   │       │   ├── rest-api.adapter.ts
│       │   │       │   └── file-based.adapter.ts
│       │   │       └── erp-adapter.interface.ts
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── interceptors/     # audit-log.interceptor.ts
│       │   │   ├── filters/
│       │   │   └── decorators/
│       │   └── main.ts
│       └── prisma/
│           └── schema.prisma
│
├── docker-compose.yml
├── .env.example
└── PRD.md                            # همین سند
```


---

## 15. نقشه راه و چک‌لیست پیاده‌سازی برای ایجنت (Claude Code)

> این چک‌لیست به ترتیب اجرا طراحی شده؛ Claude Code باید هر فاز را کامل و تست‌شده تحویل دهد پیش از رفتن به فاز بعد.

### فاز ۰ — راه‌اندازی زیرساخت
- [ ] Monorepo با ساختار بخش ۱۴ ایجاد شود (پیشنهاد: Turborepo یا Nx برای مدیریت apps/web و apps/api)
- [ ] Docker Compose با سرویس‌های postgres, redis, backend, frontend
- [ ] تنظیم Prisma + اجرای Migration اولیه از Schema بخش ۵ (شامل Soft Delete بخش ۵.۲ و AuditLog/Attachment)
- [ ] پیاده‌سازی `MockErpAdapter` (بخش ۱۲.۲) به‌عنوان پیاده‌سازی پیش‌فرض `ERP_ADAPTER` — از همین فاز پروژه باید کاملاً قابل اجرا باشد
- [ ] راه‌اندازی `error-codes.ts` مرکزی (بخش ۱۶) و `GlobalExceptionFilter`
- [ ] تنظیم ESLint/Prettier مشترک

### فاز ۱ — احراز هویت
- [ ] پیاده‌سازی کامل ماژول Auth برای هر دو نقش CUSTOMER و ADMIN (بخش ۶ و ۱۱.۱ و ۱۱.۱۰)
- [ ] صفحه Login مشتری طبق مشخصات ۹.۱ + صفحه Login ادمین (`/admin/login`)
- [ ] Guard های `JwtAuthGuard` + `CustomerScopeGuard` + `AdminGuard`
- [ ] تست: مشتری A نتواند به داده مشتری B دسترسی پیدا کند (تست امنیتی حیاتی)
- [ ] تست: کاربر CUSTOMER نتواند هیچ مسیر `/admin/*` را فراخوانی کند و برعکس

### فاز ۲ — ماژول‌های Read Only (سفارشات، تحویل، مالی، داشبورد پایه)
- [ ] Seed Data کامل طبق بخش ۱۹ (۱۰۰ مشتری، ۲۵۰ سفارش، ۳۰۰ اعلام‌بار، ۹۰۰ تحویل و ... با پوشش همه سناریوهای ۱۹.۲) برای تست و دمو
- [ ] پیاده‌سازی Endpointهای GET بخش ۱۱.۲ تا ۱۱.۶
- [ ] کامپوننت `SmartTable` عمومی (بخش ۱۰.۷) + پیاده‌سازی کامل ۸ حالت Frontend State (بخش ۱۰.۹) + استفاده در هر ۴ صفحه
- [ ] Export Excel در همه صفحات
- [ ] تولید PDF واقعی برای صفحه تحویل (بخش ۹.۶)

### فاز ۳ — هسته اعلام بار (مهم‌ترین فاز)
- [ ] پیاده‌سازی `LoadingRequestStateMachine` طبق بخش ۸.۱
- [ ] اعتبارسنجی کامل BR-04 تا BR-11 و BR-24 (شامل فیلدهای جدید: نوع بار، مقصد بار، موبایل تحویل‌گیرنده) با کدهای خطای بخش ۱۶ (`LOAD_001` تا `LOAD_006`)
- [ ] فرم ثبت درخواست (بخش ۹.۵) با تمام Validationها
- [ ] اتصال به `NotificationService` طبق ماتریس بخش ۱۷ (رویدادهای مربوط به اعلام بار)
- [ ] تست‌های واحد کامل روی تمام حالت‌های مهلت زمانی (قبل/بعد ساعت ۱۵) و موجودی ناکافی

### فاز ۴ — نظرسنجی و شکایات (سمت مشتری)
- [ ] پیاده‌سازی بخش ۹.۷ و ۹.۸ طبق BR-19 تا BR-23 و State Machine های بخش ۸.۲/۸.۳

### فاز ۴.۵ — داشبورد ادمین/Command Center (جدید)
- [ ] پیاده‌سازی کامل ماژول Admin طبق بخش ۹.۹ و Endpointهای ۱۱.۱۰ (شامل فید Latest Activities از AuditLog و شمارنده کاربران آنلاین)
- [ ] مدیریت مشتریان: ایجاد/ویرایش/فعال‌سازی (BR-26، با Soft Delete بخش ۵.۲)
- [ ] کارتابل اعلام بار: نمایش جزئیات کامل + مانده موجودی (BR-25) + تایید/رد (با دلیل اجباری برای رد - خطای `ADMIN_002`)
- [ ] مدیریت شکایات: مشاهده و پاسخ
- [ ] فرم‌ساز نظرسنجی (چرخه DRAFT→PUBLISHED→CLOSED بخش ۸.۳) + مشاهده نتایج آماری (BR-27)
- [ ] اتصال کامل ماتریس اعلانات ادمین (بخش ۱۷)
- [ ] اطمینان از یکسان بودن Design System با پورتال مشتریان (بخش ۱۰)
- [ ] تست: پس از تایید/رد ادمین، وضعیت بلافاصله در پورتال مشتری منعکس شود (و Notification ارسال شود)

### فاز ۵ — بازطراحی بصری داشبورد مشتری
- [ ] پیاده‌سازی کامل Design System بخش ۱۰ (شامل Design Tokens ۱۰.۶ و Component Library ۱۰.۷)
- [ ] پیاده‌سازی کارت‌های KPI + نمودار روند تحویل (بخش ۱۰.۸)
- [ ] انیمیشن‌ها (Framer Motion) و Responsive کامل
- [ ] راه‌اندازی Caching (بخش ۱۳.۱) برای Endpointهای پرترافیک داشبورد

### فاز ۵.۵ — لندینگ پیج عمومی کارخانه (جدید)
- [ ] پیاده‌سازی Route Group `(public)` طبق بخش ۹.۱۰ (کاملاً مستقل از Auth/دیتابیس اصلی)
- [ ] راه‌اندازی ساختار محتوای Markdown/MDX (`content/`) طبق بخش ۹.۱۰.۱ + مستندسازی کوتاه برای پشتیبان سایت درباره نحوه افزودن خبر/اطلاعیه/گزارش/عکس/فیلم جدید
- [ ] پیاده‌سازی هر ۹ صفحه جدول بخش ۹.۱۰.۳ (خانه، اخبار، اطلاعیه‌ها، گزارش‌ها، عکس، فیلم، درباره ما، تماس با ما) با Next.js SSG/ISR
- [ ] پیاده‌سازی فرم تماس (`POST /public/contact`) با Rate Limiting
- [ ] دکمه/لینک «پورتال مشتریان» در Navbar عمومی → `/login`
- [ ] بهینه‌سازی SEO (Metadata، Open Graph) طبق بخش ۹.۱۰.۵
- [ ] Placeholder گذاری مشخص برای آدرس/تلفن/ایمیل/لوگوی واقعی نی‌ریز (بخش ۲۰.۲) تا زمان دریافت داده واقعی از کارفرما

### فاز ۶ — یکپارچه‌سازی ERP واقعی
- [ ] انتخاب نهایی نوع Adapter (بخش ۱۲.۳) بر اساس تصمیم کارخانه؛ صرفاً تعویض `ERP_ADAPTER` env بدون تغییر کد ماژول‌های کسب‌وکاری
- [ ] پیاده‌سازی Sync Job و `ErpSyncLog`
- [ ] Endpoint داخلی `mark-loaded` برای اتصال نهایی به فرآیند بارگیری واقعی کارخانه
- [ ] تست End-to-End با داده واقعی/نمونه از کارخانه

### فاز ۷ — تست، سخت‌سازی امنیتی و آماده‌سازی Production
- [ ] اجرای کامل استراتژی تست بخش ۱۸ (Unit/Integration/API/UI/E2E/Seed Validation/Load Test) با پوشش حداقل ۸۰٪
- [ ] الزامات بخش ۱۳ (Rate Limiting، Audit Log، HTTPS، Sentry)
- [ ] بازبینی نهایی RBAC و Data Scoping (خصوصاً مرز CUSTOMER/ADMIN)
- [ ] مستندسازی Swagger کامل و بررسی نهایی

---

## 16. کاتالوگ خطاها (Error Catalog)

تمام خطاهای Backend باید از این کاتالوگ استفاده کنند (فرمت پاسخ طبق بخش ۱۱.۱۱: `{code, message}`). این جدول مرجع واحد Frontend/Backend است تا پیام‌های خطا در همه‌جا یکدست باشند.

| Code | معنی | HTTP Status | پیام فارسی نمونه |
|---|---|---|---|
| `AUTH_001` | نام کاربری یا رمز اشتباه | 401 | «نام کاربری یا رمز عبور اشتباه است» |
| `AUTH_002` | حساب قفل‌شده (تلاش ناموفق زیاد) | 429 | «حساب شما موقتاً قفل شده؛ لطفاً ۱۵ دقیقه دیگر تلاش کنید» |
| `AUTH_003` | Token منقضی/نامعتبر | 401 | «نشست شما منقضی شده، دوباره وارد شوید» |
| `AUTH_004` | دسترسی غیرمجاز به مسیر ادمین/مشتری | 403 | «شما دسترسی لازم برای این بخش را ندارید» |
| `ORDER_001` | سفارش یافت نشد یا متعلق به این مشتری نیست | 404 | «سفارش مورد نظر یافت نشد» |
| `LOAD_001` | مانده سفارش کافی نیست (BR-05) | 422 | «مقدار درخواستی بیشتر از باقیمانده سفارش شماست» |
| `LOAD_002` | مهلت ثبت درخواست گذشته (BR-04، بعد از ساعت ۱۵) | 422 | «مهلت ثبت درخواست برای فردا به پایان رسیده است» |
| `LOAD_003` | تاریخ درخواستی نامعتبر (باید = فردا) | 422 | «تاریخ درخواستی باید فردا باشد» |
| `LOAD_004` | تلاش برای لغو درخواست بارگیری‌شده (BR-10) | 409 | «امکان لغو درخواست بارگیری‌شده وجود ندارد» |
| `LOAD_005` | موجودی/مانده صفر یا منفی | 422 | «موجودی این محصول برای شما کافی نیست» |
| `LOAD_006` | فیلد موبایل تحویل‌گیرنده خالی (BR-24) | 422 | «شماره موبایل تحویل‌گیرنده الزامی است» |
| `SURVEY_001` | مشتری قبلاً به این نظرسنجی پاسخ داده (BR-20) | 409 | «شما قبلاً به این نظرسنجی پاسخ داده‌اید» |
| `SURVEY_002` | پاسخ ناقص (همه سوالات پاسخ داده نشده) | 422 | «لطفاً به همه سوالات پاسخ دهید» |
| `SURVEY_003` | نظرسنجی منتشرشده یافت نشد/منقضی شده | 404 | «این نظرسنجی دیگر فعال نیست» |
| `COMPLAINT_001` | فیلد موضوع/شرح خالی | 422 | «موضوع و شرح شکایت الزامی است» |
| `RECEIPT_001` | فرمت فایل نامعتبر (BR-16) | 422 | «فرمت فایل باید jpg، png یا pdf باشد» |
| `RECEIPT_002` | حجم فایل بیش از حد مجاز (۵MB) | 413 | «حجم فایل نباید بیشتر از ۵ مگابایت باشد» |
| `ADMIN_001` | کد ملی مشتری تکراری هنگام ایجاد (BR-26/BR-28) | 409 | «مشتری‌ای با این کد ملی از قبل وجود دارد» |
| `ADMIN_002` | تلاش رد درخواست بدون ذکر دلیل (BR-11) | 422 | «برای رد درخواست، ذکر دلیل الزامی است» |
| `ERP_001` | خطا در ارتباط با ERP/Sync ناموفق | 503 | «خطا در دریافت اطلاعات؛ لطفاً بعداً تلاش کنید» |
| `GENERIC_500` | خطای پیش‌بینی‌نشده سرور | 500 | «خطایی رخ داده است؛ لطفاً بعداً تلاش کنید» |

> **قانون برای Agent:** هر Exception سفارشی در NestJS باید از یک کلاس پایه `AppException(code, message, httpStatus)` ارث ببرد و `GlobalExceptionFilter` آن را به فرمت استاندارد بخش ۱۱.۱۱ تبدیل کند. کدهای بالا نباید در چند جای کد Hardcode شوند؛ در یک فایل `error-codes.ts` مرکزی نگه‌داری شوند.

---

## 17. ماتریس اعلانات (Notification Matrix)

مشخص می‌کند هر رویداد سیستم، به چه کسی Notification می‌فرستد (رکورد در جدول `Notification`، بخش ۵). ستون Customer یعنی به همان مشتری مرتبط با رویداد؛ ستون Admin یعنی به همه کاربران ADMIN (Broadcast، `customerId=null`).

| رویداد | مشتری | ادمین | متن نمونه (برای مشتری/ادمین) |
|---|---|---|---|
| ثبت درخواست اعلام بار جدید | ❌ | ✅ | «درخواست اعلام بار جدید از [مشتری] در انتظار بررسی است» |
| تایید درخواست اعلام بار | ✅ | ❌ | «درخواست اعلام بار شماره [X] شما تایید شد» |
| رد درخواست اعلام بار | ✅ | ❌ | «درخواست اعلام بار شماره [X] شما رد شد: [دلیل]» |
| لغو درخواست اعلام بار توسط مشتری | ❌ | ✅ | «مشتری [نام] درخواست شماره [X] را لغو کرد» |
| بارگیری تکمیل شد (LOADED) | ✅ | ❌ | «بارگیری درخواست شماره [X] شما انجام شد» |
| ثبت شکایت جدید | ❌ | ✅ | «شکایت جدید از [مشتری] ثبت شد» |
| پاسخ به شکایت | ✅ | ❌ | «به شکایت شما پاسخ داده شد» |
| انتشار نظرسنجی جدید | ✅ (Broadcast به همه مشتریان فعال) | ❌ | «نظرسنجی جدید منتظر پاسخ شماست» |
| بارگذاری فیش واریزی توسط مشتری | ❌ | ✅ | «فیش واریزی جدید از [مشتری] بارگذاری شد» |
| ایجاد مشتری جدید توسط ادمین دیگر | ❌ | ✅ (به سایر ادمین‌ها) | «مشتری جدید [نام] توسط [ادمین] ایجاد شد» |
| نزدیک شدن مهلت ثبت اعلام بار (اختیاری، ۳۰ دقیقه قبل از ساعت ۱۵) | ✅ | ❌ | «فقط ۳۰ دقیقه تا پایان مهلت ثبت اعلام بار فردا باقی مانده» |

> پیاده‌سازی: یک `NotificationService.emit(event, payload)` مرکزی در Backend که بر اساس این جدول تصمیم می‌گیرد به کدام `customerId` یا به همه ادمین‌ها رکورد `Notification` بسازد؛ منطق تصمیم‌گیری نباید در Controllerهای مختلف پخش/تکرار شود.

---

## 18. استراتژی تست (Test Strategy)

| نوع تست | ابزار پیشنهادی | پوشش الزامی |
|---|---|---|
| **Unit Test** | Jest | تمام Service های Business Logic؛ به‌خصوص `LoadingRequestStateMachine` (بخش ۸.۱)، محاسبات BR-04/BR-05، State Machine های Complaint/Survey |
| **Integration Test** | Jest + Testcontainers (PostgreSQL واقعی در Container) | تعامل Service↔Repository↔Database برای هر ماژول (Orders، LoadingRequests، Finance، ...) |
| **API Test** | Supertest (روی NestJS) | تمام Endpointهای بخش ۱۱، شامل حالات خطا (کاتالوگ بخش ۱۶) و Guard های RBAC (مشتری A نمی‌تواند داده B را ببیند؛ CUSTOMER نمی‌تواند `/admin/*` را بزند) |
| **UI Test / Snapshot** | React Testing Library + Vitest | کامپوننت‌های بخش ۱۰.۷ (`SmartTable`, `StatusBadge`, `GlassCard`, ...) در تمام ۸ حالت بخش ۱۰.۹ |
| **E2E Test** | Playwright | سناریوهای کامل کاربر: (۱) ورود مشتری → ثبت اعلام بار → لغو آن، (۲) ورود ادمین → تایید یک درخواست → بررسی وضعیت در پورتال مشتری، (۳) ثبت شکایت → پاسخ ادمین → مشاهده پاسخ توسط مشتری، (۴) پاسخ به نظرسنجی |
| **Seed Validation Test** | اسکریپت Node.js ساده در CI | بعد از اجرای Seed (بخش ۱۹)، تعداد رکوردهای هر جدول و صحت روابط (مثلاً هر LoadingRequest به یک Order معتبر همان Customer اشاره کند) را Assert می‌کند |
| **Load Test** | k6 یا Artillery | Endpointهای پرترافیک (`GET /orders`, `GET /dashboard/summary`) زیر بار ۵۰-۱۰۰ کاربر همزمان؛ هدف: زمان پاسخ زیر ۳۰۰ms (بخش ۱۳) حتی زیر بار |

### الزامات پوشش (Coverage Gate)
- حداقل ۸۰٪ Coverage برای Service های Business Logic (خصوصاً هسته اعلام بار - فاز ۳)
- هیچ Pull Request/فازی بدون تست سبز نباید «کامل» تلقی شود (طبق چک‌لیست بخش ۱۵)
- تست‌های BR-04 (مهلت ساعت ۱۵) باید ساعت سیستم را Mock کنند (نه منتظر ساعت واقعی بمانند)

---

## 19. مشخصات کامل Seed Data (Mock Data Requirements)

هدف: پروژه از **روز اول توسعه** کاملاً قابل نمایش و دمو باشد، بدون نیاز به انتظار برای داده واقعی ERP (با استفاده از `MockErpAdapter` بخش ۱۲.۲).

### 19.1 حجم داده (Volume)

| موجودیت | تعداد | نکته |
|---|---|---|
| Customer | 100 | شامل چند مشتری با `isActive=false` برای تست فیلتر |
| Product | 4-6 | مطابق بخش ۱۹.۳ + ۲ محصول آینده (پوزولانی، رده ۴۲.۵) برای تست BR-17 |
| Order | 250 | توزیع‌شده بین ۱۰۰ مشتری (میانگین ۲-۳ سفارش هر مشتری) |
| LoadingRequest | 300 | پوشش همه ۵ وضعیت (زیر بخش ۱۹.۲) |
| Delivery | 900 | شامل تحویل‌های چندگانه برای درخواست‌های LOADED (هر LoadingRequest بارگیری‌شده ⇒ دقیقاً یک Delivery، پس این عدد باید با تعداد LoadingRequest های LOADED هماهنگ باشد؛ اگر ۹۰۰ خواسته شده، یعنی تاریخچه طولانی‌تری از تحویل‌های قدیمی‌تر از دوره Seed فعلی هم باید تولید شود، نه فقط ۱:۱ با LoadingRequest های این دوره) |
| FinancialTransaction | 600 | پوشش هر ۴ زیرتب مالی (`FinanceSourceType`) |
| Complaint | 80 | ۶۰٪ ANSWERED / ۴۰٪ PENDING |
| Survey | 6 | ۱ عدد PUBLISHED، بقیه CLOSED (تاریخچه) |
| Notification | 40+ | ترکیبی از مشتری و ادمین |
| User (مشتری) | 100 (هم‌راستا با Customer) | |
| User (ادمین) | 2-3 | برای تست چند-ادمین همزمان |

### 19.2 سناریوهای الزامی (باید حتماً در Seed پوشش داده شوند)

| سناریو | چرا لازم است |
|---|---|
| سفارش تکمیل‌شده (`remainingQty=0`) | تست فیلتر «دارای مانده» (بخش ۹.۴) |
| سفارش نیمه‌تحویل (`0 < remainingQty < totalQty`) | رایج‌ترین حالت واقعی |
| سفارش بدون هیچ اعلام باری | تست Empty State در Drawer جزئیات سفارش |
| درخواست اعلام بار در وضعیت SUBMITTED | تست کارتابل ادمین |
| درخواست رد‌شده با دلیل | تست نمایش `reviewedByNote` به مشتری |
| درخواست لغوشده توسط مشتری (هم از SUBMITTED هم از APPROVED) | تست هر دو مسیر BR-10 |
| درخواست بارگیری‌شده با Delivery متناظر | تست کامل زنجیره LoadingRequest→Delivery |
| شکایت پاسخ‌داده‌شده | تست نمایش پاسخ در پورتال مشتری |
| شکایت باز (PENDING) | تست کارتابل شکایات ادمین |
| نظرسنجی فعال (PUBLISHED) بدون پاسخ مشتری فعلی | تست فرم پاسخ‌دهی |
| نظرسنجی بسته‌شده (CLOSED) با نتایج | تست نمودار نتایج ادمین |
| فیش واریزی در وضعیت PENDING/REVIEWED | تست هر دو وضعیت در UI مالی |
| مشتری غیرفعال (`isActive=false`) | تست جلوگیری از ورود |

### 19.3 نمونه JSON اولیه (شروع سریع)

```json
{
  "products": [
    { "erpCode": "2001240001", "name": "سیمان پاکتی تیپ ۲ داخلی", "type": "BAGGED" },
    { "erpCode": "2001240002", "name": "سیمان پاکتی تیپ ۲-۴۲۵ داخلی", "type": "BAGGED" },
    { "erpCode": "2001240004", "name": "سیمان فله تیپ ۲-۴۲۵ داخلی", "type": "BULK" },
    { "erpCode": "2001240005", "name": "سیمان فله پوزولانی داخلی", "type": "BULK" }
  ],
  "sampleCustomer": {
    "customerCode": "[کد تفصیل نمونه]",
    "nationalId": "[کد ملی نمونه - ۱۰ رقمی]",
    "name": "[نام مشتری نمونه]",
    "mobile": "0912XXXXXXX",
    "address": "[آدرس نمونه - نزدیک نی‌ریز، استان فارس - باید با داده واقعی جایگزین شود]"
  },
  "sampleAdmin": {
    "username": "09120000000",
    "fullName": "مدیر فروش نمونه",
    "role": "ADMIN"
  }
}
```

> پیاده‌سازی: یک اسکریپت `prisma/seed.ts` با استفاده از `@faker-js/faker` (با Locale فارسی برای نام/آدرس در صورت وجود، یا Fallback دستی به لیست نام‌های فارسی نمونه) که دقیقاً حجم و سناریوهای بالا را تولید کند و توسط `npx prisma db seed` قابل اجرا باشد. اسکریپت باید Idempotent باشد (اجرای دوباره، داده تکراری نسازد).

---

## 20. پیوست‌ها

### 20.1 واژه‌نامه (Glossary)

| اصطلاح فارسی | معادل سیستمی |
|---|---|
| اعلام بار | LoadingRequest |
| ریز تحویل / سرجمع محصول / سرجمع تاریخ | View Modes: detail / by-product / by-date |
| مانده برگ فروش | Remaining sales allowance (بر مبنای Order.remainingQty) |
| فی پایه / مبلغ پایه | Base unit price / Base amount |
| ارزش افزوده | VAT |
| کاردکس | آیکون لینک به جزئیات/تاریخچه مرتبط یک ردیف |
| باربری | Carrier (شرکت حمل) |
| صورت وضعیت | Debit/Credit ledger statement |
| بار فیکس/غیرفیکس | Full-truckload (تناژ ثابت) در مقابل تناژ متغیر |

### 20.2 مفروضات باز که باید قبل/حین توسعه با کارخانه تایید شود

این موارد در طول تحلیل مشخص شدند اما پاسخ قطعی از کارفرما دریافت نشد؛ Agent باید طبق مقادیر پیش‌فرض زیر پیش برود ولی این فرض‌ها را در کد Comment و در این PRD Flag نگه دارد تا در بازبینی نهایی اصلاح شوند:

1. ~~پنل ادمین~~ — **رفع‌شده:** پنل ادمین اکنون در دامنه پروژه است (بخش ۹.۹، ۱۱.۱۰).
2. **ستون‌های دقیق سه تب مالی (صورت وضعیت/صورت‌حساب‌ها/گزارش دارایی):** فقط تب «تراکنش‌ها» در تصویر واقعی دیده شد؛ سایر ستون‌ها بر پایه الگوهای استاندارد فرض شده‌اند.
3. **جزئیات هر ردیف تحویل (Modal/Detail):** جدول تحویل فعلی همه فیلدها را به‌صورت افقی نشان می‌دهد؛ فرض شده نیازی به Modal جداگانه نیست.
4. **کارت «آخرین شکایت» در داشبورد:** در پیشنهاد اولیه بود اما در تایید نهایی کارفرما ذکر نشد.
5. **SMS Provider برای OTP و اطلاع‌رسانی:** انتخاب سرویس‌دهنده پیامک باید توسط کارخانه مشخص شود.
6. **تفسیر KPI «تعداد سفارش‌های ارسالی» در داشبورد ادمین:** به‌صورت پیش‌فرض «تعداد سفارش‌های فعال کل مشتریان» تفسیر شده (بخش ۹.۹.۱).
7. **لیست شهرهای مقصد بار:** فرض شده لیست بسته شهرهای اطراف نی‌ریز/استان فارس کافی است؛ لیست دقیق باید توسط کارخانه تایید شود.
11. **آدرس/تلفن/ایمیل/لوگوی واقعی کارخانه:** در سراسر این سند (صفحه لاگین، لندینگ پیج بخش ۹.۱۰، Footer) به‌جای مقادیر واقعی، Placeholder گذاشته شده چون این اطلاعات هنوز از کارفرما دریافت نشده؛ **قبل از انتشار نهایی حتماً باید جایگزین شود.**
8. **آیا امکان ویرایش/لغو درخواست توسط خودِ ادمین بعد از تایید هم لازم است؟** فعلاً طراحی نشده.
9. **آستانه دقیق «کاربر آنلاین» در Command Center:** فرض شده «فعالیت در ۱۵ دقیقه اخیر» (`lastActivityAt`)؛ قابل تنظیم در `.env`.
10. **آیا Attachment (بخش ۵) در همین فاز باید برای شکایات فعال شود یا واقعاً فقط برای آینده آماده باشد؟** طبق تایید صریح کارفرما (BR-22)، در فاز ۱ **غیرفعال** فرض شده است.

---

**پایان سند PRD.md.**

این سند (PRD.md) کاملاً **محصول‌محور** است. قوانین کدنویسی، معماری، Naming Convention و نحوه اجرای پروژه توسط Claude Code در فایل مجزای **`instruction.md`** آمده است — این دو فایل مکمل یکدیگرند و باید همزمان به Agent داده شوند.
