import { PrismaClient } from '@prisma/client';

/**
 * پاک‌سازی دادهٔ مِیک/Seed از یک دیتابیس واقعی (مثلاً `cement_db_pilot`).
 *
 * چرا این اسکریپت لازم است: تا پیش از commit 82b44fb، اجرای Seed پیش‌فرض دادهٔ دموی
 * بخش ۱۹.۱ را می‌ساخت (۱۰۰ مشتری، ۲۵۰ سفارش، ۳۳۱ اعلام‌بار، …). آن پرچم اکنون
 * پیش‌فرض خاموش است و دیگر داده‌ای اضافه نمی‌شود، ولی داده‌ای که *قبلاً* ساخته شده
 * هنوز در دیتابیس‌های موجود هست و در کارتابل و پنل مشتری دیده می‌شود. این اسکریپت
 * فقط همان رکوردها را حذف می‌کند.
 *
 * ⚠️ سه قید ایمنی که هیچ‌وقت نباید شل شوند:
 *  ۱. پیش‌فرض **Dry-Run** است. بدون `CONFIRM_DELETE_MOCK_DATA=true` هیچ نوشتنی روی
 *     دیتابیس انجام نمی‌شود — فقط شمارش و نمونه چاپ می‌شود.
 *  ۲. هیچ `deleteMany({})`ی وجود ندارد. مجموعهٔ شناسه‌ها اول در حافظه ساخته و چاپ
 *     می‌شود، بعد حذف **دقیقاً روی همان شناسه‌ها** (`where: { id: { in } }`) اجرا
 *     می‌شود؛ پس آنچه در Dry-Run دیده‌اید همان چیزی است که حذف می‌شود.
 *  ۳. هر ردیفی که «اثبات‌پذیر Seed» نباشد نگه داشته می‌شود. اگر یک مشتری Seed یک
 *     وابستهٔ غیر-Seed داشته باشد (مثلاً سفارشی که ادمین دستی برایش ثبت کرده)، آن
 *     مشتری **حذف نمی‌شود** و در گزارش زیر عنوان «نگه‌داشته‌شده» می‌آید.
 *
 * چرا از `seed.ts` چیزی import نمی‌شود: آن فایل در سطح ماژول `main()` را صدا می‌زند،
 * پس هر importی Seed را اجرا می‌کرد. ثابت‌ها و توابع خالص لازم عیناً کپی شده‌اند و
 * منبعشان در کامنت هر بخش ذکر شده است.
 *
 * اجرا:
 *   pnpm --filter @cement/api db:cleanup-mock                     # Dry-Run
 *   CONFIRM_DELETE_MOCK_DATA=true pnpm --filter @cement/api db:cleanup-mock
 */

const prisma = new PrismaClient();

/** فقط رشتهٔ دقیق `true` نوشتن را مجاز می‌کند — همان قرارداد `SEED_MOCK_DATA`. */
const CONFIRM_DELETE = (process.env.CONFIRM_DELETE_MOCK_DATA ?? '').trim().toLowerCase() === 'true';

/** حجم دستهٔ `id: { in: [...] }` — کمتر از سقف پارامترهای Postgres. */
const CHUNK = 500;

function chunk<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

// ==================== پیشوندهای قطعیِ شناسه (از seed.ts) ====================
/**
 * Seed برای این چهار مدل شناسهٔ قطعی می‌سازد، پس خودِ `id` مدرک است:
 *   Order            → `seed_ord_00001`   (makeOrder)
 *   LoadingRequest   → `seed_lr_00001`    (makeLr)
 *   Delivery         → `seed_del_00001`   (seedDeliveries)
 *   FinancialTransaction → `seed_fin_000001` (seedFinance)
 *
 * بقیهٔ مدل‌ها با cuid ساخته می‌شوند و باید از راه «رابطه» یا «مقدار قطعی فیلد»
 * اثبات شوند — پایین‌تر.
 */
const ORDER_ID_PREFIX = 'seed_ord_';
const LR_ID_PREFIX = 'seed_lr_';
const DELIVERY_ID_PREFIX = 'seed_del_';
const FINANCE_ID_PREFIX = 'seed_fin_';

