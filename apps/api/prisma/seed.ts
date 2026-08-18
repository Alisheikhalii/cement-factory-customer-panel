import { PrismaClient, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * اسکریپت Seed کامل — بخش ۱۹ PRD.
 *
 * پوشش می‌دهد: ۱۰۰ مشتری (+چند غیرفعال)، ۳ ادمین، محصولات پایه + ۲ محصول آینده،
 * ۲۵۰ سفارش، اعلام‌بارها با هر ۵ وضعیت، تحویل‌های زنجیره‌ای، ۶۰۰ تراکنش مالی در
 * ۴ منبع، ۸۰ شکایت، ۶ نظرسنجی، اعلانات، و فیش‌های واریزی.
 *
 * ⚠️ انحراف مستندشده از حجم بخش ۱۹.۱:
 *  در Schema (بخش ۵.۳) رابطه `Delivery.loadingRequestId` اجباری و `@unique` است؛
 *  بنابراین هیچ Delivery بدون یک LoadingRequest متناظر نمی‌تواند وجود داشته باشد.
 *  عدد «۹۰۰ تحویل» با «۳۰۰ اعلام‌بار» در همان دوره از نظر ساختاری ناسازگار است.
 *  لذا اولویت با قید Schema و صحت رابطه‌ای است: هر LoadingRequest با وضعیت LOADED
 *  دقیقاً یک Delivery می‌گیرد (تعداد تحویل = تعداد اعلام‌بار LOADED). این در گزارش
 *  فاز ۲ صریحاً اعلام شده است.
 *
 * Idempotent: در ابتدای اجرا داده‌های تولیدی قبلی پاک و از نو ساخته می‌شوند
 * (Reset فقط در اسکریپت Seed؛ قانون Soft-Delete مربوط به زمان اجرای برنامه است، نه Seed).
 *
 * ⚠️ از دورهٔ پایلوت به بعد، همهٔ آنچه بالا آمد (به‌همراه خودِ `reset()`) پشت پرچم
 * `SEED_MOCK_DATA=true` است و پیش‌فرض **اجرا نمی‌شود**. اجرای بدون پرچم فقط دادهٔ
 * مرجعِ لازم را به‌شکل Idempotent تضمین می‌کند: محصولات، باربری‌ها، و ادمین اصلی —
 * بدون هیچ حذفی. جزئیات در JSDoc خودِ `SEED_MOCK_DATA` و `main()`.
 *
 * قطعیت (Determinism): از یک PRNG با Seed ثابت استفاده می‌شود تا هر اجرا داده یکسان
 * بسازد و شناسه‌ها پایدار بمانند.
 *
 * ⚠️ رمزهای پیش‌فرض فقط برای توسعه‌اند و باید در استقرار واقعی تغییر کنند.
 */
const prisma = new PrismaClient();

// ==================== PRNG قطعی ====================
let rngState = 987654321;
function rng(): number {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
  return rngState / 0x7fffffff;
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}
function chance(p: number): boolean {
  return rng() < p;
}
function money(n: number): number {
  return Math.round(n);
}

// ==================== داده‌های ثابت فارسی ====================
const FIRST_NAMES = [
  'علی', 'محمد', 'حسین', 'رضا', 'مهدی', 'امیر', 'سعید', 'حسن', 'مجید', 'کاظم',
  'فاطمه', 'زهرا', 'مریم', 'سمیرا', 'نرگس', 'اکرم', 'لیلا', 'الهام', 'سارا', 'نازنین',
];
const LAST_NAMES = [
  'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'احمدی', 'صادقی', 'قاسمی', 'نوری', 'کاظمی',
  'جعفری', 'یوسفی', 'شریفی', 'اکبری', 'رحیمی', 'زارع', 'فرهادی', 'مرادی', 'عباسی', 'سلطانی',
];
const COMPANY_SUFFIX = ['بازرگانی', 'ساختمانی', 'عمران', 'پخش', 'تجارت', 'گروه صنعتی'];
const CITIES = [
  'نی‌ریز', 'شیراز', 'استهبان', 'فسا', 'داراب', 'جهرم', 'آباده', 'مرودشت', 'زرین‌دشت', 'اقلید',
];
const CARRIER_NAMES = [
  'باربری آسیا ترابر', 'حمل و نقل پارس بار', 'باربری زاگرس', 'ترابری فارس',
  'باربری امید', 'حمل و نقل نی‌ریز بار',
];
const OPERATION_TYPES = ['واریز نقدی', 'چک', 'حواله بانکی', 'تسویه فاکتور', 'کارمزد', 'اصلاحیه'];
const BANKS = ['ملت', 'ملی', 'صادرات', 'تجارت', 'سپه', 'پاسارگاد'];
const VEHICLE_TYPES = ['TRAILER', 'FLATBED', 'DUMP', 'TEN_WHEEL'] as const;
const LOAD_TYPES = ['FIXED', 'NON_FIXED'] as const;

const PRODUCTS = [
  { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲ داخلی', type: 'BAGGED' as const },
  { erpCode: '2001240002', name: 'سیمان پاکتی تیپ ۲-۴۲۵ داخلی', type: 'BAGGED' as const },
  { erpCode: '2001240004', name: 'سیمان فله تیپ ۲-۴۲۵ داخلی', type: 'BULK' as const },
  { erpCode: '2001240005', name: 'سیمان فله پوزولانی داخلی', type: 'BULK' as const },
  // ۲ محصول آینده برای تست BR-17 (بخش ۱۹.۱)
  { erpCode: '2001240006', name: 'سیمان پاکتی پوزولانی داخلی', type: 'BAGGED' as const },
  { erpCode: '2001240007', name: 'سیمان فله تیپ ۴۲.۵ داخلی', type: 'BULK' as const },
];

const TEST_CUSTOMER_NATIONAL_ID = '0013542419';
const ADMIN_USERNAME = 'admin';
const DEV_ADMIN_PASSWORD = 'Admin@12345';
const DEV_CUSTOMER_PASSWORD = 'Customer@12345';

/**
 * پرچمِ Seed دادهٔ دمو — پیش‌فرض **خاموش**.
 *
 * چرا: محیط محلی دیگر یک محیط دمو نیست؛ پایلوت با مشتریان واقعیِ ساخته‌شده از پنل
 * ادمین روی همین دیتابیس تست می‌شود. با روشن بودن پیش‌فرضِ قبلی، هر
 * `prisma migrate reset`/`db seed` بی‌صدا ۱۰۰ مشتری و ۲۵۰ سفارش جعلی را برمی‌گرداند
 * و کارتابل واقعی را غیرقابل‌استفاده می‌کرد.
 *
 * با `SEED_MOCK_DATA=true` رفتار قبلی مو‌به‌مو برمی‌گردد (شامل `reset()`)، پس این
 * تغییر کاملاً برگشت‌پذیر است و هیچ منطقِ Seedی حذف نشده است.
 *
 * ⚠️ فقط رشتهٔ دقیق `true` (بی‌توجه به بزرگی/کوچکی حروف) روشن حساب می‌شود؛ مقادیری
 * مثل `1` یا `yes` عمداً روشن نیستند تا روشن‌شدنِ تصادفی سخت‌تر باشد.
 */
const SEED_MOCK_DATA = (process.env.SEED_MOCK_DATA ?? '').trim().toLowerCase() === 'true';

const DAY = 24 * 60 * 60 * 1000;

// ==================== کمکی تاریخ (نسبت به «اکنون») ====================
const NOW = new Date();
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY);
}
function daysFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * DAY);
}

