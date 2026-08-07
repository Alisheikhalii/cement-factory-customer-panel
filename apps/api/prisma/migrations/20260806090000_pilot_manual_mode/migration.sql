-- فاز پایلوت یک‌هفته‌ای (PILOT_MODE.md): ثبت دستی سفارش/تحویل بدون ERP.
-- سه تغییر، هر سه سازگار با دادهٔ موجود (بدون نیاز به Backfill دستی).

-- CreateEnum
-- منشأ ایجاد سفارش: MANUAL (ثبت دستی ادمین در پایلوت) یا ERP_SYNC (همگام‌سازی کارخانه).
CREATE TYPE "OrderSource" AS ENUM ('MANUAL', 'ERP_SYNC');

-- AlterTable
-- ردیف‌های موجود ERP_SYNC می‌شوند؛ فقط سفارش‌های پایلوت MANUAL خواهند بود
-- (در «خروج از پایلوت» بایگانی می‌شوند، نه حذف).
ALTER TABLE "Order" ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'ERP_SYNC';

-- CreateIndex
CREATE INDEX "Order_source_idx" ON "Order"("source");

-- AlterTable
-- موبایل راننده: Nullable چون ERP ممکن است این فیلد را ارسال نکند.
ALTER TABLE "Delivery" ADD COLUMN     "driverMobile" TEXT;

-- AlterTable
-- فیلدهای مالی تحویل Nullable می‌شوند: در ثبت دستی، ادمین قیمت را در اختیار ندارد
-- (BR-18: پورتال قیمت‌گذاری نمی‌کند) و باید null بماند نه صفر — صفر یعنی «رایگان»
-- و جمع ستون‌ها را خراب می‌کند. `deductions` عمداً NOT NULL می‌ماند: نداشتن کسورات
-- واقعاً یعنی صفر، نه نامعلوم.
ALTER TABLE "Delivery" ALTER COLUMN "basePrice" DROP NOT NULL,
                       ALTER COLUMN "baseAmount" DROP NOT NULL,
                       ALTER COLUMN "vatAmount" DROP NOT NULL,
                       ALTER COLUMN "amountWithFactors" DROP NOT NULL;