// ==================== مقادیر قطعیِ متنی (عیناً از seed.ts) ====================
/** `seedSurveys` — عنوان‌های ثابت + توضیح یکسان برای همهٔ ۶ نظرسنجی. */
const SEED_SURVEY_TITLES = [
  'رضایت از فرآیند بارگیری',
  'کیفیت محصولات',
  'عملکرد واحد فروش',
  'سهولت کار با سامانه',
  'رضایت کلی سال گذشته',
  'نظرسنجی خدمات پشتیبانی',
];
const SEED_SURVEY_DESCRIPTION = 'لطفاً نظر خود را در مورد موارد زیر اعلام فرمایید.';

/** `seedComplaints` — شرح شکایت برای همهٔ ۸۰ رکورد یک رشتهٔ ثابت است. */
const SEED_COMPLAINT_DESCRIPTION = 'شرح کامل موضوع شکایت مشتری جهت پیگیری واحد مربوطه.';

/** `seedNotificationsAndReceipts` — دو الگوی ثابت: Broadcast و مشتری‌محور. */
const SEED_NOTIFICATION_BROADCAST_TITLE = 'اطلاعیه عمومی';
const SEED_NOTIFICATION_BROADCAST_BODY_PREFIX = 'اطلاعیه شماره ';
const SEED_NOTIFICATION_CUSTOMER_BODY = 'جزئیات رویداد مرتبط با حساب شما.';

/** فیش واریزی Seed همیشه یکی از این دو پیشوند مسیر را دارد. */
const SEED_RECEIPT_URL_PREFIXES = [
  'pending-storage://receipts/demo/',
  'pending-storage://receipts/seed/',
];

/** `seedExtraAdmins` — ادمین‌های دمو. ادمین اصلی `admin` هرگز حذف نمی‌شود. */
const SEED_EXTRA_ADMIN_USERNAMES = ['admin2', 'admin3'];

// ==================== هویت قطعیِ ۱۰۰ مشتری Seed ====================
/**
 * `seedCustomers` نام/آدرس/اعتبار را با PRNG می‌سازد (غیرقابل بازتولید مطمئن)، ولی
 * این چهار فیلد **فرمولی** هستند و به PRNG وابسته نیستند:
 *   customerCode  → `TEST-0001` برای i=0، وگرنه `CUS-0001`…`CUS-0099`
 *   erpCustomerId → `ERP-` + customerCode
 *   nationalId    → `0013542419` برای i=0، وگرنه `nationalIdFor(i + 5)`
 *   mobile        → `09120000000` برای i=0، وگرنه `0912` + آخرین ۷ رقم (1000000 + i)
 *
 * تطبیق باید روی **هر چهار** برقرار باشد تا یک مشتری «Seed» شمرده شود.
 *
 * ⚠️ چرا `erpCustomerId` مهم‌ترین بند است: مسیر ساخت مشتری از پنل ادمین
 * (`admin-customer.repository.ts` → `createWithUser`) این فیلد را ست نمی‌کند و
 * `null` می‌ماند. پس حتی اگر ادمین دستی مشتری‌ای با کد `CUS-0007` بسازد، در این
 * مجموعه نمی‌افتد.
 */
const TEST_CUSTOMER_NATIONAL_ID = '0013542419';
const SEED_CUSTOMER_COUNT = 100;

