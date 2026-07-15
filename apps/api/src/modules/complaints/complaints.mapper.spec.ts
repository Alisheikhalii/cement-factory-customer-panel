import { ComplaintStatus } from '@cement/shared-types';
import { toAdminComplaintDto, toComplaintDto } from './complaints.mapper';
import type { ComplaintWithCustomer } from './complaints.repository';

/**
 * تست نگاشت شکایات (فاز ۷e پوشش) — تبدیل تاریخ‌ها و وضعیت به DTO مشترک.
 */
describe('complaints.mapper', () => {
  const base = {
    id: 'c1',
    subject: 'تاخیر در بارگیری',
    description: 'شرح شکایت',
    submittedAt: new Date('2026-07-01T08:00:00Z'),
    status: 'PENDING',
    reply: null,
    repliedAt: null,
  };

  it('toComplaintDto: بدون پاسخ → reply/repliedAt هر دو null', () => {
    const dto = toComplaintDto(base);
    expect(dto).toEqual({
      id: 'c1',
      subject: 'تاخیر در بارگیری',
      description: 'شرح شکایت',
      submittedAt: '2026-07-01T08:00:00.000Z',
      status: ComplaintStatus.PENDING,
      reply: null,
      repliedAt: null,
    });
  });

  it('toComplaintDto: با پاسخ → repliedAt به ISO تبدیل می‌شود', () => {
    const dto = toComplaintDto({
      ...base,
      status: 'ANSWERED',
      reply: 'رسیدگی شد',
      repliedAt: new Date('2026-07-02T10:30:00Z'),
    });
    expect(dto.status).toBe(ComplaintStatus.ANSWERED);
    expect(dto.reply).toBe('رسیدگی شد');
    expect(dto.repliedAt).toBe('2026-07-02T10:30:00.000Z');
  });

  it('toAdminComplaintDto: نام مشتری از رابطه استخراج می‌شود', () => {
    const dto = toAdminComplaintDto({
      ...base,
      customerId: 'cust-1',
      customer: { name: 'مشتری نمونه' },
    } as unknown as ComplaintWithCustomer);
    expect(dto.customerName).toBe('مشتری نمونه');
    expect(dto.status).toBe(ComplaintStatus.PENDING);
  });
});
