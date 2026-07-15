import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ErpAdapter } from '../erp-adapter.interface';
import type {
  ErpCustomerDto,
  ErpDeliveryDto,
  ErpInventoryDto,
  ErpInvoiceDto,
  ErpLoadingRequestSubmissionDto,
  ErpOrderDto,
  ErpProductDto,
} from '../dto/erp-dtos';
import {
  mapErpCustomer,
  mapErpDelivery,
  mapErpInventory,
  mapErpInvoice,
  mapErpOrder,
  mapErpProduct,
} from '../dto/erp-record.mapper';
import { ErpConnectionError, requireEnv } from './adapter-config.util';
import { parseCsv, toCsv } from './csv.util';

const KIND = 'file-based';

/**
 * Adapter تبادل فایل CSV با ERP (بخش ۱۲.۳ PRD).
 *
 * قرارداد داده: ERP در مسیر مشترک (`ERP_FILE_EXCHANGE_DIR`) زیرپوشهٔ `in/` را با
 * فایل‌های CSV (سرآیند = نام فیلدهای DTO مرزی، بخش ۱۲.۱) پر می‌کند و پورتال
 * خروجی‌هایش (درخواست بارگیری/همگام‌سازی وضعیت) را در `out/` می‌نویسد تا ERP
 * بردارد. نام فایل‌ها هم از env قابل تغییر است — پس از دریافت مسیر واقعی از
 * کارخانه فقط .env تغییر می‌کند، نه کد.
 *
 * نبودِ فایل ورودی = «هنوز داده‌ای منتشر نشده» → آرایهٔ خالی (نه خطا)؛ اما مسیر
 * تبادل غیرقابل‌دسترس، خطای اتصال شفاف می‌دهد.
 */
@Injectable()
export class FileBasedErpAdapter implements ErpAdapter {
  private readonly logger = new Logger(FileBasedErpAdapter.name);
  private readonly inDir: string;
  private readonly outDir: string;
  private readonly files: Record<
    'customers' | 'orders' | 'products' | 'inventory' | 'deliveries' | 'invoices',
    string
  >;

  constructor(config: ConfigService) {
    const required = requireEnv(config, KIND, ['ERP_FILE_EXCHANGE_DIR']);
    const base = required['ERP_FILE_EXCHANGE_DIR'] ?? '';
    this.inDir = path.join(base, config.get<string>('ERP_FILE_IN_SUBDIR', 'in'));
    this.outDir = path.join(base, config.get<string>('ERP_FILE_OUT_SUBDIR', 'out'));
    this.files = {
      customers: config.get<string>('ERP_FILE_CUSTOMERS', 'customers.csv'),
      orders: config.get<string>('ERP_FILE_ORDERS', 'orders.csv'),
      products: config.get<string>('ERP_FILE_PRODUCTS', 'products.csv'),
      inventory: config.get<string>('ERP_FILE_INVENTORY', 'inventory.csv'),
      deliveries: config.get<string>('ERP_FILE_DELIVERIES', 'deliveries.csv'),
      invoices: config.get<string>('ERP_FILE_INVOICES', 'invoices.csv'),
    };
    this.logger.log(`FileBasedErpAdapter فعال شد (ERP_ADAPTER=${KIND}, dir=${base})`);
  }

  // --- Read (ERP → Portal) ---

  async getCustomers(since?: Date): Promise<ErpCustomerDto[]> {
    const rows = await this.readCsv(this.files.customers, 'getCustomers');
    // فایل CSV فیلد updatedAt استاندارد ندارد؛ ERP فایل را کامل بازنویسی می‌کند،
    // پس فیلتر since روی این منبع بی‌معنی است و نادیده گرفته می‌شود.
    void since;
    return rows.map(mapErpCustomer);
  }

  async getOrders(customerCode?: string, since?: Date): Promise<ErpOrderDto[]> {
    const rows = await this.readCsv(this.files.orders, 'getOrders');
    let orders = rows.map(mapErpOrder);
    if (customerCode) {
      orders = orders.filter((o) => o.customerCode === customerCode);
    }
    if (since) {
      const sinceMs = since.getTime();
      orders = orders.filter((o) => new Date(o.orderDate).getTime() >= sinceMs);
    }
    return orders;
  }