/** کپی عینی از `nationalIdFor` در seed.ts — تابعی خالص با چک‌سام کد ملی. */
function nationalIdFor(idx: number): string {
  const base = 100000000 + idx * 137;
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

interface SeedCustomerIdentity {
  customerCode: string;
  erpCustomerId: string;
  nationalId: string;
  mobile: string;
}

/** جدول هویتِ مورد انتظار، کلید = `customerCode`. خالص و قابل تست بدون دیتابیس. */
export function expectedSeedCustomerIdentities(): Map<string, SeedCustomerIdentity> {
  const map = new Map<string, SeedCustomerIdentity>();
  for (let i = 0; i < SEED_CUSTOMER_COUNT; i += 1) {
    const isTest = i === 0;
    const customerCode = isTest ? 'TEST-0001' : `CUS-${String(i).padStart(4, '0')}`;
    map.set(customerCode, {
      customerCode,
      erpCustomerId: `ERP-${customerCode}`,
      nationalId: isTest ? TEST_CUSTOMER_NATIONAL_ID : nationalIdFor(i + 5),
      mobile: isTest ? '09120000000' : `0912${String(1000000 + i).slice(-7)}`,
    });
  }
  return map;
}

// ==================== ساختار گزارش ====================
interface ModelPlan {
  /** نام مدل در گزارش. */
  model: string;
  /** قاعدهٔ اثبات — همان چیزی که در Dry-Run چاپ می‌شود. */
  rule: string;
  ids: string[];
  /** نمونه‌های خوانا (شمارهٔ سند/درخواست/کد مشتری) برای بازبینی چشمی. */
  samples: string[];
  /**
   * ردیف‌هایی که خودشان پیشوند Seed ندارند و فقط به‌خاطر رابطه (و قید FK) در این
   * مجموعه‌اند. جدا گزارش می‌شود تا قبل از تایید دیده شود.
   */
  cascadeNote?: string;
}

interface Blocker {
  model: string;
  count: number;
  customerIds: string[];
  samples: string[];
  reason: string;
}

async function fetchChunked<T>(ids: string[], fn: (batch: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (const batch of chunk(ids)) {
    out.push(...(await fn(batch)));
  }
  return out;
}

function samplesOf(labels: string[], take = 5): string[] {
  return labels.slice(0, take);
}

// ==================== مرحلهٔ شناسایی ====================
/**
 * همهٔ مجموعه‌ها **قبل از** هر حذفی ساخته می‌شوند و همان‌ها هم چاپ و هم حذف می‌شوند.
 * پس Dry-Run و اجرای واقعی دقیقاً روی یک مجموعه کار می‌کنند.
 */
async function collect(): Promise<{ plans: ModelPlan[]; blockers: Blocker[]; heldBack: string[] }> {
  // --- ۱) مشتریان Seed: تطبیق هر چهار فیلد فرمولی ---
  const expected = expectedSeedCustomerIdentities();
  const candidates = await prisma.customer.findMany({
    where: { customerCode: { in: [...expected.keys()] } },
    select: {
      id: true,
      customerCode: true,
      erpCustomerId: true,
      nationalId: true,
      mobile: true,
      name: true,
    },
  });
  const mockCustomers: typeof candidates = [];
  const nearMiss: typeof candidates = [];
  for (const c of candidates) {
    const want = expected.get(c.customerCode);
    const matches =
      want !== undefined &&
      c.erpCustomerId === want.erpCustomerId &&
      c.nationalId === want.nationalId &&
      c.mobile === want.mobile;
    if (matches) {
      mockCustomers.push(c);
    } else {
      nearMiss.push(c);
    }
  }
  const mockCustomerIds = mockCustomers.map((c) => c.id);
  if (nearMiss.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `\n⚠️  ${nearMiss.length} مشتری کدِ شبیه‌Seed دارد ولی هر چهار فیلد منطبق نیست — ` +
        `نگه داشته می‌شود: ${samplesOf(nearMiss.map((c) => `${c.customerCode}/${c.name}`)).join('، ')}`,
    );
  }

  // --- ۲) سفارش و اعلام‌بار و تحویل ---
  const mockOrders = await prisma.order.findMany({
    where: { id: { startsWith: ORDER_ID_PREFIX } },
    select: { id: true, orderNumber: true },
  });

  /**
   * قاعدهٔ اعلام‌بار دو شرطی است و شرط دومش حیاتی است: بعضی اعلام‌بارها cuid دارند
   * (از پنل مشتری ثبت شده‌اند) ولی روی یک **سفارش Seed** نشسته‌اند — مثل
   * LR-000336 با orderId=seed_ord_00218. اگر فقط پیشوند id را نگاه می‌کردیم، هم در
   * پنل باقی می‌ماندند و هم حذف سفارش والد با خطای FK شکست می‌خورد.
   */
  const mockLrs = await prisma.loadingRequest.findMany({
    where: {
      OR: [{ id: { startsWith: LR_ID_PREFIX } }, { orderId: { startsWith: ORDER_ID_PREFIX } }],
    },
    select: { id: true, requestNumber: true, orderId: true },
  });
  const mockLrIds = mockLrs.map((lr) => lr.id);
  const lrByRelationOnly = mockLrs.filter((lr) => !lr.id.startsWith(LR_ID_PREFIX)).length;

  /** تحویل: پیشوند Seed، یا هر تحویلی که به یک اعلام‌بار Seed چسبیده (FK اجباری). */
  const deliveryByPrefix = await prisma.delivery.findMany({
    where: { id: { startsWith: DELIVERY_ID_PREFIX } },
    select: { id: true, weighingNumber: true },
  });
  const deliveryByLr = await fetchChunked(mockLrIds, (batch) =>
    prisma.delivery.findMany({
      where: { loadingRequestId: { in: batch } },
      select: { id: true, weighingNumber: true },
    }),
  );
  const deliveryMap = new Map<string, string>();
  for (const d of [...deliveryByPrefix, ...deliveryByLr]) {
    deliveryMap.set(d.id, d.weighingNumber);
  }
  const deliveryByRelationOnly = [...deliveryMap.keys()].filter(
    (id) => !id.startsWith(DELIVERY_ID_PREFIX),
  ).length;

  // --- ۳) مالی / فیش / شکایت ---
  const mockFinance = await prisma.financialTransaction.findMany({
    where: { id: { startsWith: FINANCE_ID_PREFIX } },
    select: { id: true, docNumber: true },
  });
  const mockReceipts = await prisma.paymentReceipt.findMany({
    where: {
      customerId: { in: mockCustomerIds },
      OR: SEED_RECEIPT_URL_PREFIXES.map((p) => ({ fileUrl: { startsWith: p } })),
    },
    select: { id: true, fileUrl: true },
  });
  const mockComplaints = await prisma.complaint.findMany({
    where: { customerId: { in: mockCustomerIds }, description: SEED_COMPLAINT_DESCRIPTION },
    select: { id: true, subject: true },
  });

  // --- ۴) نظرسنجی: از والد به فرزند شناسایی، از فرزند به والد حذف ---
  const mockSurveys = await prisma.survey.findMany({
    where: { title: { in: SEED_SURVEY_TITLES }, description: SEED_SURVEY_DESCRIPTION },
    select: { id: true, title: true },
  });
  const mockSurveyIds = mockSurveys.map((s) => s.id);
  const mockQuestions = await fetchChunked(mockSurveyIds, (batch) =>
    prisma.surveyQuestion.findMany({
      where: { surveyId: { in: batch } },
      select: { id: true, text: true },
    }),
  );
  const mockOptions = await fetchChunked(
    mockQuestions.map((q) => q.id),
    (batch) =>
      prisma.surveyOption.findMany({
        where: { questionId: { in: batch } },
        select: { id: true, text: true },
      }),
  );
  const mockAnswers = await fetchChunked(mockSurveyIds, (batch) =>
    prisma.surveyAnswer.findMany({
      where: { surveyId: { in: batch } },
      select: { id: true, customerId: true },
    }),
  );
  const mockDetails = await fetchChunked(
    mockAnswers.map((a) => a.id),
    (batch) =>
      prisma.surveyAnswerDetail.findMany({
        where: { surveyAnswerId: { in: batch } },
        select: { id: true },
      }),
  );

  // --- ۵) اعلان: دو الگوی ثابت Seed ---
  /**
   * ⚠️ اعلان‌های مشتریِ Seed باید صریحاً حذف شوند، نه اینکه به FK سپرده شوند:
   * `Notification.customerId` اختیاری است، پس رفتار FK اینجا `SetNull` است و حذف
   * مشتری این اعلان‌ها را بی‌صدا به «اطلاعیهٔ عمومی برای همه» تبدیل می‌کرد.
   */
  const mockNotifications = await prisma.notification.findMany({
    where: {
      OR: [
        {
          customerId: null,
          title: SEED_NOTIFICATION_BROADCAST_TITLE,
          body: { startsWith: SEED_NOTIFICATION_BROADCAST_BODY_PREFIX },
        },
        { customerId: { in: mockCustomerIds }, body: SEED_NOTIFICATION_CUSTOMER_BODY },
      ],
    },
    select: { id: true, title: true },
  });

  // --- ۶) وابسته‌های غیر-Seed روی مشتریان Seed («مانع») ---
  /**
   * اگر یک مشتری Seed ردیفی داشته باشد که اثبات‌پذیر Seed نیست (مثلاً سفارشی که
   * ادمین در حالت پایلوت دستی ثبت کرده)، دو راه داریم: یا آن ردیف را هم حذف کنیم
   * (نقض «هر چه اثبات نشد، بماند») یا مشتری را نگه داریم. راه دوم انتخاب شده و
   * صریحاً گزارش می‌شود؛ ردیف‌های اثبات‌پذیرِ همان مشتری همچنان حذف می‌شوند.
   */
  const mockLrIdSet = new Set(mockLrIds);
  const mockReceiptIdSet = new Set(mockReceipts.map((r) => r.id));
  const mockComplaintIdSet = new Set(mockComplaints.map((c) => c.id));
  const mockAnswerIdSet = new Set(mockAnswers.map((a) => a.id));
  const mockNotificationIdSet = new Set(mockNotifications.map((n) => n.id));

  const [depOrders, depLrs, depFinance, depReceipts, depComplaints, depAnswers, depNotifications] =
    await Promise.all([
      prisma.order.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, orderNumber: true, customerId: true },
      }),
      prisma.loadingRequest.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, requestNumber: true, customerId: true },
      }),
      prisma.financialTransaction.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, docNumber: true, customerId: true },
      }),
      prisma.paymentReceipt.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, fileUrl: true, customerId: true },
      }),
      prisma.complaint.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, subject: true, customerId: true },
      }),
      prisma.surveyAnswer.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, customerId: true },
      }),
      prisma.notification.findMany({
        where: { customerId: { in: mockCustomerIds } },
        select: { id: true, title: true, customerId: true },
      }),
    ]);

  const blockers: Blocker[] = [];
  function addBlocker<T extends { id: string; customerId: string | null }>(
    model: string,
    rows: T[],
    label: (row: T) => string,
    reason: string,
  ): void {
    if (rows.length === 0) return;
    blockers.push({
      model,
      count: rows.length,
      customerIds: [
        ...new Set(rows.map((r) => r.customerId).filter((v): v is string => v !== null)),
      ],
      samples: samplesOf(rows.map(label)),
      reason,
    });
  }

  addBlocker(
    'Order',
    depOrders.filter((o) => !o.id.startsWith(ORDER_ID_PREFIX)),
    (o) => o.orderNumber,
    'سفارشِ غیر-Seed روی مشتری Seed (احتمالاً ثبت دستی ادمین) — FK از نوع RESTRICT',
  );
  addBlocker(
    'LoadingRequest',
    depLrs.filter((lr) => !mockLrIdSet.has(lr.id)),
    (lr) => lr.requestNumber,
    'اعلام‌بارِ غیر-Seed روی مشتری Seed — FK از نوع RESTRICT',
  );
  addBlocker(
    'FinancialTransaction',
    depFinance.filter((f) => !f.id.startsWith(FINANCE_ID_PREFIX)),
    (f) => f.docNumber,
    'تراکنش مالیِ غیر-Seed روی مشتری Seed — FK از نوع RESTRICT',
  );
  addBlocker(
    'PaymentReceipt',
    depReceipts.filter((r) => !mockReceiptIdSet.has(r.id)),
    (r) => r.fileUrl,
    'فیش واریزیِ آپلودشدهٔ واقعی روی مشتری Seed — FK از نوع RESTRICT',
  );
  addBlocker(
    'Complaint',
    depComplaints.filter((c) => !mockComplaintIdSet.has(c.id)),
    (c) => c.subject,
    'شکایتِ واقعی روی مشتری Seed — FK از نوع RESTRICT',
  );
  addBlocker(
    'SurveyAnswer',
    depAnswers.filter((a) => !mockAnswerIdSet.has(a.id)),
    (a) => a.id,
    'پاسخ نظرسنجی به یک نظرسنجیِ غیر-Seed — FK از نوع RESTRICT',
  );
  addBlocker(
    'Notification',
    depNotifications.filter((n) => !mockNotificationIdSet.has(n.id)),
    (n) => n.title,
    'اعلانِ واقعی روی مشتری Seed — FK از نوع SetNull، پس حذف مشتری آن را به اطلاعیهٔ عمومی تبدیل می‌کرد',
  );

  const heldBack = [...new Set(blockers.flatMap((b) => b.customerIds))];
  const heldBackSet = new Set(heldBack);
  const deletableCustomers = mockCustomers.filter((c) => !heldBackSet.has(c.id));

  /** کاربرِ مشتریانِ نگه‌داشته‌شده باید بماند، وگرنه مشتری بدون امکان ورود می‌ماند. */
  const mockUsers = await prisma.user.findMany({
    where: {
      OR: [
        { customerId: { in: deletableCustomers.map((c) => c.id) } },
        { username: { in: SEED_EXTRA_ADMIN_USERNAMES }, role: 'ADMIN', customerId: null },
      ],
    },
    select: { id: true, username: true },
  });

  /**
   * ترتیب این آرایه **همان ترتیب حذف** است: فرزند پیش از والد.
   * تغییر ترتیب یعنی خطای Foreign Key، پس جابه‌جا کردن ردیف‌ها بی‌خطر نیست.
   */
  const plans: ModelPlan[] = [
    {
      model: 'SurveyAnswerDetail',
      rule: 'surveyAnswerId ∈ پاسخ‌های نظرسنجی‌های Seed',
      ids: mockDetails.map((d) => d.id),
      samples: samplesOf(mockDetails.map((d) => d.id)),
    },
    {
      model: 'SurveyAnswer',
      rule: 'surveyId ∈ نظرسنجی‌های Seed',
      ids: mockAnswers.map((a) => a.id),
      samples: samplesOf(mockAnswers.map((a) => a.id)),
    },
    {
      model: 'SurveyOption',
      rule: 'questionId ∈ سوالات نظرسنجی‌های Seed',
      ids: mockOptions.map((o) => o.id),
      samples: samplesOf(mockOptions.map((o) => o.text)),
    },
    {
      model: 'SurveyQuestion',
      rule: 'surveyId ∈ نظرسنجی‌های Seed',
      ids: mockQuestions.map((q) => q.id),
      samples: samplesOf(mockQuestions.map((q) => q.text)),
    },
    {
      model: 'Survey',
      rule: `title ∈ ${SEED_SURVEY_TITLES.length} عنوان ثابت Seed  و  description = رشتهٔ ثابت Seed`,
      ids: mockSurveyIds,
      samples: samplesOf(mockSurveys.map((s) => s.title)),
    },
    {
      model: 'Delivery',
      rule: `id LIKE '${DELIVERY_ID_PREFIX}%'  یا  loadingRequestId ∈ اعلام‌بارهای Seed`,
      ids: [...deliveryMap.keys()],
      samples: samplesOf([...deliveryMap.values()]),
      ...(deliveryByRelationOnly > 0
        ? {
            cascadeNote:
              `${deliveryByRelationOnly} تحویل پیشوند Seed ندارد و فقط چون به یک اعلام‌بار Seed ` +
              'چسبیده حذف می‌شود (قید FK اجباری است).',
          }
        : {}),
    },
    {
      model: 'LoadingRequest',
      rule: `id LIKE '${LR_ID_PREFIX}%'  یا  orderId LIKE '${ORDER_ID_PREFIX}%'`,
      ids: mockLrIds,
      samples: samplesOf(mockLrs.map((lr) => lr.requestNumber)),
      ...(lrByRelationOnly > 0
        ? {
            cascadeNote:
              `${lrByRelationOnly} اعلام‌بار شناسهٔ cuid دارد (از پنل ثبت شده) ولی روی سفارش Seed ` +
              'نشسته — طبق قاعدهٔ مورد تایید، داده مِیک شمرده می‌شود.',
          }
        : {}),
    },
    {
      model: 'Order',
      rule: `id LIKE '${ORDER_ID_PREFIX}%'`,
      ids: mockOrders.map((o) => o.id),
      samples: samplesOf(mockOrders.map((o) => o.orderNumber)),
    },
    {
      model: 'FinancialTransaction',
      rule: `id LIKE '${FINANCE_ID_PREFIX}%'`,
      ids: mockFinance.map((f) => f.id),
      samples: samplesOf(mockFinance.map((f) => f.docNumber)),
    },
    {
      model: 'PaymentReceipt',
      rule: 'customerId ∈ مشتریان Seed  و  fileUrl با مسیر demo/seed شروع می‌شود',
      ids: mockReceipts.map((r) => r.id),
      samples: samplesOf(mockReceipts.map((r) => r.fileUrl)),
    },
    {
      model: 'Complaint',
      rule: 'customerId ∈ مشتریان Seed  و  description = رشتهٔ ثابت Seed',
      ids: mockComplaints.map((c) => c.id),
      samples: samplesOf(mockComplaints.map((c) => c.subject)),
    },
    {
      model: 'Notification',
      rule: 'الگوی Broadcast Seed، یا customerId ∈ مشتریان Seed با body ثابت Seed',
      ids: mockNotifications.map((n) => n.id),
      samples: samplesOf(mockNotifications.map((n) => n.title)),
    },
    {
      model: 'User',
      rule: `customerId ∈ مشتریان قابل‌حذف Seed، یا username ∈ [${SEED_EXTRA_ADMIN_USERNAMES.join(', ')}]`,
      ids: mockUsers.map((u) => u.id),
      samples: samplesOf(mockUsers.map((u) => u.username)),
    },
    {
      model: 'Customer',
      rule: 'تطبیق کامل customerCode + erpCustomerId + nationalId + mobile با فرمول Seed',
      ids: deletableCustomers.map((c) => c.id),
      samples: samplesOf(deletableCustomers.map((c) => `${c.customerCode} (${c.name})`)),
    },
  ];

  return { plans, blockers, heldBack };
}

