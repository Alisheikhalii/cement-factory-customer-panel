import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LoadType, VehicleType } from '@cement/shared-types';
import type {
  AdminManualOrderRow,
  CreateCustomerResult,
  DeliveryDto,
  DeliverySumRow,
  LoadingRequestDto,
  SelectableOrderDto,
} from '@cement/shared-types';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * تست E2E جریان کامل «حالت پایلوت» (Task 5).
 *
 * سناریو دقیقاً همان چیزی است که در فاز پایلوت روی دادهٔ واقعی اجرا می‌شود:
 * ادمین مشتری می‌سازد → ادمین سفارش دستی ثبت می‌کند → مشتری اعلام بار می‌دهد →
 * ادمین تایید می‌کند → ادمین تحویل را دستی ثبت می‌کند → مانده سفارش کم می‌شود →
 * جدول تحویل مشتری، موبایل راننده را نشان می‌دهد و ستون‌های مالی `null` هستند.
 *
 * ⚠️ روی دیتابیس واقعی (تست) اجرا می‌شود؛ `DATABASE_URL_TEST` را ست کنید تا
 * دیتابیس توسعه دست‌نخورده بماند. پیش‌نیاز: `prisma migrate deploy` + `prisma db seed`
 * (ادمین `admin` و محصولات از Seed می‌آیند).
 */

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@12345';
const ORDER_TOTAL_QTY = 100;
const REQUESTED_QTY = 30;
const DELIVERED_QTY = 25; // کمتر از مقدار اعلام‌شده، برای آزمودن مسیر «تحویل ناقص»
const DRIVER_MOBILE = '09121234567';
/** مقدار سفارش دوم برای آزمودن «شارژ مجدد مانده» با همان مسیر ثبت دستی. */
const TOP_UP_QTY = 40;
/**
 * رمز جدید مشتری: عدد ساده ۶ رقمی، بدون حرف بزرگ/کوچک و بدون علامت.
 * عمداً همین شکل انتخاب شده تا ثابت کند تنها قید فعال «حداقل ۶ کاراکتر» است.
 */
const PLAIN_NEW_PASSWORD = '123456';

/** پاسخ موفق طبق قالب بخش ۱۱.۱۱. */
interface SuccessBody<T> {
  success: true;
  data: T;
}

/** پاسخ خطا طبق قالب بخش ۱۱.۱۱. */
interface ErrorBody {
  success: false;
  error: { code: string; message: string };
}

/**
 * کد ملی ایرانی معتبر می‌سازد (رقم کنترلی طبق الگوریتم رسمی) تا هر اجرای تست
 * مشتری تازه بسازد و به قید unique نخورد.
 */
function makeNationalId(): string {
  const digits: number[] = [];
  for (let i = 0; i < 9; i += 1) {
    digits.push(Math.floor(Math.random() * 10));
  }
  // کدهای با ارقام کاملاً یکسان نامعتبرند؛ رقم اول را متفاوت می‌کنیم.
  if (new Set(digits).size === 1) {
    digits[0] = ((digits[0] ?? 0) + 1) % 10; // noUncheckedIndexedAccess: ?? 0 safe (digits ∈ 0..9)
  }
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += (digits[i] ?? 0) * (10 - i); // noUncheckedIndexedAccess: ?? 0 safe
  }
  const remainder = sum % 11;
  const check = remainder < 2 ? remainder : 11 - remainder;
  return `${digits.join('')}${check}`;
}

/** اولین عضو آرایه یا خطای صریح — جایگزین `!` تحت noUncheckedIndexedAccess. */
function firstOf<T>(rows: T[], what: string): T {
  const row = rows[0];
  if (row === undefined) {
    throw new Error(`هیچ ${what} برای اجرای تست وجود ندارد (Seed اجرا شده است؟)`);
  }
  return row;
}