// ==================== کمکی شناسه/کد ملی ====================
function nationalIdFor(idx: number): string {
  const base = 100000000 + idx * 137; // ۹ رقم یکتا
  const d9 = String(base).padStart(9, '0').slice(0, 9);
  const digits = d9.split('').map((c) => Number.parseInt(c, 10));
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += (digits[i] ?? 0) * (10 - i);
  }
  const r = sum % 11;
  const check = r < 2 ? r : 11 - r;
  return d9 + String(check);
}

async function chunkedCreate<T>(
  rows: T[],
  create: (batch: T[]) => Promise<unknown>,
  size = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await create(rows.slice(i, i + size));
  }
}

// ==================== Reset ====================
/**
 * پاک‌سازی کامل — **فقط** در حالت `SEED_MOCK_DATA=true` صدا زده می‌شود.
 *
 * ⚠️ این تابع `user` و `customer` را هم خالی می‌کند، یعنی روی محیط پایلوت مشتریانِ
 * واقعیِ ساخته‌شده از پنل ادمین را از بین می‌برد. به همین دلیل از `main()` بی‌قید
 * فراخوانی نمی‌شود؛ منطق خودش دست‌نخورده مانده تا حالت دمو مو‌به‌مو مثل قبل کار کند.
 */
async function reset(): Promise<void> {
  // ترتیب FK-safe: فرزند → والد
  await prisma.surveyAnswerDetail.deleteMany();
  await prisma.surveyAnswer.deleteMany();
  await prisma.surveyOption.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.loadingRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.carrier.deleteMany();
  await prisma.product.deleteMany();
}

interface SeededProduct {
  id: string;
  erpCode: string;
  name: string;
  type: string;
}
interface SeededCustomer {
  id: string;
  isActive: boolean;
  mobile: string;
  name: string;
}

