import type { Response } from 'express';

/** ارسال Buffer اکسل با هدرهای دانلود (بخش ۹.۰ — Export Excel). */
export function sendExcel(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

/** ارسال Buffer پی‌دی‌اف با هدرهای مناسب (بخش ۹.۶ — چاپ تحویل). */
export function sendPdf(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}