// ==================== گزارش ====================
/** آدرس دیتابیس بدون نام‌کاربری/رمز — برای اینکه اپراتور بداند روی چه چیزی اجرا می‌کند. */
function describeTarget(): string {
  const raw = process.env.DATABASE_URL ?? '';
  if (raw === '') return '(DATABASE_URL تنظیم نشده)';
  try {
    const u = new URL(raw);
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(DATABASE_URL غیرقابل تجزیه)';
  }
}

function log(line = ''): void {
  // eslint-disable-next-line no-console
  console.log(line);
}

function printReport(plans: ModelPlan[], blockers: Blocker[], heldBack: string[]): number {
  const total = plans.reduce((sum, p) => sum + p.ids.length, 0);

  log();
  log('══════════ برنامهٔ حذف دادهٔ Seed ══════════');
  log(`دیتابیس هدف: ${describeTarget()}`);
  log(
    `حالت: ${CONFIRM_DELETE ? '⚠️  حذف واقعی (CONFIRM_DELETE_MOCK_DATA=true)' : 'Dry-Run (بدون نوشتن)'}`,
  );
  log();

  for (const plan of plans) {
    if (plan.ids.length === 0) {
      log(`  ${plan.model.padEnd(22)} 0`);
      continue;
    }
    log(`  ${plan.model.padEnd(22)} ${plan.ids.length}`);
    log(`      قاعده : ${plan.rule}`);
    log(
      `      نمونه : ${plan.samples.join('، ')}${plan.ids.length > plan.samples.length ? ' …' : ''}`,
    );
    log(`      شناسه : ${plan.ids.slice(0, 3).join('، ')}${plan.ids.length > 3 ? ' …' : ''}`);
    if (plan.cascadeNote !== undefined) {
      log(`      توجه  : ${plan.cascadeNote}`);
    }
  }

  log();
  log(`جمع ردیف‌های نامزد حذف: ${total}`);

  log();
  log(
    'دست‌نخورده می‌مانند: Product، Carrier، AuditLog، ErpSyncLog، Attachment، ادمین اصلی (admin)',
  );
  log('و هر مشتری/سفارش/اعلام‌بارِ واقعی که با قواعد بالا اثبات نشود.');

  if (blockers.length > 0) {
    log();
    log('──────── مانع‌ها: مشتریان Seed که حذف نمی‌شوند ────────');
    log(`${heldBack.length} مشتری Seed وابستهٔ غیر-Seed دارد و نگه داشته می‌شود.`);
    log('(ردیف‌های اثبات‌پذیرِ همین مشتریان همچنان حذف می‌شوند.)');
    for (const b of blockers) {
      log(`  • ${b.model}: ${b.count} ردیف — ${b.reason}`);
      log(`      نمونه: ${b.samples.join('، ')}`);
    }
  }

  return total;
}