/**
 * دادهٔ مرجع — **همیشه** اجرا می‌شود، حتی با `SEED_MOCK_DATA` خاموش.
 *
 * محصولات و باربری‌ها جدول مرجع‌اند نه دادهٔ دمو: محصول پایلوت
 * («سیمان پاکتی تیپ ۲-۴۲۵ داخلی»، کد ERP `2001240002`) باید وجود داشته باشد وگرنه
 * Dropdown فرم اعلام بار خالی می‌ماند، و بدون باربری، فرم ثبت دستی تحویل ناقص است.
 *
 * ⚠️ Idempotent است چون بدون پرچم، `reset()` اجرا نمی‌شود و این تابع ممکن است روی
 * دیتابیسی با دادهٔ واقعی چند بار اجرا شود:
 *  - محصول با `upsert` روی `erpCode` (یکتا) و `update: {}` — یعنی رکورد موجود
 *    دست‌نخورده می‌ماند تا تغییرات ادمین (نام/غیرفعال‌سازی) بازنویسی نشود.
 *  - باربری `@unique` ندارد، پس «اگر با این نام نبود بساز» — وگرنه هر اجرا تکراری
 *    می‌ساخت. رکورد Soft-Delete شده هم «موجود» حساب می‌شود تا حذفِ عمدی ادمین
 *    با اجرای بعدی برنگردد.
 */
async function seedProductsAndCarriers(): Promise<{
  products: SeededProduct[];
  carrierIds: string[];
}> {
  for (const p of PRODUCTS) {
    await prisma.product.upsert({ where: { erpCode: p.erpCode }, update: {}, create: p });
  }
  const products = (await prisma.product.findMany()).map((p) => ({
    id: p.id,
    erpCode: p.erpCode,
    name: p.name,
    type: p.type,
  }));

  const carrierIds: string[] = [];
  for (const name of CARRIER_NAMES) {
    const existing = await prisma.carrier.findFirst({ where: { name } });
    const c = existing ?? (await prisma.carrier.create({ data: { name } }));
    carrierIds.push(c.id);
  }
  return { products, carrierIds };
}

/**
 * ادمین اصلی — **همیشه** اجرا می‌شود (Idempotent).
 *
 * بدون این، یک دیتابیس تازه (یا دیتابیسی که دادهٔ دمو از آن پاک شده) هیچ راه ورودی
 * نمی‌داشت و ساختن مشتری از پنل ادمین ممکن نبود.
 *
 * ⚠️ `update: {}` عمدی است: اگر ادمین رمزش را عوض کرده باشد، اجرای Seed نباید آن را
 * به رمز پیش‌فرض توسعه برگرداند.
 */
async function seedPrimaryAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      fullName: 'مدیر فروش (ادمین توسعه)',
      passwordHash,
      role: Role.ADMIN,
      customerId: null,
    },
  });
}

/** ادمین‌های دوم/سوم — فقط دادهٔ دمو (بخش ۱۹.۱)، پس پشت `SEED_MOCK_DATA`. */
async function seedExtraAdmins(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);
  for (const [username, fullName] of [
    ['admin2', 'کارشناس فروش دو'],
    ['admin3', 'کارشناس فروش سه'],
  ]) {
    await prisma.user.upsert({
      where: { username: username as string },
      update: {},
      create: {
        username: username as string,
        fullName: fullName as string,
        passwordHash,
        role: Role.ADMIN,
        customerId: null,
      },
    });
  }
}

async function seedCustomers(): Promise<SeededCustomer[]> {
  const customerPasswordHash = await bcrypt.hash(DEV_CUSTOMER_PASSWORD, 10);
  const result: SeededCustomer[] = [];

  for (let i = 0; i < 100; i += 1) {
    const isTest = i === 0;
    // ~۸٪ غیرفعال (به‌جز مشتری تستی) برای تست فیلتر
    const isActive = isTest ? true : !chance(0.08);
    const personName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const name = isTest
      ? 'مشتری تستی نی‌ریز'
      : chance(0.5)
        ? personName
        : `${pick(COMPANY_SUFFIX)} ${pick(LAST_NAMES)}`;
    const nationalId = isTest ? TEST_CUSTOMER_NATIONAL_ID : nationalIdFor(i + 5);
    const mobile = isTest ? '09120000000' : `0912${String(1000000 + i).slice(-7)}`;
    const customerCode = isTest ? 'TEST-0001' : `CUS-${String(i).padStart(4, '0')}`;
    const creditLimit = money(randInt(500, 5000) * 1_000_000);
    const creditBalance = money(creditLimit * (0.1 + rng() * 0.8));

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        erpCustomerId: `ERP-${customerCode}`,
        nationalId,
        economicCode: String(randInt(10000000000, 99999999999)),
        name,
        address: `${pick(CITIES)} — [آدرس نمونه Placeholder]`,
        postalCode: String(randInt(1000000000, 9999999999)),
        mobile,
        creditLimit,
        creditBalance,
        isActive,
      },
    });

    await prisma.user.create({
      data: {
        username: nationalId,
        fullName: name,
        passwordHash: customerPasswordHash,
        role: Role.CUSTOMER,
        customerId: customer.id,
        isActive,
        // مشتری تستی برای راحتی، بقیه طبق BR-26 باید در ورود اول رمز عوض کنند
        mustResetPassword: isTest ? false : chance(0.3),
        lastActivityAt: isActive && chance(0.4) ? daysAgo(rng() * 0.01) : null,
      },
    });

    result.push({ id: customer.id, isActive, mobile, name });
  }
  return result;
}

