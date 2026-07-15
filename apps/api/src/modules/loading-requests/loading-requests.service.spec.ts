import { Prisma } from '@prisma/client';
import { LoadingRequestStatus, VehicleType, LoadType } from '@cement/shared-types';
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
  let service: LoadingRequestService;

  beforeEach(() => {
    repo = {
      findOrderForValidation: jest.fn(),
      sumActiveRequestedQty: jest.fn(),
      createWithSequentialNumber: jest.fn(),
      findCustomerName: jest.fn().mockResolvedValue({ name: 'شرکت آزمون' }),
    };
    notifications = { emitLoadingRequest: jest.fn().mockResolvedValue(undefined) };
    service = new LoadingRequestService(
      repo as never,
      {} as never,
      new LoadingRequestStateMachine(),
      notifications as never,
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