// ==================== اجرای حذف ====================
/**
 * حذف در یک تراکنش، به همان ترتیبِ `plans` (فرزند → والد).
 *
 * حذف فقط با `id: { in: [...] }` انجام می‌شود؛ یعنی هیچ Predicateی دوباره روی
 * دیتابیس ارزیابی نمی‌شود و دقیقاً همان ردیف‌هایی می‌روند که در گزارش دیده‌اید.
 * اگر بین گزارش و اجرا کسی ردیف وابستهٔ جدیدی ساخته باشد، خطای FK کل تراکنش را
 * برمی‌گرداند و دیتابیس دست‌نخورده می‌ماند.
 */
async function executeDeletes(plans: ModelPlan[]): Promise<Map<string, number>> {
  const deleted = new Map<string, number>();

  await prisma.$transaction(
    async (tx) => {
      const byModel: Record<string, (ids: string[]) => Promise<{ count: number }>> = {
        SurveyAnswerDetail: (ids) =>
          tx.surveyAnswerDetail.deleteMany({ where: { id: { in: ids } } }),
        SurveyAnswer: (ids) => tx.surveyAnswer.deleteMany({ where: { id: { in: ids } } }),
        SurveyOption: (ids) => tx.surveyOption.deleteMany({ where: { id: { in: ids } } }),
        SurveyQuestion: (ids) => tx.surveyQuestion.deleteMany({ where: { id: { in: ids } } }),
        Survey: (ids) => tx.survey.deleteMany({ where: { id: { in: ids } } }),
        Delivery: (ids) => tx.delivery.deleteMany({ where: { id: { in: ids } } }),
        LoadingRequest: (ids) => tx.loadingRequest.deleteMany({ where: { id: { in: ids } } }),
        Order: (ids) => tx.order.deleteMany({ where: { id: { in: ids } } }),
        FinancialTransaction: (ids) =>
          tx.financialTransaction.deleteMany({ where: { id: { in: ids } } }),
        PaymentReceipt: (ids) => tx.paymentReceipt.deleteMany({ where: { id: { in: ids } } }),
        Complaint: (ids) => tx.complaint.deleteMany({ where: { id: { in: ids } } }),
        Notification: (ids) => tx.notification.deleteMany({ where: { id: { in: ids } } }),
        User: (ids) => tx.user.deleteMany({ where: { id: { in: ids } } }),
        Customer: (ids) => tx.customer.deleteMany({ where: { id: { in: ids } } }),
      };

      for (const plan of plans) {
        if (plan.ids.length === 0) continue;
        const run = byModel[plan.model];
        if (run === undefined) {
          throw new Error(`مدل ناشناخته در برنامهٔ حذف: ${plan.model}`);
        }
        let count = 0;
        for (const batch of chunk(plan.ids)) {
          const res = await run(batch);
          count += res.count;
        }
        deleted.set(plan.model, count);
        log(`  حذف شد: ${plan.model.padEnd(22)} ${count} / ${plan.ids.length}`);
      }
    },
    { maxWait: 20_000, timeout: 300_000 },
  );

  return deleted;
}