// ==================== مدل‌های در حافظه برای سفارش/اعلام‌بار/تحویل ====================
interface OrderMem {
  id: string;
  orderNumber: string;
  customerId: string;
  productId: string;
  orderDate: Date;
  totalQty: number;
  basePrice: number;
  priceWithFactors: number;
  delivered: number; // محاسبه پس از تولید تحویل‌ها
  forceNoLR: boolean;
  forceCompleted: boolean;
}
interface LrMem {
  id: string;
  requestNumber: string;
  orderId: string;
  customerId: string;
  productId: string;
  requestedQty: number;
  vehicleType: string;
  loadType: string;
  requestDate: Date;
  submittedAt: Date;
  destinationCity: string;
  recipientMobile: string;
  carrierId: string | null;
  carrierSetBy: string | null;
  status: string;
  reviewedAt: Date | null;
  reviewedByNote: string | null;
  canceledAt: Date | null;
  loadedAt: Date | null;
  deliveredQty: number; // برای LOADED
}

let orderCounter = 0;
let lrCounter = 0;
let deliveryCounter = 0;

function makeOrder(
  customerId: string,
  product: SeededProduct,
  opts: { completed?: boolean; noLR?: boolean } = {},
): OrderMem {
  orderCounter += 1;
  const totalQty = randInt(50, 1000);
  const basePrice = money(randInt(2000, 4000) * 1000);
  const priceWithFactors = money(basePrice * (1.03 + rng() * 0.08));
  return {
    id: `seed_ord_${String(orderCounter).padStart(5, '0')}`,
    orderNumber: `ORD-${String(orderCounter).padStart(6, '0')}`,
    customerId,
    productId: product.id,
    orderDate: daysAgo(randInt(5, 400)),
    totalQty,
    basePrice,
    priceWithFactors,
    delivered: 0,
    forceNoLR: opts.noLR ?? false,
    forceCompleted: opts.completed ?? false,
  };
}

function makeLr(
  order: OrderMem,
  status: string,
  requestedQty: number,
  carrierIds: string[],
  recipientMobile: string,
): LrMem {
  lrCounter += 1;
  const submittedAt = new Date(order.orderDate.getTime() + randInt(1, 30) * DAY);
  const hasCarrier = chance(0.6);
  const isLoaded = status === 'LOADED';
  const isRejected = status === 'REJECTED';
  const isCanceled = status === 'CANCELED';
  return {
    id: `seed_lr_${String(lrCounter).padStart(5, '0')}`,
    requestNumber: `LR-${String(lrCounter).padStart(6, '0')}`,
    orderId: order.id,
    customerId: order.customerId,
    productId: order.productId,
    requestedQty,
    vehicleType: pick(VEHICLE_TYPES),
    loadType: pick(LOAD_TYPES),
    requestDate: new Date(submittedAt.getTime() + DAY),
    submittedAt,
    destinationCity: pick(CITIES),
    recipientMobile,
    carrierId: hasCarrier ? pick(carrierIds) : null,
    carrierSetBy: hasCarrier ? 'CUSTOMER' : 'FACTORY',
    status,
    reviewedAt:
      status === 'APPROVED' || isLoaded || isRejected
        ? new Date(submittedAt.getTime() + randInt(1, 3) * DAY)
        : null,
    reviewedByNote: isRejected ? 'موجودی/اعتبار کافی نیست — لطفاً پس از تسویه اقدام کنید' : null,
    canceledAt: isCanceled ? new Date(submittedAt.getTime() + randInt(1, 2) * DAY) : null,
    loadedAt: isLoaded ? new Date(submittedAt.getTime() + randInt(2, 5) * DAY) : null,
    deliveredQty: isLoaded ? requestedQty : 0,
  };
}