  async getProducts(): Promise<ErpProductDto[]> {
    const rows = await this.readCsv(this.files.products, 'getProducts');
    return rows.map(mapErpProduct);
  }

  async getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto> {
    const rows = await this.readCsv(this.files.inventory, 'getInventory');
    const rec = rows.find(
      (r) => r['customerCode'] === customerCode && r['productCode'] === productCode,
    );
    if (!rec) {
      return { customerCode, productCode, remainingAllowance: 0 };
    }
    return mapErpInventory(rec);
  }

  async getDeliveries(since?: Date): Promise<ErpDeliveryDto[]> {
    const rows = await this.readCsv(this.files.deliveries, 'getDeliveries');
    let deliveries = rows.map(mapErpDelivery);
    if (since) {
      const sinceMs = since.getTime();
      deliveries = deliveries.filter((d) => new Date(d.deliveryDate).getTime() >= sinceMs);
    }
    return deliveries;
  }

  async getInvoices(customerCode: string, from: Date, to: Date): Promise<ErpInvoiceDto[]> {
    const rows = await this.readCsv(this.files.invoices, 'getInvoices');
    const fromMs = from.getTime();
    const toMs = to.getTime();
    return rows
      .map(mapErpInvoice)
      .filter((inv) => inv.customerCode === customerCode)
      .filter((inv) => {
        const t = new Date(inv.date).getTime();
        return t >= fromMs && t < toMs;
      });
  }

  // --- Write (Portal → ERP) ---

  async submitLoadingRequest(
    request: ErpLoadingRequestSubmissionDto,
  ): Promise<{ erpReferenceId: string }> {
    const columns = [
      'requestNumber',
      'customerCode',
      'productCode',
      'requestedQty',
      'vehicleType',
      'loadType',
      'requestDate',
      'destinationCity',
      'additionalAddress',
      'destinationPostalCode',
      'recipientMobile',
      'carrierName',
    ];
    const fileName = `loading-request-${request.requestNumber}.csv`;
    await this.writeCsv(
      fileName,
      columns,
      [request as unknown as Record<string, unknown>],
      'submitLoadingRequest',
    );
    // در تبادل فایلی، شناسهٔ مرجع همان فایل خروجی است؛ ERP پس از برداشت، وضعیت را
    // از طریق سرویس داخلی (mark-loaded، بخش ۶.۲) برمی‌گرداند.
    return { erpReferenceId: `FILE-${request.requestNumber}` };
  }

  async syncLoadingStatus(requestNumber: string, status: string, note?: string): Promise<void> {
    const fileName = `loading-status-${requestNumber}.csv`;
    await this.writeCsv(
      fileName,
      ['requestNumber', 'status', 'note'],
      [{ requestNumber, status, note: note ?? '' }],
      'syncLoadingStatus',
    );
  }

  // --- زیرساخت ---

  private async readCsv(fileName: string, operation: string): Promise<Record<string, string>[]> {
    const filePath = path.join(this.inDir, fileName);
    let text: string;
    try {
      text = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // ERP هنوز این فایل را منتشر نکرده — دادهٔ خالی، نه خطا.
        return [];
      }
      throw new ErpConnectionError(KIND, operation, (error as Error).message);
    }
    return parseCsv(text);
  }

  private async writeCsv(
    fileName: string,
    columns: string[],
    records: Record<string, unknown>[],
    operation: string,
  ): Promise<void> {
    try {
      await fs.mkdir(this.outDir, { recursive: true });
      const filePath = path.join(this.outDir, fileName);
      // نوشتن اتمی: ابتدا فایل موقت، سپس rename — تا ERP فایل نیمه‌نوشته برندارد.
      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, toCsv(columns, records), 'utf8');
      await fs.rename(tmpPath, filePath);
    } catch (error) {
      throw new ErpConnectionError(KIND, operation, (error as Error).message);
    }
  }
}