/**
 * شماره موبایل ایرانی معتبر می‌سازد.
 * ⚠️ الگوی `fa-IR` در class-validator فقط `09` + رقمی از مجموعهٔ {۰,۱,۲,۳,۹} را
 * می‌پذیرد؛ رقم تصادفی ساده (۰ تا ۹) حدود نیمی از اجراها را با ۴۰۰ رد می‌کرد.
 */
function makeMobile(): string {
  const validPrefixes = [0, 1, 2, 3, 9];
  const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)] ?? 1;
  return `09${prefix}${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
}

describe('جریان کامل حالت پایلوت (E2E)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let productId: string;
  let orderId: string;
  let loadingRequestId: string;

  const nationalId = makeNationalId();
  const mobile = makeMobile();
  const customerCode = `PILOT-${Date.now()}`;
  const weighingNumber = `PW-${Date.now()}`;

  beforeAll(async () => {
    // BR-04: ثبت اعلام بار فقط تا ۱۵:۰۰ به وقت ایران مجاز است. طبق بخش ۱۸ ساعت را
    // Mock می‌کنیم تا تست به ساعت اجرا وابسته نباشد. فقط Date جعل می‌شود؛ تایمرهای
    // واقعی دست‌نخورده می‌مانند تا I/O پریزما و supertest طبیعی کار کند.
    const today = new Date();
    const nineAmIran = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 5, 30, 0),
    );
    jest.useFakeTimers({
      now: nineAmIran,
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
        'performance',
        'hrtime',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
      ],
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // هم‌ارز main.ts: همان Prefix/Pipe/Filter/Interceptor تا پاسخ‌ها واقعی باشند.
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    jest.useRealTimers();
    await app?.close();
  });

  it('۰) ورود ادمین', async () => {
    const res = await http
      .post('/api/v1/admin/login')
      .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
      .expect(200);

    const body = res.body as SuccessBody<{ accessToken: string }>;
    expect(body.success).toBe(true);
    adminToken = body.data.accessToken;
    expect(adminToken).toBeTruthy();
  });

  it('۱) ادمین مشتری جدید می‌سازد و رمز موقت می‌گیرد', async () => {
    const res = await http
      .post('/api/v1/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerCode,
        name: 'مشتری تست پایلوت',
        nationalId,
        mobile,
        creditLimit: 0,
      })
      .expect(201);

    const body = res.body as SuccessBody<CreateCustomerResult>;
    customerId = body.data.customer.id;
    expect(customerId).toBeTruthy();

    // BR-28 (سیاست دائمی): رمز اولیه دقیقاً همان کد ملی است، نه رشتهٔ تصادفی.
    expect(body.data.temporaryPassword).toBe(nationalId);

    // ورود مشتری با کد ملی/کد ملی
    const login = await http
      .post('/api/v1/auth/login')
      .send({ nationalId, password: nationalId })
      .expect(200);
    const loginBody = login.body as SuccessBody<{
      accessToken: string;
      user: { mustResetPassword: boolean };
    }>;
    customerToken = loginBody.data.accessToken;
    expect(customerToken).toBeTruthy();
    // BR-26: تغییر رمز در اولین ورود اجباری است.
    expect(loginBody.data.user.mustResetPassword).toBe(true);
  });

  it('۱.۰) لایهٔ Backend: تا تغییر رمز، هر مسیر دیگری ۴۰۳ با کد AUTH_006 می‌دهد (BR-26)', async () => {
    // ریدایرکت Frontend قابل دور زدن است (کاربر می‌تواند مستقیم API را صدا بزند)،
    // پس MustResetPasswordGuard باید مستقل از UI جلوی مسیرهای دیگر را بگیرد.
    // این تست هم‌زمان ترتیب اجرای Guard ها را اثبات می‌کند: اگر این Guard پیش از
    // JwtAuthGuard اجرا می‌شد، `request.user` خالی بود و بی‌صدا رد می‌شد (۲۰۰ می‌گرفتیم).
    const blocked = await http
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const body = blocked.body as ErrorBody;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_006');

    // اما خود مسیر تغییر رمز باید باز بماند، وگرنه کاربر در بن‌بست می‌افتد.
    // با رمز فعلی غلط صدا می‌زنیم تا رمز واقعی در این تست تغییر نکند؛ نکتهٔ مهم
    // این است که پاسخ AUTH_006 نیست — یعنی Guard این مسیر را نبسته است.
    const allowed = await http
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ currentPassword: 'wrong-on-purpose', newPassword: 'someNewPass1' });

    expect((allowed.body as ErrorBody).error?.code).not.toBe('AUTH_006');
  });

  it('۱.۱) مشتری رمز خود را تغییر می‌دهد (تأیید MinLength(6) بدون قید پیچیدگی)', async () => {
    // BR-26 + سیاست دائمی: مشتری باید رمز اولیه (کد ملی) را تغییر دهد.
    // این تست ثابت می‌کند رمز جدید فقط باید ۶+ کاراکتر باشد — بدون حرف بزرگ/کوچک و بدون علامت.
    const res = await http
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ currentPassword: nationalId, newPassword: PLAIN_NEW_PASSWORD })
      .expect(200);

    expect((res.body as SuccessBody<{ changed: true }>).data.changed).toBe(true);

    // ورود مجدد با رمز جدید (ساده): mustResetPassword اکنون false است.
    const login = await http
      .post('/api/v1/auth/login')
      .send({ nationalId, password: PLAIN_NEW_PASSWORD })
      .expect(200);
    const loginBody = login.body as SuccessBody<{
      accessToken: string;
      user: { mustResetPassword: boolean };
    }>;
    customerToken = loginBody.data.accessToken;
    expect(loginBody.data.user.mustResetPassword).toBe(false);
  });

  it('۲) بخش سفارشات در حالت پایلوت ۴۰۳ با کد FEATURE_DISABLED می‌دهد (Task 1)', async () => {
    const res = await http
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const body = res.body as ErrorBody;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FEATURE_DISABLED');
  });

  it('۳) ادمین سفارش دستی ثبت می‌کند (source=MANUAL)', async () => {
    const products = await http
      .get('/api/v1/admin/manual-orders/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const productRows = (products.body as SuccessBody<{ id: string; name: string }[]>).data;
    expect(productRows.length).toBeGreaterThan(0);
    productId = firstOf(productRows, 'محصول فعالی').id;

    const res = await http
      .post('/api/v1/admin/manual-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId, productId, totalQty: ORDER_TOTAL_QTY })
      .expect(201);

    const order = (res.body as SuccessBody<AdminManualOrderRow>).data;
    orderId = order.id;
    expect(order.orderNumber.startsWith('MO-')).toBe(true);
    expect(order.totalQty).toBe(ORDER_TOTAL_QTY);
    // مانده اولیه = کل مقدار سفارش
    expect(order.remainingQty).toBe(ORDER_TOTAL_QTY);
  });

  it('۳.۱) Dropdown فرم اعلام بار سفارش دستی را می‌بیند، حتی با ORDERS_ENABLED خاموش', async () => {
    // باگ گزارش‌شده: فرم اعلام بار فهرست سفارش‌ها را از `GET /orders` می‌گرفت، ولی آن
    // مسیر در پایلوت با FEATURE_DISABLED بسته است (تست ۲). نتیجه: Dropdown همیشه خالی
    // و مشتری هیچ درخواستی نمی‌توانست ثبت کند. این مسیر جایگزین، پرچم‌دار نیست.
    const res = await http
      .get('/api/v1/loading-requests/selectable-orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const rows = (res.body as SuccessBody<SelectableOrderDto[]>).data;
    const row = rows.find((o) => o.id === orderId);

    expect(row).toBeDefined();
    expect(row?.remainingQty).toBe(ORDER_TOTAL_QTY);
    expect(row?.productId).toBe(productId);
    expect(row?.productName).toBeTruthy();

    // BR-18: این مسیر پرچم‌دار نیست، پس نباید هیچ ستون مالی‌ای درز کند.
    expect(row).not.toHaveProperty('basePrice');
    expect(row).not.toHaveProperty('amountWithFactors');

    // Data Scoping (۶.۲): فقط سفارش‌های همین مشتری برمی‌گردند.
    expect(rows.length).toBe(1);
  });

  it('۴) مشتری اعلام بار ثبت می‌کند (فرم مشتری بدون تغییر کار می‌کند)', async () => {
    const res = await http
      .post('/api/v1/loading-requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId,
        productId,
        requestedQty: REQUESTED_QTY,
        vehicleType: VehicleType.TRAILER,
        loadType: LoadType.FIXED,
        destinationCity: 'شیراز',
        recipientMobile: mobile,
      })
      .expect(201);

    const lr = (res.body as SuccessBody<LoadingRequestDto>).data;
    loadingRequestId = lr.id;
    expect(lr.status).toBe('SUBMITTED');
  });

  it('۵) ادمین درخواست را تایید می‌کند (SUBMITTED → APPROVED)', async () => {
    const res = await http
      .patch(`/api/v1/admin/loading-requests/${loadingRequestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect((res.body as SuccessBody<LoadingRequestDto>).data.status).toBe('APPROVED');
  });

  it('۶) ادمین تحویل را دستی ثبت می‌کند (APPROVED → LOADED از طریق State Machine)', async () => {
    const carriers = await http
      .get('/api/v1/admin/loading-requests/carriers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const carrierRows = (carriers.body as SuccessBody<{ id: string; name: string }[]>).data;
    // باربری اختیاری است؛ اگر Seed باربری نداشت، تحویل بدون آن ثبت می‌شود.
    const carrier = carrierRows[0];

    const res = await http
      .post(`/api/v1/admin/loading-requests/${loadingRequestId}/register-delivery`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        weighingNumber,
        deliveryDate: new Date().toISOString(),
        ...(carrier ? { carrierId: carrier.id } : {}),
        vehicleNumber: '۱۲ ع ۳۴۵ ایران ۶۳',
        driverName: 'راننده تست',
        driverMobile: DRIVER_MOBILE,
        deliveredQty: DELIVERED_QTY,
      })
      .expect(200);

    expect((res.body as SuccessBody<LoadingRequestDto>).data.status).toBe('LOADED');
  });

  it('۷) مانده سفارش به اندازه مقدار تحویل‌شده کم می‌شود', async () => {
    const res = await http
      .get(`/api/v1/admin/manual-orders?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const rows = (res.body as SuccessBody<AdminManualOrderRow[]>).data;
    const order = rows.find((r) => r.id === orderId);
    expect(order).toBeDefined();
    expect(order?.remainingQty).toBe(ORDER_TOTAL_QTY - DELIVERED_QTY);
  });

  it('۸) جدول تحویل مشتری: موبایل راننده درست و ستون‌های مالی null هستند', async () => {
    const res = await http
      .get('/api/v1/deliveries')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const data = (res.body as SuccessBody<{ rows: DeliveryDto[]; sumRow: DeliverySumRow }>).data;
    const row = data.rows.find((r) => r.weighingNumber === weighingNumber);

    expect(row).toBeDefined();
    expect(row?.driverMobile).toBe(DRIVER_MOBILE);
    expect(row?.deliveredQty).toBe(DELIVERED_QTY);

    // BR-18: در نبود ERP مبالغ «نامعلوم» هستند، نه صفر.
    expect(row?.basePrice).toBeNull();
    expect(row?.baseAmount).toBeNull();
    expect(row?.vatAmount).toBeNull();
    expect(row?.amountWithFactors).toBeNull();

    // این مشتری تازه‌ساخته فقط همین یک تحویل را دارد، پس همهٔ مقادیر مالیِ بازه
    // null‌اند و ردیف جمع هم باید null بماند (نه 0) تا در UI «—» نشان داده شود.
    expect(data.sumRow.deliveredQty).toBe(DELIVERED_QTY);
    expect(data.sumRow.baseAmount).toBeNull();
    expect(data.sumRow.vatAmount).toBeNull();
    expect(data.sumRow.amountWithFactors).toBeNull();
  });

  it('۹) ادمین مقدار سفارش دستی را اصلاح/افزایش می‌دهد', async () => {
    const increased = ORDER_TOTAL_QTY + 50;
    const res = await http
      .patch(`/api/v1/admin/manual-orders/${orderId}/quantity`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newTotalQty: increased })
      .expect(200);

    const order = (res.body as SuccessBody<AdminManualOrderRow>).data;
    expect(order.totalQty).toBe(increased);
    expect(order.remainingQty).toBe(increased - DELIVERED_QTY);

    // کاهش به کمتر از مقدار تحویل‌شده باید رد شود.
    await http
      .patch(`/api/v1/admin/manual-orders/${orderId}/quantity`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newTotalQty: DELIVERED_QTY - 1 })
      .expect(404);
  });

  it('۱۰) شارژ مجدد: ادمین سفارش جدید ثبت می‌کند، مانده افزایش می‌یابد (نه جایگزین)', async () => {
    // این تست ثابت می‌کند ثبت سفارش دوم یک Order جدید می‌سازد و مانده کل را افزایش می‌دهد.
    // در UI ادمین لیست سفارشات دستی مشتری نمایش داده می‌شود و هر سفارش مانده خود را دارد.
    const beforeRes = await http
      .get(`/api/v1/admin/manual-orders?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const beforeOrders = (beforeRes.body as SuccessBody<AdminManualOrderRow[]>).data;
    const totalRemainingBefore = beforeOrders.reduce((sum, o) => sum + o.remainingQty, 0);

    // ثبت سفارش دوم
    const topUpRes = await http
      .post('/api/v1/admin/manual-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId, productId, totalQty: TOP_UP_QTY })
      .expect(201);

    const newOrder = (topUpRes.body as SuccessBody<AdminManualOrderRow>).data;
    expect(newOrder.id).not.toBe(orderId);
    expect(newOrder.totalQty).toBe(TOP_UP_QTY);
    expect(newOrder.remainingQty).toBe(TOP_UP_QTY);

    // مانده کل = مانده سفارش اول + مانده سفارش دوم
    const afterRes = await http
      .get(`/api/v1/admin/manual-orders?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const afterOrders = (afterRes.body as SuccessBody<AdminManualOrderRow[]>).data;
    const totalRemainingAfter = afterOrders.reduce((sum, o) => sum + o.remainingQty, 0);

    expect(totalRemainingAfter).toBe(totalRemainingBefore + TOP_UP_QTY);
  });

  it('۱۱) بازنشانی رمز توسط ادمین: رمز به کد ملی برمی‌گردد و تغییر مجدداً اجباری می‌شود', async () => {
    const res = await http
      .patch(`/api/v1/admin/customers/${customerId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // سیاست دائمی BR-28: بازنشانی هم به کد ملی برمی‌گردد، نه رشتهٔ تصادفی.
    const body = res.body as SuccessBody<{ temporaryPassword: string }>;
    expect(body.data.temporaryPassword).toBe(nationalId);

    // رمز ساده قبلی دیگر کار نمی‌کند و ورود با کد ملی مجدداً تغییر اجباری می‌خواهد.
    await http
      .post('/api/v1/auth/login')
      .send({ nationalId, password: PLAIN_NEW_PASSWORD })
      .expect(401);

    const login = await http
      .post('/api/v1/auth/login')
      .send({ nationalId, password: nationalId })
      .expect(200);
    const loginBody = login.body as SuccessBody<{ user: { mustResetPassword: boolean } }>;
    expect(loginBody.data.user.mustResetPassword).toBe(true);
  });

  it('۱۲) ورود ادمین از تغییر سیاست رمز مشتری اثر نگرفته است', async () => {
    // سیاست رمز ادمین دست‌نخورده: همان رمز قبلی با حرف بزرگ و علامت هنوز معتبر است.
    const res = await http
      .post('/api/v1/admin/login')
      .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
      .expect(200);

    expect((res.body as SuccessBody<{ accessToken: string }>).data.accessToken).toBeTruthy();
  });

  it('۱۳) حذف نرم مشتری: از فهرست می‌رود، ورودش بسته می‌شود، سوابقش می‌ماند', async () => {
    // ⚠️ آخرین تست است چون مشتری تست را غیرفعال می‌کند.
    // سوابق پیش از حذف شمرده می‌شوند تا بتوان «حذف نشدن» آن‌ها را اثبات کرد.
    const before = await http
      .get(`/api/v1/admin/manual-orders?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const ordersBefore = (before.body as SuccessBody<AdminManualOrderRow[]>).data;
    expect(ordersBefore.length).toBeGreaterThan(0);

    const del = await http
      .delete(`/api/v1/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((del.body as SuccessBody<{ deleted: true }>).data.deleted).toBe(true);

    // ۱) از فهرست ادمین حذف شده است (buildWhere با isDeleted:false مقید است).
    // مرتب‌سازی createdAt نزولی است، پس این مشتریِ تازه‌ساخته اگر حذف نشده بود
    // حتماً در همین صفحهٔ اول دیده می‌شد.
    const list = await http
      .get('/api/v1/admin/customers?page=1&pageSize=100')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const rows = (list.body as SuccessBody<{ id: string }[]>).data;
    expect(rows.find((r) => r.id === customerId)).toBeUndefined();

    // ۱.۱) جستجو هم همین مشتری را برنمی‌گرداند و مهم‌تر: خودِ پارامتر `search`
    // پذیرفته می‌شود. پیش‌تر `search` در هیچ DTOای اعلام نشده بود و
    // `forbidNonWhitelisted` سراسری آن را ۴۰۰ می‌کرد، یعنی جعبهٔ جستجوی صفحهٔ
    // مشتریان اصلاً کار نمی‌کرد.
    const searched = await http
      .get(`/api/v1/admin/customers?page=1&pageSize=100&search=${encodeURIComponent(customerCode)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const searchedRows = (searched.body as SuccessBody<{ id: string }[]>).data;
    expect(searchedRows.find((r) => r.id === customerId)).toBeUndefined();

    // ۲) دیگر نمی‌تواند وارد شود (User غیرفعال + بررسی isDeleted در authenticate).
    await http
      .post('/api/v1/auth/login')
      .send({ nationalId, password: nationalId })
      .expect(401);

    // ۳) حذف نرم است: سفارش/اعلام بار/تحویل تاریخی دست‌نخورده مانده‌اند (بخش ۵.۲).
    const after = await http
      .get(`/api/v1/admin/manual-orders?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const ordersAfter = (after.body as SuccessBody<AdminManualOrderRow[]>).data;
    expect(ordersAfter.length).toBe(ordersBefore.length);
    expect(ordersAfter.find((o) => o.id === orderId)).toBeDefined();

    // اعلام بار و تحویلِ ثبت‌شده هم باید هنوز برای ادمین قابل خواندن باشند
    // (دادهٔ مالی واقعی؛ Cascade Delete نداریم).
    const detail = await http
      .get(`/api/v1/admin/loading-requests/${loadingRequestId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const request = (detail.body as SuccessBody<{ status: string }>).data;
    expect(request.status).toBe('LOADED');

    // ۴) حذف دوباره بی‌اثر است: مشتری دیگر پیدا نمی‌شود (نه بازنویسی deletedAt).
    await http
      .delete(`/api/v1/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(500);
  });
});