async function seedOrdersChain(
  customers: SeededCustomer[],
  products: SeededProduct[],
  carrierIds: string[],
): Promise<{ orders: OrderMem[]; lrs: LrMem[] }> {
  const orders: OrderMem[] = [];
  const lrs: LrMem[] = [];
  const testCustomer = customers[0] as SeededCustomer;

  // --- سناریوهای تضمینی روی مشتری تستی (بخش ۱۹.۲) ---
  // ۱) سفارش تکمیل‌شده (remaining=0)
  const completedOrder = makeOrder(testCustomer.id, products[0] as SeededProduct, {
    completed: true,
  });
  orders.push(completedOrder);
  lrs.push(
    makeLr(completedOrder, 'LOADED', completedOrder.totalQty, carrierIds, testCustomer.mobile),
  );

  // ۲) سفارش نیمه‌تحویل + وضعیت‌های متنوع اعلام‌بار
  const halfOrder = makeOrder(testCustomer.id, products[2] as SeededProduct);
  orders.push(halfOrder);
  lrs.push(makeLr(halfOrder, 'LOADED', Math.floor(halfOrder.totalQty * 0.4), carrierIds, testCustomer.mobile));
  lrs.push(makeLr(halfOrder, 'SUBMITTED', randInt(10, 40), carrierIds, testCustomer.mobile));
  lrs.push(makeLr(halfOrder, 'REJECTED', randInt(10, 40), carrierIds, testCustomer.mobile));

  // ۳) سفارش بدون هیچ اعلام‌بار (تست Empty State)
  orders.push(makeOrder(testCustomer.id, products[1] as SeededProduct, { noLR: true }));

  // ۴) سفارش با لغو از SUBMITTED و لغو از APPROVED
  const cancelOrder = makeOrder(testCustomer.id, products[3] as SeededProduct);
  orders.push(cancelOrder);
  const canceledFromSubmitted = makeLr(cancelOrder, 'CANCELED', randInt(10, 30), carrierIds, testCustomer.mobile);
  const canceledFromApproved = makeLr(cancelOrder, 'CANCELED', randInt(10, 30), carrierIds, testCustomer.mobile);
  canceledFromApproved.reviewedAt = new Date(canceledFromApproved.submittedAt.getTime() + DAY);
  lrs.push(canceledFromSubmitted, canceledFromApproved);
  // یک APPROVED باز هم برای تست
  lrs.push(makeLr(cancelOrder, 'APPROVED', randInt(10, 30), carrierIds, testCustomer.mobile));

  // --- بقیه سفارش‌ها تا رسیدن به ۲۵۰ ---
  const statusPool = ['SUBMITTED', 'APPROVED', 'REJECTED', 'LOADED', 'LOADED', 'CANCELED'];
  while (orders.length < 250) {
    // توزیع: مشتریان اول وزن بیشتری دارند (دمو غنی‌تر)
    const cIdx = chance(0.3) ? randInt(0, 9) : randInt(0, customers.length - 1);
    const customer = customers[cIdx] as SeededCustomer;
    const product = pick(products);
    const order = makeOrder(customer.id, product);
    orders.push(order);

    if (chance(0.12)) {
      // ~۱۲٪ سفارش بدون اعلام‌بار
      order.forceNoLR = true;
      continue;
    }
    const lrCount = randInt(0, 3);
    let allocated = 0;
    for (let k = 0; k < lrCount; k += 1) {
      const status = pick(statusPool);
      const remainingRoom = order.totalQty - allocated;
      if (remainingRoom <= 5) {
        break;
      }
      const qty = randInt(5, Math.max(6, Math.floor(remainingRoom * 0.5)));
      const lr = makeLr(order, status, qty, carrierIds, customer.mobile);
      if (status === 'LOADED') {
        allocated += qty;
      }
      lrs.push(lr);
    }
  }

  // --- محاسبه delivered/remaining هر سفارش از تحویل‌های LOADED ---
  const deliveredByOrder = new Map<string, number>();
  for (const lr of lrs) {
    if (lr.status === 'LOADED') {
      deliveredByOrder.set(lr.orderId, (deliveredByOrder.get(lr.orderId) ?? 0) + lr.deliveredQty);
    }
  }
  for (const order of orders) {
    if (order.forceCompleted) {
      order.delivered = order.totalQty;
    } else {
      order.delivered = Math.min(deliveredByOrder.get(order.id) ?? 0, order.totalQty);
    }
  }

  // --- درج سفارش‌ها ---
  const orderRows = orders.map((o) => {
    const remaining = Math.max(o.totalQty - o.delivered, 0);
    const baseAmount = money(o.totalQty * o.basePrice);
    const vatAmount = money(baseAmount * 0.09);
    const amountWithFactors = money(o.totalQty * o.priceWithFactors + vatAmount);
    const deliveredAmount = money(o.delivered * o.priceWithFactors);
    const remainingAmount = Math.max(amountWithFactors - deliveredAmount, 0);
    const status =
      remaining <= 0 ? 'COMPLETED' : o.orderDate < daysAgo(365) && chance(0.1) ? 'EXPIRED' : 'IN_USE';
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      productId: o.productId,
      orderDate: o.orderDate,
      totalQty: o.totalQty,
      deliveredQty: o.delivered,
      remainingQty: remaining,
      basePrice: o.basePrice,
      baseAmount,
      deliveredAmount,
      vatAmount,
      priceWithFactors: o.priceWithFactors,
      amountWithFactors,
      remainingAmount,
      status: status as never,
    };
  });
  await chunkedCreate(orderRows, (batch) =>
    prisma.order.createMany({ data: batch }),
  );

  // --- درج اعلام‌بارها ---
  const lrRows = lrs.map((lr) => ({
    id: lr.id,
    requestNumber: lr.requestNumber,
    orderId: lr.orderId,
    customerId: lr.customerId,
    productId: lr.productId,
    requestedQty: lr.requestedQty,
    vehicleType: lr.vehicleType as never,
    loadType: lr.loadType as never,
    requestDate: lr.requestDate,
    destinationCity: lr.destinationCity,
    recipientMobile: lr.recipientMobile,
    carrierId: lr.carrierId,
    carrierSetBy: (lr.carrierSetBy ?? undefined) as never,
    status: lr.status as never,
    submittedAt: lr.submittedAt,
    reviewedAt: lr.reviewedAt,
    reviewedByNote: lr.reviewedByNote,
    canceledAt: lr.canceledAt,
    loadedAt: lr.loadedAt,
  }));
  await chunkedCreate(lrRows, (batch) =>
    prisma.loadingRequest.createMany({ data: batch }),
  );

  return { orders, lrs };
}

