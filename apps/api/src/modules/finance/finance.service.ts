import { Injectable } from '@nestjs/common';
import { FinanceSourceType } from '@cement/shared-types';
import type {
  FinanceAssetReportDto,
  FinanceStatementDto,
  FinanceStatusStatementListData,
  FinanceTransactionListData,
  PaymentReceiptDto,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination } from '../../common/dto/pagination.dto';
import { iranDayRangeUtc } from '../../common/utils/jalali.util';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { ExcelService } from '../../common/services/excel.service';
import { PdfService } from '../../common/services/pdf.service';
import { FileStorageService } from '../../common/services/file-storage.service';
import { toNum, toNumOrNull } from '../../common/utils/decimal.util';
import { companyPdfHeader } from '../../common/http/pdf-branding';
import { NotificationService } from '../notifications/notification.service';
import type { FinanceQueryDto } from './dto/finance-query.dto';
import type { CreateReceiptDto } from './dto/create-receipt.dto';
import { FinanceFilter, FinanceRepository } from './finance.repository';
import {
  toReceiptDto,
  toStatementDto,
  toStatusStatementDto,
  toTransactionDto,
} from './finance.mapper';

/** فرمت‌های مجاز فیش واریزی (BR-16). */
const ALLOWED_RECEIPT_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // ۵ مگابایت (RECEIPT_002)

