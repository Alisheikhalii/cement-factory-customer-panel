import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';

/**
 * سرویس تولید PDF واقعی با Puppeteer (بخش ۹.۶ — چاپ تحویل).
 *
 * ⚠️ Puppeteer یک Chromium سنگین دانلود می‌کند. برای اینکه در صورت نصب‌نشدن
 * کل برنامه از کار نیفتد، ماژول به‌صورت Lazy (فقط هنگام اولین درخواست PDF)
 * import می‌شود؛ اگر در دسترس نباشد، خطای استاندارد ERP_001/GENERIC بازگردانده
 * می‌شود و بقیه API سالم بالا می‌ماند.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async renderHtml(html: string): Promise<Buffer> {
    let puppeteer: typeof import('puppeteer');
    try {
      puppeteer = await import('puppeteer');
    } catch {
      this.logger.error('Puppeteer نصب نشده است؛ تولید PDF ممکن نیست.');
      throw new AppException('GENERIC_500', 'سرویس تولید PDF در دسترس نیست');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '10mm', right: '10mm' },
        displayHeaderFooter: true,
        footerTemplate:
          '<div style="width:100%;font-size:9px;text-align:center;color:#666;">صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></div>',
        headerTemplate: '<div></div>',
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
