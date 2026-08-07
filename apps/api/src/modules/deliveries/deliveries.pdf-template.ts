import type { DeliveryDto, DeliverySumRow } from '@cement/shared-types';
import { companyPdfHeader } from '../../common/http/pdf-branding';

interface DeliveryPdfInput {
  rows: DeliveryDto[];
  sumRow: DeliverySumRow;
  from: string | null;
  to: string | null;
}

/**
 * قالب‌بندی عدد برای PDF. `null`/`undefined` یعنی مقدار در دسترس نیست (مثلاً
 * تحویل ثبت‌دستی بدون داده‌های مالی) و با «—» نمایش داده می‌شود، نه صفر.
 */
function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return '—';
  }
  return n.toLocaleString('fa-IR');
}

function esc(value: string | null): string {
  if (!value) {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * قالب HTML گزارش تحویل برای تولید PDF واقعی (بخش ۹.۶):
 * Header با نام کارخانه + بازه فیلتر + جدول کامل + Footer جمع‌ها.
 * شماره صفحه توسط PdfService (footerTemplate) درج می‌شود.
 */
export function renderDeliveryPdfHtml(input: DeliveryPdfInput): string {
  const rangeText =
    input.from || input.to
      ? `بازه: ${input.from?.slice(0, 10) ?? '—'} تا ${input.to?.slice(0, 10) ?? '—'}`
      : 'بازه: همه رکوردها';

  const bodyRows = input.rows
    .map(
      (d, i) => `
      <tr>
        <td>${fmt(i + 1)}</td>
        <td>${esc(d.weighingNumber)}</td>
        <td>${esc(d.loadingRequestNumber)}</td>
        <td>${esc(d.deliveryDate.slice(0, 10))}</td>
        <td>${esc(d.carrierName)}</td>
        <td>${esc(d.vehicleNumber)}</td>
        <td>${esc(d.productName)}</td>
        <td class="num">${fmt(d.deliveredQty)}</td>
        <td class="num">${fmt(d.baseAmount)}</td>
        <td class="num">${fmt(d.vatAmount)}</td>
        <td class="num">${fmt(d.amountWithFactors)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  * { font-family: Tahoma, Arial, sans-serif; }
  body { margin: 0; color: #1e293b; }
  .header { text-align: center; margin-bottom: 12px; }
  .title { font-size: 16px; font-weight: bold; }
  .range { font-size: 11px; color: #475569; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: center; }
  thead th { background: #eff3f8; }
  td.num { text-align: left; direction: ltr; }
  tfoot td { font-weight: bold; background: #f8fafc; }
</style>
</head>
<body>
  ${companyPdfHeader('گزارش تحویل')}
  <div class="header"><div class="range">${rangeText}</div></div>
  <table>
    <thead>
      <tr>
        <th>ردیف</th><th>شماره توزین</th><th>اعلام بار</th><th>تاریخ</th>
        <th>باربری</th><th>شماره ماشین</th><th>محصول</th>
        <th>تحویل</th><th>مبلغ پایه</th><th>ارزش‌افزوده</th><th>مبلغ با عوامل</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="7">جمع کل</td>
        <td class="num">${fmt(input.sumRow.deliveredQty)}</td>
        <td class="num">${fmt(input.sumRow.baseAmount)}</td>
        <td class="num">${fmt(input.sumRow.vatAmount)}</td>
        <td class="num">${fmt(input.sumRow.amountWithFactors)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