/**
 * Escape کاراکترهای حساس HTML پیش از تزریق در قالب PDF (Puppeteer).
 * دفاع در عمق: حتی اگر مقادیر از ERP/دیتابیس بیایند، نباید ساختار HTML را بشکنند
 * یا محتوای ناخواسته تزریق کنند.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** فایل آپلودشده (شکل Express.Multer.File بدون وابستگی مستقیم به تایپ آن). */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * سرویس مالی (بخش ۹.۳ / ۱۱.۳).
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲).
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly repo: FinanceRepository,
    private readonly excel: ExcelService,
    private readonly pdf: PdfService,
    private readonly storage: FileStorageService,
    private readonly notifications: NotificationService,
  ) {}

  private buildFilter(
    customerId: string,
    source: FinanceSourceType,
    query: FinanceQueryDto,
  ): FinanceFilter {
    // from/to رشتهٔ تاریخ (YYYY-MM-DD) و به‌عنوان روز تقویمی ایران تفسیر می‌شوند.
    // `to` به کرانِ بالای انحصاری (نیمه‌شب ایرانِ روز بعد) تبدیل می‌شود تا کل «روز
    // پایان» در نتیجه بماند (Repository از `lt` استفاده می‌کند).
    return {
      customerId,
      source,
      from: query.from ? iranDayRangeUtc(query.from).start : undefined,
      to: query.to ? iranDayRangeUtc(query.to).end : undefined,
    };
  }

  async transactions(
    customerId: string,
    query: FinanceQueryDto,
  ): Promise<ResponseWithMeta<FinanceTransactionListData>> {
    const filter = this.buildFilter(customerId, FinanceSourceType.TRANSACTION, query);
    const { page, pageSize, skip, take } = resolvePagination(query);
    const [{ rows, total }, sums] = await Promise.all([
      this.repo.findPage(filter, skip, take),
      this.repo.aggregateAmount(filter),
    ]);
    const data: FinanceTransactionListData = {
      rows: rows.map(toTransactionDto),
      sumRow: { amount: toNum(sums.amount) },
    };
    return new ResponseWithMeta(data, buildMeta(page, pageSize, total));
  }

  async statusStatement(
    customerId: string,
    query: FinanceQueryDto,
  ): Promise<ResponseWithMeta<FinanceStatusStatementListData>> {
    const filter = this.buildFilter(customerId, FinanceSourceType.STATUS_STATEMENT, query);
    const { page, pageSize, skip, take } = resolvePagination(query);
    const [{ rows, total }, sums] = await Promise.all([
      this.repo.findPage(filter, skip, take),
      this.repo.aggregateAmount(filter),
    ]);
    const data: FinanceStatusStatementListData = {
      rows: rows.map(toStatusStatementDto),
      sumRow: { debit: toNum(sums.debit), credit: toNum(sums.credit) },
    };
    return new ResponseWithMeta(data, buildMeta(page, pageSize, total));
  }

  async statements(customerId: string): Promise<FinanceStatementDto[]> {
    const filter: FinanceFilter = { customerId, source: FinanceSourceType.STATEMENT };
    const rows = await this.repo.findAll(filter);
    return rows.map(toStatementDto);
  }

  async statementPdf(customerId: string, id: string): Promise<Buffer> {
    const row = await this.repo.findById(customerId, id);
    if (!row || row.source !== FinanceSourceType.STATEMENT) {
      throw new AppException('ORDER_001', 'صورت‌حساب یافت نشد');
    }
    const dto = toStatementDto(row);
    const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/>
      <style>*{font-family:Tahoma,Arial,sans-serif}.header{text-align:center}.title{font-weight:bold;font-size:15px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}td,th{border:1px solid #cbd5e1;padding:6px}</style>
      </head><body>${companyPdfHeader('صورت‌حساب')}
      <table>
        <tr><th>شماره سند</th><td>${escapeHtml(dto.docNumber)}</td></tr>
        <tr><th>تاریخ</th><td>${escapeHtml(dto.date.slice(0, 10))}</td></tr>
        <tr><th>شرح</th><td>${escapeHtml(dto.description ?? '')}</td></tr>
        <tr><th>مبلغ</th><td>${dto.amount.toLocaleString('fa-IR')}</td></tr>
      </table></body></html>`;
    return this.pdf.renderHtml(html);
  }

  async assetReport(customerId: string): Promise<FinanceAssetReportDto> {
    const [credit, balance] = await Promise.all([
      this.repo.getCustomerCredit(customerId),
      this.repo.latestBalance(customerId),
    ]);
    return {
      creditLimit: toNumOrNull(credit?.creditLimit ?? null),
      creditBalance: toNumOrNull(credit?.creditBalance ?? null),
      currentBalance: toNumOrNull(balance),
    };
  }

  async listReceipts(customerId: string): Promise<PaymentReceiptDto[]> {
    const rows = await this.repo.listReceipts(customerId);
    return rows.map(toReceiptDto);
  }

  async createReceipt(
    customerId: string,
    file: UploadedFile | undefined,
    dto: CreateReceiptDto,
  ): Promise<PaymentReceiptDto> {
    if (!file) {
      throw new AppException('RECEIPT_001', 'فایل فیش واریزی الزامی است');
    }
    if (!ALLOWED_RECEIPT_MIME.has(file.mimetype)) {
      throw new AppException('RECEIPT_001');
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      throw new AppException('RECEIPT_002');
    }
    // فاز ۷: ذخیره‌سازی واقعی فایل (FileStorageService — دیسک محلی env-driven؛
    // نام فایل UUID، جدا به‌ازای هر مشتری). URL منطقی `storage://` ثبت می‌شود.
    const fileUrl = await this.storage.save(
      `receipts/${customerId}`,
      file.originalname,
      file.buffer,
    );
    const created = await this.repo.createReceipt({
      customerId,
      fileUrl,
      amount: dto.amount ?? null,
      description: dto.description ?? null,
    });

    // بخش ۱۷ (ماتریس اعلانات): بارگذاری فیش واریزی → اعلان به همه ادمین‌ها.
    await this.notifications.emitReceiptUploaded({
      customerName: await this.repo.findCustomerName(customerId),
    });

    return toReceiptDto(created);
  }

  async exportTransactionsExcel(
    customerId: string,
    query: FinanceQueryDto,
  ): Promise<Buffer> {
    const filter = this.buildFilter(customerId, FinanceSourceType.TRANSACTION, query);
    const [rows, sums] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateAmount(filter),
    ]);
    const dtos = rows.map(toTransactionDto);
    return this.excel.build({
      sheetName: 'تراکنش‌ها',
      title: 'گزارش تراکنش‌های مالی',
      columns: [
        { header: 'تاریخ', key: 'date' },
        { header: 'شماره', key: 'docNumber' },
        { header: 'نوع عملیات', key: 'operationType', width: 22 },
        { header: 'بانک', key: 'bankName', width: 18 },
        { header: 'شماره حساب', key: 'accountNumber', width: 20 },
        { header: 'مبلغ', key: 'amount', numeric: true, width: 18 },
        { header: 'شرح', key: 'description', width: 30 },
        { header: 'سررسید', key: 'dueDate' },
        { header: 'وضعیت', key: 'status' },
      ],
      rows: dtos.map((t) => ({
        date: t.date.slice(0, 10),
        docNumber: t.docNumber,
        operationType: t.operationType,
        bankName: t.bankName ?? '',
        accountNumber: t.accountNumber ?? '',
        amount: t.amount,
        description: t.description ?? '',
        dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
        status: t.status,
      })),
      sumRow: { amount: toNum(sums.amount) },
    });
  }

  async exportTransactionsPdf(
    customerId: string,
    query: FinanceQueryDto,
  ): Promise<Buffer> {
    const filter = this.buildFilter(customerId, FinanceSourceType.TRANSACTION, query);
    const [rows, sums] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateAmount(filter),
    ]);
    const dtos = rows.map(toTransactionDto);
    const body = dtos
      .map(
        (t, i) => `<tr>
          <td>${(i + 1).toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(t.date.slice(0, 10))}</td>
          <td>${escapeHtml(t.docNumber)}</td>
          <td>${escapeHtml(t.operationType)}</td>
          <td class="num">${t.amount.toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(t.status)}</td>
        </tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/>
      <style>*{font-family:Tahoma,Arial,sans-serif}.header{text-align:center}.title{font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:5px;text-align:center}
      td.num{direction:ltr;text-align:left}tfoot td{font-weight:bold}</style></head>
      <body>${companyPdfHeader('گزارش تراکنش‌های مالی')}
      <table><thead><tr><th>ردیف</th><th>تاریخ</th><th>شماره</th><th>نوع عملیات</th><th>مبلغ</th><th>وضعیت</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td colspan="4">جمع واریزی‌ها</td><td class="num">${toNum(sums.amount).toLocaleString('fa-IR')}</td><td></td></tr></tfoot>
      </table></body></html>`;
    return this.pdf.renderHtml(html);
  }
}