// ==================== نقطهٔ ورود ====================
async function main(): Promise<void> {
  if ((process.env.DATABASE_URL ?? '').trim() === '') {
    throw new Error('DATABASE_URL تنظیم نشده است — اسکریپت اجرا نمی‌شود.');
  }

  const { plans, blockers, heldBack } = await collect();
  const total = printReport(plans, blockers, heldBack);

  if (!CONFIRM_DELETE) {
    log();
    log('هیچ تغییری روی دیتابیس انجام نشد (Dry-Run).');
    if (total > 0) {
      log('برای حذف واقعیِ همین ردیف‌ها:');
      log('  CONFIRM_DELETE_MOCK_DATA=true pnpm --filter @cement/api db:cleanup-mock');
      log('⚠️  پیش از اجرا از دیتابیس pg_dump بگیرید؛ این حذف برگشت‌پذیر نیست.');
    }
    return;
  }

  if (total === 0) {
    log();
    log('چیزی برای حذف پیدا نشد — دیتابیس از دادهٔ Seed پاک است.');
    return;
  }

  log();
  log('──────── اجرای حذف در یک تراکنش ────────');
  const deleted = await executeDeletes(plans);
  const sum = [...deleted.values()].reduce((a, b) => a + b, 0);

  log();
  log(`تمام شد: ${sum} ردیف حذف شد.`);
  if (heldBack.length > 0) {
    log(`${heldBack.length} مشتری Seed به‌دلیل وابستهٔ غیر-Seed نگه داشته شد (بالا گزارش شد).`);
  }
  log('Product / Carrier / AuditLog / ادمین اصلی دست‌نخورده‌اند.');
}

/**
 * فقط وقتی اجرا می‌شود که این فایل مستقیم صدا زده شود.
 *
 * ⚠️ عمدی: این نگهبان اجازه می‌دهد توابع خالص (مثل `expectedSeedCustomerIdentities`)
 * در تست import شوند بدون اینکه حذفی روی دیتابیس اجرا شود — همان اشتباهی که
 * `seed.ts` مرتکب می‌شود و به‌همین‌دلیل از آن importی نداریم.
 */
if (require.main === module) {
  main()
    .catch((e: unknown) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