async function seedDeliveries(
  lrs: LrMem[],
  products: SeededProduct[],
  carrierIds: string[],
): Promise<number> {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const rows = lrs
    .filter((lr) => lr.status === 'LOADED')
    .map((lr) => {
      deliveryCounter += 1;
      const qty = lr.deliveredQty;
      const basePrice = money(randInt(2000, 4000) * 1000);
      const baseAmount = money(qty * basePrice);
      const vatAmount = money(baseAmount * 0.09);
      const deductions = chance(0.2) ? money(baseAmount * 0.01) : 0;
      const amountWithFactors = money(baseAmount + vatAmount - deductions);
      return {
        id: `seed_del_${String(deliveryCounter).padStart(5, '0')}`,
        weighingNumber: `W-${String(deliveryCounter).padStart(6, '0')}`,
        loadingRequestId: lr.id,
        deliveryDate: lr.loadedAt ?? new Date(lr.submittedAt.getTime() + 3 * DAY),
        carrierId: lr.carrierId ?? pick(carrierIds),
        vehicleNumber: `${randInt(11, 99)}ع${randInt(100, 999)}-${randInt(11, 99)}`,
        driverName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        productId: lr.productId,
        deliveredQty: qty,
        basePrice,
        baseAmount,
        vatAmount,
        deductions,
        amountWithFactors,
        status: (chance(0.05) ? 'DISPUTED' : 'FINALIZED') as never,
      };
    });
  await chunkedCreate(rows, (batch) => prisma.delivery.createMany({ data: batch }));
  return rows.length;
}

async function seedFinance(customers: SeededCustomer[]): Promise<void> {
  const sources = ['TRANSACTION', 'STATEMENT', 'ASSET_REPORT', 'STATUS_STATEMENT'];
  const rows: Prisma.FinancialTransactionCreateManyInput[] = [];
  const balanceByCustomer = new Map<string, number>();
  let docCounter = 0;

  for (let i = 0; i < 600; i += 1) {
    docCounter += 1;
    // وزن بیشتر به مشتری تستی و ۱۰ مشتری اول
    const cIdx = chance(0.35) ? randInt(0, 9) : randInt(0, customers.length - 1);
    const customer = customers[cIdx] as SeededCustomer;
    const source = i < 4 ? (sources[i] as string) : pick(sources); // تضمین حضور هر ۴ منبع
    const amount = money(randInt(5, 500) * 1_000_000);
    const isDebit = chance(0.5);
    const prevBalance = balanceByCustomer.get(customer.id) ?? 0;
    const newBalance = prevBalance + (isDebit ? -amount : amount);
    balanceByCustomer.set(customer.id, newBalance);

    rows.push({
      id: `seed_fin_${String(docCounter).padStart(6, '0')}`,
      customerId: customer.id,
      docNumber: `DOC-${String(docCounter).padStart(6, '0')}`,
      date: daysAgo(randInt(1, 400)),
      operationType: pick(OPERATION_TYPES),
      bankName: source === 'TRANSACTION' ? pick(BANKS) : null,
      accountNumber: source === 'TRANSACTION' ? String(randInt(1000000000, 9999999999)) : null,
      amount,
      description: chance(0.5) ? 'بابت خرید سیمان' : null,
      dueDate: chance(0.3) ? daysFromNow(randInt(5, 60)) : null,
      debit: source === 'STATUS_STATEMENT' && isDebit ? amount : null,
      credit: source === 'STATUS_STATEMENT' && !isDebit ? amount : null,
      balance: source === 'STATUS_STATEMENT' || source === 'TRANSACTION' ? newBalance : null,
      status: (source as string) === 'ASSET_REPORT' ? 'ثبت‌شده' : chance(0.8) ? 'تسویه' : 'باز',
      source: source as never,
    });
  }
  await chunkedCreate(rows, (batch) =>
    prisma.financialTransaction.createMany({ data: batch }),
  );
}

