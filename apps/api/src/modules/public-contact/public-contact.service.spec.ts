import type { ContactMessageInput } from '@cement/shared-types';
import { PublicContactService } from './public-contact.service';

/**
 * تست واحد سرویس فرم تماس — تمرکز روی Rate Limiting (CONTACT_001) و عدم ذخیره در DB.
 * MailerService Mock می‌شود؛ زمان از طریق پارامتر `now` تزریق می‌شود.
 */

const VALID_INPUT: ContactMessageInput = {
  name: 'علی رضایی',
  phoneOrEmail: 'ali@example.com',
  message: 'سلام، درخواست اطلاعات دارم.',
};

describe('PublicContactService', () => {
  let mailer: { send: jest.Mock; isConfigured: jest.Mock };
  let service: PublicContactService;

  beforeEach(() => {
    mailer = {
      send: jest.fn().mockResolvedValue(undefined),
      isConfigured: jest.fn().mockReturnValue(false),
    };
    service = new PublicContactService(mailer as never);
  });

  it('مسیر موفق: ایمیل ارسال و sent=true (بدون هیچ نوشتن در DB)', async () => {
    const res = await service.submit(VALID_INPUT, '1.1.1.1', 1_000);
    expect(res).toEqual({ sent: true });
    expect(mailer.send).toHaveBeenCalledTimes(1);
  });

  it('Reply-To وقتی ورودی ایمیل باشد ست می‌شود', async () => {
    await service.submit(VALID_INPUT, '1.1.1.1', 1_000);
    const arg = mailer.send.mock.calls[0][0] as { replyTo?: string };
    expect(arg.replyTo).toBe('ali@example.com');
  });

  it('Reply-To وقتی ورودی موبایل باشد ست نمی‌شود', async () => {
    await service.submit({ ...VALID_INPUT, phoneOrEmail: '09121234567' }, '1.1.1.1', 1_000);
    const arg = mailer.send.mock.calls[0][0] as { replyTo?: string };
    expect(arg.replyTo).toBeUndefined();
  });

  it('گیرنده از CONTACT_FORM_RECIPIENT خوانده می‌شود', async () => {
    process.env.CONTACT_FORM_RECIPIENT = 'sales@nyriz.test';
    await service.submit(VALID_INPUT, '1.1.1.1', 1_000);
    const arg = mailer.send.mock.calls[0][0] as { to: string };
    expect(arg.to).toBe('sales@nyriz.test');
    delete process.env.CONTACT_FORM_RECIPIENT;
  });

  it('Rate Limit: ارسال چهارم از یک IP در پنجره → CONTACT_001', async () => {
    const ip = '2.2.2.2';
    await service.submit(VALID_INPUT, ip, 1_000);
    await service.submit(VALID_INPUT, ip, 2_000);
    await service.submit(VALID_INPUT, ip, 3_000);
    await expect(service.submit(VALID_INPUT, ip, 4_000)).rejects.toMatchObject({
      code: 'CONTACT_001',
    });
    // ارسال چهارم نباید ایمیل بفرستد.
    expect(mailer.send).toHaveBeenCalledTimes(3);
  });

  it('Rate Limit: بعد از عبور پنجره دوباره مجاز می‌شود', async () => {
    const ip = '3.3.3.3';
    await service.submit(VALID_INPUT, ip, 1_000);
    await service.submit(VALID_INPUT, ip, 2_000);
    await service.submit(VALID_INPUT, ip, 3_000);
    // ۱۱ دقیقه بعد → پنجره پاک شده، دوباره مجاز.
    const later = 1_000 + 11 * 60 * 1000;
    await expect(service.submit(VALID_INPUT, ip, later)).resolves.toEqual({ sent: true });
  });

  it('Rate Limit مستقل به‌ازای هر IP', async () => {
    await service.submit(VALID_INPUT, '4.4.4.4', 1_000);
    await service.submit(VALID_INPUT, '4.4.4.4', 2_000);
    await service.submit(VALID_INPUT, '4.4.4.4', 3_000);
    // IP دیگر باید همچنان مجاز باشد.
    await expect(service.submit(VALID_INPUT, '5.5.5.5', 4_000)).resolves.toEqual({
      sent: true,
    });
  });
});
