import { NotificationService } from './notification.service';
import { NotificationEvent } from './notification-events';
import type { NotificationRepository } from './notification.repository';

/**
 * تست ماتریس اعلانات (بخش ۱۷ — فاز ۷e پوشش).
 * اثبات می‌کند هر رویداد به مقصد درست (مشتری/همه ادمین‌ها/همه مشتریان) می‌رود
 * — تنها جایی که این منطق زندگی می‌کند همین سرویس است.
 */
describe('NotificationService', () => {
  interface Sent {
    target: 'admins' | 'customer' | 'customers';
    customerId?: string;
    title: string;
    body: string;
  }

  function make(): { service: NotificationService; sent: Sent[] } {
    const sent: Sent[] = [];
    const repo = {
      createForAdmins: (title: string, body: string): Promise<void> => {
        sent.push({ target: 'admins', title, body });
        return Promise.resolve();
      },
      createForCustomer: (customerId: string, title: string, body: string): Promise<void> => {
        sent.push({ target: 'customer', customerId, title, body });
        return Promise.resolve();
      },
      createForAllActiveCustomers: (title: string, body: string): Promise<void> => {
        sent.push({ target: 'customers', title, body });
        return Promise.resolve();
      },
    } as unknown as NotificationRepository;
    return { service: new NotificationService(repo), sent };
  }

  const payload = {
    customerId: 'cust-1',
    customerName: 'مشتری نمونه',
    requestNumber: 'LR-000001',
  };

  it.each([
    [NotificationEvent.LOADING_REQUEST_SUBMITTED, 'admins'],
    [NotificationEvent.LOADING_REQUEST_CANCELED, 'admins'],
    [NotificationEvent.LOADING_REQUEST_APPROVED, 'customer'],
    [NotificationEvent.LOADING_REQUEST_LOADED, 'customer'],
  ] as const)('%s → %s', async (event, target) => {
    const { service, sent } = make();
    await service.emitLoadingRequest(event, payload);
    expect(sent[0]?.target).toBe(target);
    if (target === 'customer') {
      expect(sent[0]?.customerId).toBe('cust-1');
    }
  });

  it('رد درخواست → همان مشتری، همراه با دلیل', async () => {
    const { service, sent } = make();
    await service.emitLoadingRequest(NotificationEvent.LOADING_REQUEST_REJECTED, {
      ...payload,
      reason: 'مانده کافی نیست',
    });
    expect(sent[0]?.target).toBe('customer');
    expect(sent[0]?.body).toContain('مانده کافی نیست');
  });

  it('رویداد غیرمرتبط با اعلام بار → خطا (نه اعلان اشتباه)', async () => {
    const { service } = make();
    await expect(
      service.emitLoadingRequest(NotificationEvent.RECEIPT_UPLOADED, payload),
    ).rejects.toThrow();
  });

  it('انتشار نظرسنجی → Broadcast همه مشتریان فعال', async () => {
    const { service, sent } = make();
    await service.emitSurveyPublished({ surveyTitle: 'رضایت‌سنجی' });
    expect(sent[0]?.target).toBe('customers');
    expect(sent[0]?.body).toContain('رضایت‌سنجی');
  });

  it('فیش واریزی/شکایت/مشتری جدید → همه ادمین‌ها', async () => {
    const { service, sent } = make();
    await service.emitReceiptUploaded({ customerName: 'م' });
    await service.emitComplaintSubmitted({ customerId: 'c', customerName: 'م' });
    await service.emitCustomerCreated({ customerName: 'م', adminName: 'ادمین' });
    expect(sent.map((s) => s.target)).toEqual(['admins', 'admins', 'admins']);
  });

  it('پاسخ شکایت → همان مشتری', async () => {
    const { service, sent } = make();
    await service.emitComplaintAnswered('cust-9');
    expect(sent[0]).toMatchObject({ target: 'customer', customerId: 'cust-9' });
  });
});