async function seedComplaints(customers: SeededCustomer[]): Promise<void> {
  const subjects = [
    'تاخیر در بارگیری',
    'مغایرت وزن توزین',
    'کیفیت پاکت',
    'مشکل در صدور فاکتور',
    'برخورد پرسنل باربری',
  ];
  const rows: Prisma.ComplaintCreateManyInput[] = [];
  // تضمین: حداقل یک شکایت پاسخ‌داده و یک باز روی مشتری تستی
  const forced = [
    { status: 'ANSWERED', reply: 'موضوع بررسی و رفع شد. از صبوری شما سپاسگزاریم.' },
    { status: 'PENDING', reply: null as string | null },
  ];
  for (let i = 0; i < 80; i += 1) {
    const customer =
      i < 2 ? (customers[0] as SeededCustomer) : (customers[randInt(0, customers.length - 1)] as SeededCustomer);
    const answered = i < 2 ? forced[i]?.status === 'ANSWERED' : chance(0.6);
    const submittedAt = daysAgo(randInt(1, 200));
    rows.push({
      customerId: customer.id,
      subject: (i < 2 ? subjects[i] : pick(subjects)) ?? pick(subjects),
      description: 'شرح کامل موضوع شکایت مشتری جهت پیگیری واحد مربوطه.',
      submittedAt,
      status: answered ? 'ANSWERED' : 'PENDING',
      reply: answered
        ? (i < 2 ? forced[i]?.reply : 'موضوع بررسی و اقدام لازم انجام شد.')
        : null,
      repliedAt: answered ? new Date(submittedAt.getTime() + randInt(1, 5) * DAY) : null,
    });
  }
  await chunkedCreate(rows, (batch) => prisma.complaint.createMany({ data: batch }));
}

async function seedSurveys(customers: SeededCustomer[]): Promise<void> {
  const titles = [
    'رضایت از فرآیند بارگیری',
    'کیفیت محصولات',
    'عملکرد واحد فروش',
    'سهولت کار با سامانه',
    'رضایت کلی سال گذشته',
    'نظرسنجی خدمات پشتیبانی',
  ];
  const optionTexts = ['خیلی خوب', 'خوب', 'متوسط', 'ضعیف'];

  for (let s = 0; s < 6; s += 1) {
    // نظرسنجی اول PUBLISHED (مشتری تستی هنوز پاسخ نداده)، بقیه CLOSED
    const status = s === 0 ? 'PUBLISHED' : 'CLOSED';
    const survey = await prisma.survey.create({
      data: {
        title: titles[s] as string,
        description: 'لطفاً نظر خود را در مورد موارد زیر اعلام فرمایید.',
        status: status as never,
        startDate: daysAgo(60),
        endDate: status === 'CLOSED' ? daysAgo(randInt(5, 30)) : null,
        publishedAt: daysAgo(60),
        closedAt: status === 'CLOSED' ? daysAgo(randInt(5, 30)) : null,
      },
    });

    const questions: Array<{ id: string; optionIds: string[] }> = [];
    for (let q = 0; q < 3; q += 1) {
      const question = await prisma.surveyQuestion.create({
        data: { surveyId: survey.id, text: `سوال ${q + 1}: ${titles[s]}؟`, order: q },
      });
      const optionIds: string[] = [];
      for (let o = 0; o < optionTexts.length; o += 1) {
        const opt = await prisma.surveyOption.create({
          data: { questionId: question.id, text: optionTexts[o] as string, order: o },
        });
        optionIds.push(opt.id);
      }
      questions.push({ id: question.id, optionIds });
    }

    // پاسخ‌ها: برای CLOSED چند مشتری (شامل تستی) پاسخ می‌دهند؛ برای PUBLISHED،
    // مشتری تستی پاسخ نداده تا فرم پاسخ‌دهی قابل تست باشد.
    const responderIndices = new Set<number>();
    const responderCount = status === 'CLOSED' ? randInt(20, 45) : randInt(5, 15);
    for (let r = 0; r < responderCount; r += 1) {
      responderIndices.add(randInt(status === 'PUBLISHED' ? 1 : 0, customers.length - 1));
    }
    for (const idx of responderIndices) {
      const customer = customers[idx] as SeededCustomer;
      const answer = await prisma.surveyAnswer.create({
        data: { surveyId: survey.id, customerId: customer.id },
      });
      for (const question of questions) {
        await prisma.surveyAnswerDetail.create({
          data: {
            surveyAnswerId: answer.id,
            questionId: question.id,
            selectedOptionId: pick(question.optionIds),
          },
        });
      }
    }
  }
}

