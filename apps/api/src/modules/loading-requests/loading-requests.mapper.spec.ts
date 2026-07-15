import { Prisma } from '@prisma/client';
import { LoadingRequestStatus } from '@cement/shared-types';
import {
  buildLoadingRequestSumRow,
  toLoadingRequestDto,
} from './loading-requests.mapper';
import type { LoadingRequestWithRelations } from './loading-requests.repository';

/**
 * تست نگاشت اعلام بار (فاز ۷e پوشش) — منطق «ماندهٔ درخواست» و رفتار بدون تحویل.
 */
describe('loading-requests.mapper', () => {
  function row(overrides: Partial<LoadingRequestWithRelations> = {}): LoadingRequestWithRelations {
    return {
      id: 'lr1',
      requestNumber: 'LR-000001',
      submittedAt: new Date('2026-07-01T08:00:00Z'),
      requestDate: new Date('2026-07-02T00:00:00Z'),
      productId: 'p1',
      product: { name: 'سیمان پاکتی' },
      carrier: null,
      requestedQty: new Prisma.Decimal(25),
      status: 'SUBMITTED',
      reviewedByNote: null,
      delivery: null,
      ...overrides,
    } as unknown as LoadingRequestWithRelations;
  }

  it('بدون تحویل: deliveredQty=0، remaining=requested و hasDelivery=false', () => {
    const dto = toLoadingRequestDto(row());
    expect(dto.deliveredQty).toBe(0);
    expect(dto.remainingQty).toBe(25);
    expect(dto.hasDelivery).toBe(false);
    expect(dto.deliveryId).toBeNull();
    expect(dto.status).toBe(LoadingRequestStatus.SUBMITTED);
  });

  it('با تحویل: مانده = درخواستی - تحویلی (کف صفر)', () => {
    const dto = toLoadingRequestDto(
      row({
        delivery: { id: 'd1', deliveredQty: new Prisma.Decimal(27) },
      } as unknown as Partial<LoadingRequestWithRelations>),
    );
    expect(dto.deliveredQty).toBe(27);
    // تحویل بیش از درخواست (اضافه‌بار مجاز باسکول) نباید ماندهٔ منفی بسازد.
    expect(dto.remainingQty).toBe(0);
    expect(dto.hasDelivery).toBe(true);
    expect(dto.deliveryId).toBe('d1');
  });

  it('buildLoadingRequestSumRow جمع null را صفر می‌کند', () => {
    expect(buildLoadingRequestSumRow({ requestedQty: null }, 12)).toEqual({
      requestedQty: 0,
      deliveredQty: 12,
    });
  });
});
