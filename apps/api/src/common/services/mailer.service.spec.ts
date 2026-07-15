import { MailerService, type MailTransport } from './mailer.service';

/**
 * تست MailerService (فاز ۷ — SMTP واقعی env-driven) با Transport ساختگی.
 * اثبات می‌کند: بدون SMTP_HOST فقط شبیه‌سازی/Log، با SMTP_HOST ارسال واقعی از طریق
 * Transport، و خطای ارسال جریان را نمی‌شکند (Log، بدون پرتاب).
 */
describe('MailerService', () => {
  const EMAIL = {
    to: 'info@example.com',
    subject: 'موضوع',
    text: 'متن پیام',
    replyTo: 'user@example.com',
  };
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  function makeService(result: Error | null = null): {
    service: MailerService;
    sent: Parameters<MailTransport['sendMail']>[0][];
  } {
    const sent: Parameters<MailTransport['sendMail']>[0][] = [];
    const transport: MailTransport = {
      sendMail: (mail): Promise<unknown> => {
        sent.push(mail);
        return result ? Promise.reject(result) : Promise.resolve({ messageId: 'x' });
      },
    };
    return { service: new MailerService(() => transport), sent };
  }

  it('بدون SMTP_HOST: isConfigured=false و Transport صدا زده نمی‌شود', async () => {
    delete process.env.SMTP_HOST;
    const { service, sent } = makeService();
    expect(service.isConfigured()).toBe(false);
    await service.send(EMAIL);
    expect(sent).toHaveLength(0);
  });

  it('با SMTP_HOST: ایمیل با from/replyTo درست به Transport می‌رسد', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_FROM = 'portal@nyriz.example';
    const { service, sent } = makeService();
    await service.send(EMAIL);
    expect(sent).toEqual([
      {
        from: 'portal@nyriz.example',
        to: 'info@example.com',
        subject: 'موضوع',
        text: 'متن پیام',
        replyTo: 'user@example.com',
      },
    ]);
  });

  it('خطای ارسال SMTP پرتاب نمی‌شود (جریان فرم تماس قطع نشود)', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    const { service } = makeService(new Error('connection refused'));
    await expect(service.send(EMAIL)).resolves.toBeUndefined();
  });
});
