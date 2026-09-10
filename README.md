# پورتال الکترونیک مشتریان سیمان خاکستری نی‌ریز

Monorepo پورتال B2B مشتریان کارخانه سیمان خاکستری نی‌ریز شامل پورتال مشتریان، داشبورد ادمین و لندینگ پیج عمومی.

مشخصات کامل در [`docs/PRD.md`](docs/PRD.md) و قوانین کدنویسی در [`docs/instruction.md`](docs/instruction.md).

## ساختار

```
cement-portal/
├── apps/
│   ├── web/    # Next.js 14 (App Router, RTL/fa)
│   └── api/    # NestJS + Prisma + PostgreSQL
├── packages/
│   ├── shared-types/    # Type/Enum/ErrorCode مشترک Front/Back
│   └── eslint-config/   # پیکربندی ESLint مشترک
├── docker-compose.yml
└── .env.example
```

## Stack

Next.js 14 · NestJS · Prisma · PostgreSQL · Redis · TypeScript (strict) · Tailwind · TanStack Query · shadcn/ui

## راه‌اندازی توسعه

```bash
# ۱. نصب وابستگی‌ها (نیازمند pnpm 9+ و Node 20+)
pnpm install

# ۲. کپی و تنظیم env
cp .env.example .env

# ۳. اجرای کامل با Docker (postgres, redis, backend, frontend)
docker compose up --build

# --- یا اجرای محلی ---
# دیتابیس/ردیس با داکر
docker compose up -d postgres redis
# Migration + Seed
pnpm db:migrate
pnpm db:seed
# اجرای هر دو اپ
pnpm dev
```

- Frontend: http://localhost:3000
- Backend + Swagger: http://localhost:3001/api
- Health check: http://localhost:3001/api/v1/health

## نقشه راه (بخش ۱۵ PRD)

پروژه فاز‌به‌فاز پیش می‌رود؛ هر فاز پیش از شروع فاز بعد تست و تایید می‌شود.

- **فاز ۰ — زیرساخت** ✅ (این فاز): Monorepo، Docker، Prisma Schema کامل، MockErpAdapter، کاتالوگ خطا، GlobalExceptionFilter، ESLint/Prettier
- فاز ۱ — احراز هویت (CUSTOMER با کد ملی + ADMIN)
- فاز ۲ — ماژول‌های Read Only + SmartTable + Seed کامل
- فاز ۳ — هسته اعلام بار (State Machine + BR-04..BR-11)
- فاز ۴ / ۴.۵ — نظرسنجی و شکایات / داشبورد ادمین
- فاز ۵ / ۵.۵ — بازطراحی بصری داشبورد / لندینگ پیج عمومی
- فاز ۶ / ۷ — یکپارچه‌سازی ERP / سخت‌سازی و Production

## قوانین کلیدی کد (instruction.md)

- `strict: true` و **ممنوعیت مطلق `any`**
- جداسازی Controller / Service / Repository؛ هرگز `PrismaClient` مستقیم در Service
- ERP فقط از طریق `ERP_ADAPTER_TOKEN` تزریق می‌شود
- خطاها فقط از `error-codes.ts` مرکزی (بخش ۱۶)
- هر Service جدید همراه `*.spec.ts`

  لینک ویدیو دموی محصول
  https://drive.google.com/file/d/1gm5RSJa_0ahe-7kcbjXCu7lvQeDr8-ry/view?usp=sharing
