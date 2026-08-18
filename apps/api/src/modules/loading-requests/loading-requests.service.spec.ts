import { Prisma } from '@prisma/client';
import { FEATURE_FLAGS, LoadingRequestStatus, VehicleType, LoadType } from '@cement/shared-types';
import type { CreateLoadingRequestInput } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { LoadingRequestService } from './loading-requests.service';
import { LoadingRequestStateMachine } from './loading-request.state-machine';

/**
 * تست واحد سرویس اعلام بار — تمرکز روی BR-04 (مهلت) و BR-05 (موجودی) و BR-24.
 * همه Dependencyها Mock می‌شوند؛ ساعت از طریق پارامتر `now` تزریق می‌شود.
 */

type RepoMock = {
  [K in keyof LoadingRequestRepoShape]: jest.Mock;
};
interface LoadingRequestRepoShape {
  findOrderForValidation: unknown;
  sumActiveRequestedQty: unknown;
  createWithSequentialNumber: unknown;
  findCustomerName: unknown;
}

const VALID_INPUT: CreateLoadingRequestInput = {
  orderId: 'order-1',
  productId: 'prod-1',
  requestedQty: 20,
  vehicleType: VehicleType.TRAILER,
  loadType: LoadType.FIXED,
  destinationCity: 'شیراز',
  recipientMobile: '09121234567',
};

// لحظه‌ای قبل از ۱۵:۰۰ ایران (۱۰:۰۰ صبح) → داخل پنجره مجاز BR-04.
function beforeCutoff(): Date {
  return new Date(Date.UTC(2025, 5, 10, 10, 0) - (3 * 60 + 30) * 60 * 1000);
}
// لحظه‌ای بعد از ۱۵:۰۰ ایران (۱۸:۰۰).
function afterCutoff(): Date {
  return new Date(Date.UTC(2025, 5, 10, 18, 0) - (3 * 60 + 30) * 60 * 1000);
}

function makeOrder(overrides: Partial<{ totalQty: number; status: string; productId: string }> = {}) {
  return {
    id: 'order-1',
    customerId: 'cust-1',
    productId: overrides.productId ?? 'prod-1',
    totalQty: new Prisma.Decimal(overrides.totalQty ?? 100),
    status: overrides.status ?? 'IN_USE',
  };
}