async function seedNotificationsAndReceipts(customers: SeededCustomer[]): Promise<void> {
  const testCustomer = customers[0] as SeededCustomer;
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  // Broadcast (customerId=null)
  for (let i = 0; i < 8; i += 1) {
    notifications.push({
      customerId: null,
      title: 'اطلاعیه عمومی',
      body: `اطلاعیه شماره ${i + 1}: تغییرات ساعت کاری واحد بارگیری.`,
      isRead: false,
      createdAt: daysAgo(randInt(1, 40)),
    });
  }
  // مشتری‌محور
  for (let i = 0; i < 40; i += 1) {
    const customer = i < 6 ? testCustomer : (customers[randInt(0, customers.length - 1)] as SeededCustomer);
    notifications.push({
      customerId: customer.id,
      title: pick(['تایید اعلام بار', 'بارگیری انجام شد', 'پاسخ به شکایت', 'نظرسنجی جدید']),
      body: 'جزئیات رویداد مرتبط با حساب شما.',
      isRead: chance(0.4),
      createdAt: daysAgo(randInt(0, 30)),
    });
  }
  await chunkedCreate(notifications, (batch) =>
    prisma.notification.createMany({ data: batch }),
  );

  // فیش واریزی: تضمین PENDING و REVIEWED روی مشتری تستی
  const receipts: Prisma.PaymentReceiptCreateManyInput[] = [
    {
      customerId: testCustomer.id,
      fileUrl: 'pending-storage://receipts/demo/receipt-pending.jpg',
      amount: money(120 * 1_000_000),
      description: 'واریز بابت پیش‌پرداخت سفارش',
      status: 'PENDING' as never,
    },
    {
      customerId: testCustomer.id,
      fileUrl: 'pending-storage://receipts/demo/receipt-reviewed.pdf',
      amount: money(80 * 1_000_000),
      description: 'تسویه فاکتور',
      status: 'REVIEWED' as never,
      reviewedAt: daysAgo(2),
      reviewNote: 'تایید شد',
    },
  ];
  for (let i = 0; i < 20; i += 1) {
    const customer = customers[randInt(0, customers.length - 1)] as SeededCustomer;
    receipts.push({
      customerId: customer.id,
      fileUrl: `pending-storage://receipts/seed/receipt-${i}.jpg`,
      amount: money(randInt(10, 300) * 1_000_000),
      description: chance(0.5) ? 'واریز نقدی' : null,
      status: pick(['PENDING', 'REVIEWED', 'REJECTED']) as never,
    });
  }
  await chunkedCreate(receipts, (batch) =>
    prisma.paymentReceipt.createMany({ data: batch }),
  );
}

/**
 * نقطهٔ ورود Seed — دو حالت دارد و پیش‌فرض حالتِ «فقط دادهٔ مرجع» است.
 *
 * چرا این ترتیب: `reset()` هم پشت پرچم است، چون بدون پرچم ممکن است این اسکریپت روی
 * دیتابیس پایلوت با مشتریانِ واقعیِ ساخته‌شده از پنل ادمین اجرا شود (مثلاً
 * `prisma migrate dev` که Seed را خودکار صدا می‌زند) و آن‌ها را پاک کند.
 *
 * حالت پیش‌فرض (`SEED_MOCK_DATA` خاموش): فقط محصولات/باربری‌ها/ادمین اصلی به‌شکل
 * Idempotent تضمین می‌شوند — بدون هیچ `delete`ی.
 * حالت دمو (`SEED_MOCK_DATA=true`): مو‌به‌مو همان رفتار قبلی، شامل `reset()` و کل
 * دادهٔ انبوه بخش ۱۹.۱.
 */
async function main(): Promise<void> {
  if (!SEED_MOCK_DATA) {
    const { products, carrierIds } = await seedProductsAndCarriers();
    await seedPrimaryAdmin();
    // eslint-disable-next-line no-console
    console.log(
      [
        'Seed در حالت «فقط دادهٔ مرجع» اجرا شد (SEED_MOCK_DATA تنظیم نشده).',
        `  محصولات تضمین‌شده: ${products.length} | باربری: ${carrierIds.length} | ادمین اصلی: ${ADMIN_USERNAME}`,
        '  هیچ دادهٔ تراکنشی‌ای ساخته یا حذف نشد؛ مشتریان واقعی دست‌نخورده‌اند.',
        '',
        'برای بازگرداندن دادهٔ دموی کامل (که ابتدا کل دیتابیس را پاک می‌کند):',
        '  SEED_MOCK_DATA=true pnpm --filter @cement/api prisma db seed',
      ].join('\n'),
    );
    return;
  }

  await reset();
  const { products, carrierIds } = await seedProductsAndCarriers();
  await seedPrimaryAdmin();
  await seedExtraAdmins();
  const customers = await seedCustomers();
  const { lrs } = await seedOrdersChain(customers, products, carrierIds);
  const deliveryCount = await seedDeliveries(lrs, products, carrierIds);
  await seedFinance(customers);
  await seedComplaints(customers);
  await seedSurveys(customers);
  await seedNotificationsAndReceipts(customers);

  // eslint-disable-next-line no-console
  console.log(
    [
      'Seed فاز ۲ در حالت دمو کامل شد (SEED_MOCK_DATA=true — دیتابیس ابتدا پاک شد):',
      `  محصولات: ${products.length} | باربری: ${carrierIds.length}`,
      `  مشتری: ${customers.length} (+۳ ادمین)`,
      `  سفارش: ${orderCounter} | اعلام‌بار: ${lrCounter} | تحویل: ${deliveryCount}`,
      '  مالی: ۶۰۰ | شکایت: ۸۰ | نظرسنجی: ۶ | فیش/اعلان: seeded',
      '',
      `ورود تستی مشتری: کد ملی ${TEST_CUSTOMER_NATIONAL_ID} / ${DEV_CUSTOMER_PASSWORD}`,
      `ورود ادمین: ${ADMIN_USERNAME} / ${DEV_ADMIN_PASSWORD}`,
    ].join('\n'),
  );
}

main()
  .catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
