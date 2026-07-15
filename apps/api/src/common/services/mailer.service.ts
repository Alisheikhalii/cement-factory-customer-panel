import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

/** یک ایمیل ساده برای ارسال (فرم تماس عمومی، بخش ۹.۱۰.۴). */
export interface OutgoingEmail {
  to: string;
  subject: string;
  /** متن ساده (این سیستم فعلاً HTML نمی‌فرستد). */
  text: string;
  /** آدرس Reply-To (مثلاً ایمیل فرستنده فرم تماس، اگر ایمیل داده باشد). */
  replyTo?: string;
}

/** پورت حداقلی Transport — برای تزریق ساختگی در تست (بدون SMTP واقعی). */
export interface MailTransport {
  sendMail(mail: {
    from: string;
    to: string;
    subject: string;
    text: string;
    replyTo?: string;
  }): Promise<unknown>;
}

export type MailTransportFactory = () => MailTransport;

/** توکن DI اختیاری برای تزریق Transport ساختگی (تست/محیط خاص). */
export const MAIL_TRANSPORT_FACTORY = Symbol('MAIL_TRANSPORT_FACTORY');

/**
 * سرویس ارسال ایمیل SMTP (فاز ۷ — بخش ۹.۱۰.۴).
 *
 * اگر `SMTP_HOST` تنظیم شده باشد با `nodemailer` واقعاً می‌فرستد؛ وگرنه (محیط
 * توسعه) فقط Log می‌کند تا جریان کاربر (فرم تماس) قطع نشود. خطای ارسال هم Log
 * می‌شود نه پرتاب — قطعی SMTP نباید Endpoint را ۵۰۰ کند (تصمیم قبلی همین سرویس).
 *
 * `nodemailer` تنبل require می‌شود (همان الگوی mssql/ioredis): تا SMTP واقعاً
 * پیکربندی نشده، نصب وابستگی لازم نیست. اتصال کاملاً env-driven است
 * (SMTP_HOST/PORT/USER/PASSWORD/FROM) — راه‌اندازی واقعی فقط .env می‌خواهد.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transportFactory: MailTransportFactory;
  private transport: MailTransport | null = null;

  constructor(
    @Optional() @Inject(MAIL_TRANSPORT_FACTORY) transportFactory?: MailTransportFactory,
  ) {
    this.transportFactory =
      transportFactory ?? ((): MailTransport => this.createNodemailerTransport());
  }

  /** آیا SMTP واقعی پیکربندی شده است؟ (برای تصمیم‌گیری/تست). */
  isConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());
  }

  /**
   * ارسال ایمیل. بدون SMTP → فقط Log (شبیه‌سازی). خطای ارسال واقعی → Log خطا،
   * بدون پرتاب (جریان کاربر ادامه می‌یابد).
   */
  async send(email: OutgoingEmail): Promise<void> {
    const from = process.env.SMTP_FROM ?? 'no-reply@nyrizcement.example';
    if (!this.isConfigured()) {
      this.logger.log(
        `SMTP پیکربندی نشده — شبیه‌سازی ارسال ایمیل از ${from} به ${email.to} با موضوع «${email.subject}»`,
      );
      return;
    }
    try {
      if (!this.transport) {
        this.transport = this.transportFactory();
      }
      await this.transport.sendMail({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        replyTo: email.replyTo,
      });
      this.logger.log(`ایمیل ارسال شد به ${email.to} با موضوع «${email.subject}»`);
    } catch (error) {
      this.logger.error(
        `ارسال ایمیل به ${email.to} شکست خورد: ${(error as Error).message}`,
      );
    }
  }

  /** Transport پیش‌فرض nodemailer — env-driven، بار تنبل. */
  private createNodemailerTransport(): MailTransport {
    let nodemailer: { createTransport(opts: unknown): MailTransport };
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch {
      throw new Error(
        'بستهٔ «nodemailer» نصب نیست. برای ارسال واقعی ایمیل ابتدا `pnpm add nodemailer` را اجرا کنید.',
      );
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // پورت ۴۶۵ یعنی TLS ضمنی؛ روی ۵۸۷ STARTTLS خودکار nodemailer عمل می‌کند.
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
}