describe('LoadingRequestService.create — BR-04/05/06/24', () => {
  let repo: RepoMock;
  let notifications: { emitLoadingRequest: jest.Mock };
  let flags: { isEnabled: jest.Mock };
  let service: LoadingRequestService;

  beforeEach(() => {
    repo = {
      findOrderForValidation: jest.fn(),
      sumActiveRequestedQty: jest.fn(),
      createWithSequentialNumber: jest.fn(),
      findCustomerName: jest.fn().mockResolvedValue({ name: 'شرکت آزمون' }),
    };
    notifications = { emitLoadingRequest: jest.fn().mockResolvedValue(undefined) };
    // پیش‌فرض تست: رفتار PRD — مهلت BR-04 اعمال می‌شود و «انتخاب محصول» پایلوت خاموش است.
    // ⚠️ یک مقدار یکسان برای همهٔ پرچم‌ها درست نیست: با روشن بودن PILOT_PRODUCT_SELECTION
    // قید موجودی BR-05 عمداً اجرا نمی‌شود (سرویس، شرط `!productSelection`)، پس تست‌های
    // LOAD_001/LOAD_005 تا انتهای create می‌رفتند و روی Mockِ ثبت‌نشده می‌شکستند.
    flags = {
      isEnabled: jest.fn((flag: string) => flag === FEATURE_FLAGS.REQUEST_CUTOFF_ENFORCED),
    };
    service = new LoadingRequestService(
      repo as never,
      {} as never,
      new LoadingRequestStateMachine(),
      notifications as never,
      flags as never,
    );
  });

  function stubValidChain(): void {
    repo.findOrderForValidation.mockResolvedValue(makeOrder());
    repo.sumActiveRequestedQty.mockResolvedValue(new Prisma.Decimal(0));
    repo.createWithSequentialNumber.mockResolvedValue({
      id: 'lr-1',
      requestNumber: 'LR-000123',
      submittedAt: new Date(),
      requestDate: new Date(),
      productId: 'prod-1',
      product: { name: 'سیمان تیپ ۲' },
      carrier: null,
      requestedQty: new Prisma.Decimal(20),
      status: LoadingRequestStatus.SUBMITTED,
      reviewedByNote: null,
      delivery: null,
    });
  }

  it('BR-24: موبایل خالی → LOAD_006', async () => {
    await expect(
      service.create('cust-1', { ...VALID_INPUT, recipientMobile: '  ' }, beforeCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_006' });
    expect(repo.findOrderForValidation).not.toHaveBeenCalled();
  });

  it('BR-04: بعد از ۱۵:۰۰ → LOAD_002', async () => {
    await expect(
      service.create('cust-1', VALID_INPUT, afterCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_002' });
  });

  it('پایلوت: با پرچم خاموش، بعد از ۱۵:۰۰ هم ثبت می‌شود (بقیه BRها برجا)', async () => {
    // فقط قید ساعت برداشته می‌شود؛ تاریخ درخواستی همچنان Backend-ست («فردا») است.
    flags.isEnabled.mockReturnValue(false);
    stubValidChain();

    const dto = await service.create('cust-1', VALID_INPUT, afterCutoff());

    expect(dto.status).toBe(LoadingRequestStatus.SUBMITTED);
    const createArg = repo.createWithSequentialNumber.mock.calls[0][0] as { requestDate: Date };
    expect(createArg.requestDate).toBeInstanceOf(Date);
  });

  it('پایلوت: خاموشی پرچم مهلت، اعتبارسنجی موبایل را باز نمی‌کند (BR-24)', async () => {
    flags.isEnabled.mockReturnValue(false);
    await expect(
      service.create('cust-1', { ...VALID_INPUT, recipientMobile: '  ' }, afterCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_006' });
  });

  it('پایلوت: خاموشی پرچم مهلت، سقف مانده را باز نمی‌کند (BR-05)', async () => {
    flags.isEnabled.mockReturnValue(false);
    repo.findOrderForValidation.mockResolvedValue(makeOrder({ totalQty: 100 }));
    repo.sumActiveRequestedQty.mockResolvedValue(new Prisma.Decimal(90)); // مانده = ۱۰
    await expect(
      service.create('cust-1', { ...VALID_INPUT, requestedQty: 20 }, afterCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_001' });
  });

  it('BR-06: سفارش یافت نشد → ORDER_001', async () => {
    repo.findOrderForValidation.mockResolvedValue(null);
    await expect(
      service.create('cust-1', VALID_INPUT, beforeCutoff()),
    ).rejects.toMatchObject({ code: 'ORDER_001' });
  });

  it('BR-05: مقدار درخواستی > مانده → LOAD_001', async () => {
    repo.findOrderForValidation.mockResolvedValue(makeOrder({ totalQty: 100 }));
    repo.sumActiveRequestedQty.mockResolvedValue(new Prisma.Decimal(90)); // مانده = 10
    await expect(
      service.create('cust-1', { ...VALID_INPUT, requestedQty: 20 }, beforeCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_001' });
  });

  it('BR-05: مانده صفر → LOAD_005', async () => {
    repo.findOrderForValidation.mockResolvedValue(makeOrder({ totalQty: 100 }));
    repo.sumActiveRequestedQty.mockResolvedValue(new Prisma.Decimal(100)); // مانده = 0
    await expect(
      service.create('cust-1', VALID_INPUT, beforeCutoff()),
    ).rejects.toMatchObject({ code: 'LOAD_005' });
  });

  it('مسیر موفق: ثبت SUBMITTED + اعلان به ادمین', async () => {
    stubValidChain();
    const dto = await service.create('cust-1', VALID_INPUT, beforeCutoff());
    expect(dto.status).toBe(LoadingRequestStatus.SUBMITTED);
    expect(repo.createWithSequentialNumber).toHaveBeenCalledTimes(1);
    // تاریخ درخواستی توسط Backend ست شده، نه ورودی کاربر.
    const createArg = repo.createWithSequentialNumber.mock.calls[0][0] as {
      requestDate: Date;
      customerId: string;
    };
    expect(createArg.customerId).toBe('cust-1');
    expect(createArg.requestDate).toBeInstanceOf(Date);
    expect(notifications.emitLoadingRequest).toHaveBeenCalledTimes(1);
  });

  it('مانده دقیقاً برابر درخواستی → مجاز (مرز BR-05)', async () => {
    repo.findOrderForValidation.mockResolvedValue(makeOrder({ totalQty: 100 }));
    repo.sumActiveRequestedQty.mockResolvedValue(new Prisma.Decimal(80)); // مانده = 20
    repo.createWithSequentialNumber.mockResolvedValue({
      id: 'lr-1',
      requestNumber: 'LR-000123',
      submittedAt: new Date(),
      requestDate: new Date(),
      productId: 'prod-1',
      product: { name: 'سیمان' },
      carrier: null,
      requestedQty: new Prisma.Decimal(20),
      status: LoadingRequestStatus.SUBMITTED,
      reviewedByNote: null,
      delivery: null,
    });
    await expect(
      service.create('cust-1', { ...VALID_INPUT, requestedQty: 20 }, beforeCutoff()),
    ).resolves.toBeDefined();
  });
});

/**
 * تست واحد `markLoaded` — مسیر «ثبت تحویل دستی» (Task 3 پایلوت) در برابر مسیر ERP.
 *
 * هدف اصلی این بلوک اثباتِ همان قید معماری است که در JSDoc خودِ متد آمده:
 * فرم ادمین **مسیر کد جدیدی نمی‌سازد** — همان `assertTransition`، همان
 * `markLoadedWithDelivery`، همان اعلان. تنها تفاوت، مبدأ دادهٔ توزین و `null` بودن
 * مبالغ است (BR-18). پس اگر روزی کسی مسیر موازی بسازد، این تست‌ها می‌شکنند.
 */
describe('LoadingRequestService.markLoaded — ثبت دستی در برابر ERP', () => {
  const MANUAL = {
    weighingNumber: 'PW-555',
    deliveryDate: '2026-08-06T08:30:00.000Z',
    carrierId: 'carrier-9',
    vehicleNumber: '۱۲ ع ۳۴۵ ایران ۶۳',
    driverName: 'راننده تست',
    driverMobile: '09121234567',
    deliveredQty: 25,
  };

  let repo: {
    findByIdWithContext: jest.Mock;
    nextWeighingNumber: jest.Mock;
    markLoadedWithDelivery: jest.Mock;
  };
  let notifications: { emitLoadingRequest: jest.Mock };
  let service: LoadingRequestService;

  /** رکوردِ `findByIdWithContext` — همان شکلی که مخزن برمی‌گرداند. */
  function contextRow(
    overrides: Partial<{ status: string; requestedQty: number; basePrice: unknown }> = {},
  ) {
    return {
      id: 'lr-1',
      requestNumber: 'LR-000123',
      submittedAt: new Date('2026-08-05T06:00:00.000Z'),
      requestDate: new Date('2026-08-06T06:00:00.000Z'),
      productId: 'prod-1',
      orderId: 'order-1',
      carrierId: null,
      requestedQty: new Prisma.Decimal(overrides.requestedQty ?? 30),
      status: overrides.status ?? LoadingRequestStatus.APPROVED,
      reviewedByNote: null,
      product: { name: 'سیمان تیپ ۲' },
      carrier: null,
      delivery: null,
      customer: { id: 'cust-1', name: 'شرکت آزمون' },
      order: {
        basePrice:
          'basePrice' in overrides ? overrides.basePrice : new Prisma.Decimal(1_000_000),
      },
    };
  }

  /** رکوردِ خروجیِ تراکنش — باید `LoadingRequestWithRelations` را ارضا کند. */
  function loadedRow(deliveredQty: number) {
    return {
      ...contextRow(),
      status: LoadingRequestStatus.LOADED,
      delivery: { id: 'del-1', deliveredQty: new Prisma.Decimal(deliveredQty) },
    };
  }

  beforeEach(() => {
    repo = {
      findByIdWithContext: jest.fn().mockResolvedValue(contextRow()),
      nextWeighingNumber: jest.fn().mockResolvedValue('W-000042'),
      markLoadedWithDelivery: jest.fn().mockResolvedValue(loadedRow(25)),
    };
    notifications = { emitLoadingRequest: jest.fn().mockResolvedValue(undefined) };
    service = new LoadingRequestService(
      repo as never,
      {} as never,
      new LoadingRequestStateMachine(),
      notifications as never,
      { isEnabled: jest.fn().mockReturnValue(true) } as never,
    );
  });

  /** آرگومان‌های تراکنش: (id, loadedAt, delivery, orderReconcile). */
  function deliveryArg() {
    return repo.markLoadedWithDelivery.mock.calls[0][2] as Record<string, unknown>;
  }
  function reconcileArg() {
    return repo.markLoadedWithDelivery.mock.calls[0][3] as Record<string, unknown>;
  }

  it('BR-18: در حالت دستی هر چهار فیلد مالی null می‌مانند — نه صفر', async () => {
    const dto = await service.markLoaded('lr-1', MANUAL);

    const delivery = deliveryArg();
    // صفر یعنی «رایگان» و جمع ستون‌ها را خراب می‌کند؛ null یعنی «نامعلوم».
    expect(delivery.basePrice).toBeNull();
    expect(delivery.baseAmount).toBeNull();
    expect(delivery.vatAmount).toBeNull();
    expect(delivery.amountWithFactors).toBeNull();

    // مبلغ سفارش نباید افزایش یابد، ولی مقدار تحویل باید ثبت شود.
    const reconcile = reconcileArg();
    expect((reconcile.deliveredAmount as Prisma.Decimal).toNumber()).toBe(0);
    expect((reconcile.deliveredQty as Prisma.Decimal).toNumber()).toBe(MANUAL.deliveredQty);
    expect(reconcile.orderId).toBe('order-1');

    expect(dto.status).toBe(LoadingRequestStatus.LOADED);
  });

  it('دادهٔ فرم ادمین عیناً به Delivery می‌رود (از جمله موبایل راننده)', async () => {
    await service.markLoaded('lr-1', MANUAL);

    const delivery = deliveryArg();
    expect(delivery.driverMobile).toBe(MANUAL.driverMobile);
    expect(delivery.driverName).toBe(MANUAL.driverName);
    expect(delivery.vehicleNumber).toBe(MANUAL.vehicleNumber);
    expect(delivery.carrierId).toBe(MANUAL.carrierId);
    expect(delivery.weighingNumber).toBe(MANUAL.weighingNumber);
    expect(delivery.deliveryDate).toEqual(new Date(MANUAL.deliveryDate));
    // شمارهٔ توزین از فرم آمده، پس نباید شمارهٔ خودکار تولید شود.
    expect(repo.nextWeighingNumber).not.toHaveBeenCalled();

    // همان اعلانِ مسیر موجود — نه یک اعلان اختصاصیِ پایلوت.
    expect(notifications.emitLoadingRequest).toHaveBeenCalledTimes(1);
  });

  it('State Machine مسیر دستی را هم گیت می‌کند: SUBMITTED → LOADED رد می‌شود (LOAD_004)', async () => {
    repo.findByIdWithContext.mockResolvedValue(
      contextRow({ status: LoadingRequestStatus.SUBMITTED }),
    );

    await expect(service.markLoaded('lr-1', MANUAL)).rejects.toMatchObject({
      code: 'LOAD_004',
    });
    // مهم‌تر از خودِ خطا: هیچ نوشتنی رخ نداده باشد.
    expect(repo.markLoadedWithDelivery).not.toHaveBeenCalled();
    expect(notifications.emitLoadingRequest).not.toHaveBeenCalled();
  });

  it('BR-05/BR-25: مقدار تحویل بیشتر از مقدار اعلام‌شده → LOAD_001', async () => {
    repo.findByIdWithContext.mockResolvedValue(contextRow({ requestedQty: 20 }));

    await expect(
      service.markLoaded('lr-1', { ...MANUAL, deliveredQty: 21 }),
    ).rejects.toMatchObject({ code: 'LOAD_001' });
    expect(repo.markLoadedWithDelivery).not.toHaveBeenCalled();
  });

  it('برگشت‌پذیری: بدون پارامتر manual (مسیر ERP) رفتار قبلی دست‌نخورده است', async () => {
    repo.markLoadedWithDelivery.mockResolvedValue(loadedRow(30));

    await service.markLoaded('lr-1');

    const delivery = deliveryArg();
    // قیمت پایه از سفارش می‌آید و مبالغ محاسبه می‌شوند — نه null.
    // ⚠️ مقادیر انتظار عمداً عددِ ثابت‌اند، نه حاصل‌ضرب: سرویس با Prisma.Decimal
    // (اعشاری دقیق) حساب می‌کند و `30_000_000 * 1.09` در حساب شناور جاوااسکریپت
    // ممکن است 32700000.000000004 شود و تست را بی‌دلیل بشکند.
    expect((delivery.basePrice as Prisma.Decimal).toNumber()).toBe(1_000_000);
    expect((delivery.baseAmount as Prisma.Decimal).toNumber()).toBe(30_000_000);
    expect((delivery.vatAmount as Prisma.Decimal).toNumber()).toBe(2_700_000); // ۹٪
    expect((delivery.amountWithFactors as Prisma.Decimal).toNumber()).toBe(32_700_000);
    // مقدار تحویل = کل مقدار اعلام‌شده و شمارهٔ توزین خودکار تولید می‌شود.
    expect((delivery.deliveredQty as Prisma.Decimal).toNumber()).toBe(30);
    expect(delivery.weighingNumber).toBe('W-000042');
    expect(repo.nextWeighingNumber).toHaveBeenCalledTimes(1);
    // فیلدهای مخصوص فرم ادمین در این مسیر خالی‌اند.
    expect(delivery.driverMobile).toBeNull();
  });

  it('درخواست ناموجود → ORDER_001 (پیش از هر تغییر وضعیت)', async () => {
    repo.findByIdWithContext.mockResolvedValue(null);

    await expect(service.markLoaded('missing', MANUAL)).rejects.toBeInstanceOf(AppException);
    await expect(service.markLoaded('missing', MANUAL)).rejects.toMatchObject({
      code: 'ORDER_001',
    });
    expect(repo.markLoadedWithDelivery).not.toHaveBeenCalled();
  });
});

/**
 * تست واحد `bulkApprove` — تایید گروهی کارتابل ادمین.
 *
 * قید معماری همان قید `markLoaded` است: عملیات گروهی **مسیر کد موازی نمی‌سازد**؛
 * برای هر شناسه دقیقاً همان `approve()` تک‌رکوردی اجرا می‌شود (همان State Machine،
 * همان `reviewedAt`/`reviewedBy`، همان Notification). تست‌های زیر همین را می‌بندند،
 * به‌علاوهٔ رفتار «یک ردیفِ نامعتبر کل دسته را شکست نمی‌دهد».
 */
describe('LoadingRequestService.bulkApprove — تایید گروهی کارتابل', () => {
  const ADMIN_ID = 'admin-1';

  let repo: { findByIdWithContext: jest.Mock; update: jest.Mock };
  let notifications: { emitLoadingRequest: jest.Mock };
  let service: LoadingRequestService;

  /** یک ردیف اعلام بار با وضعیت دلخواه (همان شکلی که مخزن برمی‌گرداند). */
  function row(id: string, status: string) {
    return {
      id,
      requestNumber: `LR-${id}`,
      submittedAt: new Date('2026-08-05T06:00:00.000Z'),
      requestDate: new Date('2026-08-06T06:00:00.000Z'),
      productId: 'prod-1',
      orderId: 'order-1',
      carrierId: null,
      requestedQty: new Prisma.Decimal(20),
      status,
      reviewedByNote: null,
      product: { name: 'سیمان تیپ ۲' },
      carrier: null,
      delivery: null,
      customer: { id: 'cust-1', name: 'شرکت آزمون' },
      order: { basePrice: new Prisma.Decimal(1_000_000) },
    };
  }

  /** وضعیت هر شناسه در این تست؛ هر شناسهٔ نیامده «ناموجود» است. */
  function stubStatuses(statuses: Record<string, string>): void {
    repo.findByIdWithContext.mockImplementation((id: string) => {
      const status = statuses[id];
      return Promise.resolve(status === undefined ? null : row(id, status));
    });
  }

  beforeEach(() => {
    repo = {
      findByIdWithContext: jest.fn(),
      update: jest.fn((id: string) =>
        Promise.resolve(row(id, LoadingRequestStatus.APPROVED)),
      ),
    };
    notifications = { emitLoadingRequest: jest.fn().mockResolvedValue(undefined) };
    service = new LoadingRequestService(
      repo as never,
      {} as never,
      new LoadingRequestStateMachine(),
      notifications as never,
      { isEnabled: jest.fn().mockReturnValue(true) } as never,
    );
  });

  it('همهٔ ردیف‌های SUBMITTED تایید می‌شوند و همان مسیر تک‌رکوردی اجرا می‌شود', async () => {
    stubStatuses({
      a: LoadingRequestStatus.SUBMITTED,
      b: LoadingRequestStatus.SUBMITTED,
      c: LoadingRequestStatus.SUBMITTED,
    });

    const result = await service.bulkApprove(['a', 'b', 'c'], ADMIN_ID);

    expect(result.approvedCount).toBe(3);
    expect(result.skippedCount).toBe(0);
    expect(result.approvedIds).toEqual(['a', 'b', 'c']);
    expect(result.skipped).toEqual([]);

    // هر تایید یک update با همان فیلدهای مسیر تک‌رکوردی و یک اعلان دارد.
    expect(repo.update).toHaveBeenCalledTimes(3);
    expect(notifications.emitLoadingRequest).toHaveBeenCalledTimes(3);
    const patch = repo.update.mock.calls[0][1] as Record<string, unknown>;
    expect(patch.status).toBe(LoadingRequestStatus.APPROVED);
    expect(patch.reviewedBy).toBe(ADMIN_ID);
    expect(patch.reviewedAt).toBeInstanceOf(Date);
  });

  it('ردیفی که دیگر SUBMITTED نیست skip می‌شود و بقیه تایید می‌شوند', async () => {
    // سناریوی واقعی: ادمین دیگری پیش از اجرای دسته روی «b» اقدام کرده است.
    stubStatuses({
      a: LoadingRequestStatus.SUBMITTED,
      b: LoadingRequestStatus.APPROVED,
      c: LoadingRequestStatus.SUBMITTED,
    });

    const result = await service.bulkApprove(['a', 'b', 'c'], ADMIN_ID);

    expect(result.approvedIds).toEqual(['a', 'c']);
    expect(result.approvedCount).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.skipped[0]?.id).toBe('b');
    // فقط ردیف‌های واقعاً تاییدشده نوشته می‌شوند، نه ردیف skip‌شده.
    expect(repo.update).toHaveBeenCalledTimes(2);
    expect(notifications.emitLoadingRequest).toHaveBeenCalledTimes(2);
  });

  it('دلیلِ skip همان پیام خطای مسیر تک‌رکوردی است (نه متن عمومی)', async () => {
    stubStatuses({ b: LoadingRequestStatus.LOADED });

    // پیام مرجع را از خودِ approve تک‌رکوردی می‌گیریم تا اگر روزی متن/کد خطا عوض شد،
    // خلاصهٔ گروهی هم همان را نشان دهد و این تست بی‌سر‌و‌صدا از هم جدا نشود.
    const single = await service.approve('b', ADMIN_ID).catch((err: unknown) => err);
    expect(single).toBeInstanceOf(AppException);

    const result = await service.bulkApprove(['b'], ADMIN_ID);

    expect(result.skipped[0]?.reason).toBe((single as AppException).message);
    expect(result.skipped[0]?.reason).not.toBe('');
  });

  it('شناسهٔ ناموجود کل دسته را شکست نمی‌دهد (فقط skip می‌شود)', async () => {
    stubStatuses({ a: LoadingRequestStatus.SUBMITTED });

    const result = await service.bulkApprove(['a', 'missing'], ADMIN_ID);

    expect(result.approvedIds).toEqual(['a']);
    expect(result.skipped.map((s) => s.id)).toEqual(['missing']);
    expect(result.skipped[0]?.reason).toBeTruthy();
  });

  it('شناسهٔ تکراری یک بار پردازش می‌شود (وگرنه دومی حتماً skip می‌شد)', async () => {
    stubStatuses({ a: LoadingRequestStatus.SUBMITTED });

    const result = await service.bulkApprove(['a', 'a', 'a'], ADMIN_ID);

    expect(result.approvedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('لیست خالی: هیچ نوشتنی و هیچ اعلانی رخ نمی‌دهد', async () => {
    stubStatuses({});

    const result = await service.bulkApprove([], ADMIN_ID);

    expect(result).toEqual({
      approvedCount: 0,
      skippedCount: 0,
      approvedIds: [],
      skipped: [],
    });
    expect(repo.findByIdWithContext).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(notifications.emitLoadingRequest).not.toHaveBeenCalled();
  });
});
