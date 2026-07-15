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

/**
 * پورت حداقلی اجرای Query روی SQL Server — Adapter فقط به این وابسته است.
 * پیاده‌سازی پیش‌فرض (createMssqlClient) با درایور `mssql` ساخته می‌شود؛
 * تست‌ها یک نمونهٔ ساختگی تزریق می‌کنند (بدون نیاز به دیتابیس واقعی).
 */
export interface ErpSqlClient {
  query(sql: string, params?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
}

/** سازندهٔ اختیاری Client — برای تزریق ساختگی در تست. */
export type ErpSqlClientFactory = () => Promise<ErpSqlClient>;

const KIND = 'sql-server';

/**
 * Adapter اتصال مستقیم به دیتابیس ERP از طریق SQL Server (بخش ۱۲.۳ PRD).
 *
 * قرارداد داده: کارخانه برای هر موجودیت یک View (یا جدول) با ستون‌هایی هم‌نام
 * فیلدهای DTO مرزی (بخش ۱۲.۱) در اختیار پورتال می‌گذارد؛ نام Viewها و اتصال همه
 * از env می‌آیند (ERP_SQL_*) — پس از دریافت اطلاعات واقعی فقط .env تغییر می‌کند.
 *
 * نوشتن (ثبت درخواست بارگیری / همگام‌سازی وضعیت) از طریق Stored Procedure انجام
 * می‌شود (نام‌ها هم از env). درایور `mssql` به‌صورت تنبل (اولین Query) بار می‌شود
 * تا در محیط‌هایی که این Adapter انتخاب نشده، وابستگی لازم نباشد.
 */
@Injectable()
export class SqlServerErpAdapter implements ErpAdapter {
  private readonly logger = new Logger(SqlServerErpAdapter.name);
  private readonly views: Record<
    'customers' | 'orders' | 'products' | 'inventory' | 'deliveries' | 'invoices',
    string
  >;
  private readonly procs: { submitLoading: string; syncStatus: string };
  private readonly clientFactory: ErpSqlClientFactory;
  private clientPromise: Promise<ErpSqlClient> | null = null;

  constructor(
    private readonly config: ConfigService,
    clientFactory?: ErpSqlClientFactory,
  ) {
    // fail-fast در بوت: اگر این Adapter انتخاب شده اما اتصال ناقص است، همان‌جا بایست.
    requireEnv(config, KIND, [
      'ERP_SQL_HOST',
      'ERP_SQL_DATABASE',
      'ERP_SQL_USER',
      'ERP_SQL_PASSWORD',
    ]);
    this.views = {
      customers: config.get<string>('ERP_SQL_VIEW_CUSTOMERS', 'portal_customers'),
      orders: config.get<string>('ERP_SQL_VIEW_ORDERS', 'portal_orders'),
      products: config.get<string>('ERP_SQL_VIEW_PRODUCTS', 'portal_products'),
      inventory: config.get<string>('ERP_SQL_VIEW_INVENTORY', 'portal_inventory'),
      deliveries: config.get<string>('ERP_SQL_VIEW_DELIVERIES', 'portal_deliveries'),
      invoices: config.get<string>('ERP_SQL_VIEW_INVOICES', 'portal_invoices'),
    };
    this.procs = {
      submitLoading: config.get<string>(
        'ERP_SQL_PROC_SUBMIT_LOADING',
        'portal_submit_loading_request',
      ),
      syncStatus: config.get<string>('ERP_SQL_PROC_SYNC_STATUS', 'portal_sync_loading_status'),
    };
    this.clientFactory = clientFactory ?? ((): Promise<ErpSqlClient> => this.createMssqlClient());
    this.logger.log(`SqlServerErpAdapter فعال شد (ERP_ADAPTER=${KIND})`);
  }

  // --- Read (ERP → Portal) ---

  async getCustomers(since?: Date): Promise<ErpCustomerDto[]> {
    const rows = since
      ? await this.run(
          `SELECT * FROM ${this.views.customers} WHERE updatedAt >= @since`,
          { since },
          'getCustomers',
        )
      : await this.run(`SELECT * FROM ${this.views.customers}`, {}, 'getCustomers');
    return rows.map(mapErpCustomer);
  }

  async getOrders(customerCode?: string, since?: Date): Promise<ErpOrderDto[]> {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};
    if (customerCode) {
      conditions.push('customerCode = @customerCode');
      params['customerCode'] = customerCode;
    }
    if (since) {
      conditions.push('orderDate >= @since');
      params['since'] = since;
    }
    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.run(`SELECT * FROM ${this.views.orders}${where}`, params, 'getOrders');
    return rows.map(mapErpOrder);
  }

  async getProducts(): Promise<ErpProductDto[]> {
    const rows = await this.run(`SELECT * FROM ${this.views.products}`, {}, 'getProducts');
    return rows.map(mapErpProduct);
  }

  async getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto> {
    const rows = await this.run(
      `SELECT * FROM ${this.views.inventory} WHERE customerCode = @customerCode AND productCode = @productCode`,
      { customerCode, productCode },
      'getInventory',
    );
    const first = rows[0];
    if (!first) {
      // نبودِ ردیف = مانده صفر (برگ فروشی ثبت نشده)، نه خطا.
      return { customerCode, productCode, remainingAllowance: 0 };
    }
    return mapErpInventory(first);
  }

  async getDeliveries(since?: Date): Promise<ErpDeliveryDto[]> {
    const rows = since
      ? await this.run(
          `SELECT * FROM ${this.views.deliveries} WHERE deliveryDate >= @since`,
          { since },
          'getDeliveries',
        )
      : await this.run(`SELECT * FROM ${this.views.deliveries}`, {}, 'getDeliveries');
    return rows.map(mapErpDelivery);
  }

  async getInvoices(customerCode: string, from: Date, to: Date): Promise<ErpInvoiceDto[]> {
    const rows = await this.run(
      `SELECT * FROM ${this.views.invoices} WHERE customerCode = @customerCode AND date >= @from AND date < @to`,
      { customerCode, from, to },
      'getInvoices',
    );
    return rows.map(mapErpInvoice);
  }

  // --- Write (Portal → ERP) ---

  async submitLoadingRequest(
    request: ErpLoadingRequestSubmissionDto,
  ): Promise<{ erpReferenceId: string }> {
    const rows = await this.run(
      `EXEC ${this.procs.submitLoading} ` +
        '@requestNumber=@requestNumber, @customerCode=@customerCode, @productCode=@productCode, ' +
        '@requestedQty=@requestedQty, @vehicleType=@vehicleType, @loadType=@loadType, ' +
        '@requestDate=@requestDate, @destinationCity=@destinationCity, ' +
        '@additionalAddress=@additionalAddress, @destinationPostalCode=@destinationPostalCode, ' +
        '@recipientMobile=@recipientMobile, @carrierName=@carrierName',
      {
        requestNumber: request.requestNumber,
        customerCode: request.customerCode,
        productCode: request.productCode,
        requestedQty: request.requestedQty,
        vehicleType: request.vehicleType,
        loadType: request.loadType,
        requestDate: request.requestDate,
        destinationCity: request.destinationCity,
        additionalAddress: request.additionalAddress ?? null,
        destinationPostalCode: request.destinationPostalCode ?? null,
        recipientMobile: request.recipientMobile,
        carrierName: request.carrierName ?? null,
      },
      'submitLoadingRequest',
    );
    const ref = rows[0]?.['erpReferenceId'];
    if (typeof ref !== 'string' && typeof ref !== 'number') {
      throw new ErpConnectionError(
        KIND,
        'submitLoadingRequest',
        `پروسیجر ${this.procs.submitLoading} ستون erpReferenceId برنگرداند`,
      );
    }
    return { erpReferenceId: String(ref) };
  }

  async syncLoadingStatus(requestNumber: string, status: string, note?: string): Promise<void> {
    await this.run(
      `EXEC ${this.procs.syncStatus} @requestNumber=@requestNumber, @status=@status, @note=@note`,
      { requestNumber, status, note: note ?? null },
      'syncLoadingStatus',
    );
  }

  // --- زیرساخت ---

  private async run(
    sql: string,
    params: Record<string, unknown>,
    operation: string,
  ): Promise<Record<string, unknown>[]> {
    const client = await this.getClient(operation);
    try {
      return await client.query(sql, params);
    } catch (error) {
      throw new ErpConnectionError(KIND, operation, (error as Error).message);
    }
  }

  private getClient(operation: string): Promise<ErpSqlClient> {
    if (!this.clientPromise) {
      this.clientPromise = this.clientFactory().catch((error: Error) => {
        // شکست ساخت Client نباید Cache شود تا تلاش بعدی دوباره وصل شود.
        this.clientPromise = null;
        throw new ErpConnectionError(KIND, operation, error.message);
      });
    }
    return this.clientPromise;
  }

  /**
   * Client پیش‌فرض مبتنی بر درایور `mssql` — بار تنبل تا وقتی این Adapter واقعاً
   * استفاده نشده، نصب درایور لازم نباشد. (پس از انتخاب SQL Server توسط کارخانه:
   * `pnpm add mssql` و تنظیم ERP_SQL_* در .env — بدون تغییر کد.)
   */
  private async createMssqlClient(): Promise<ErpSqlClient> {
    let mssql: {
      connect(cfg: unknown): Promise<{
        request(): {
          input(name: string, value: unknown): void;
          query(sql: string): Promise<{ recordset?: Record<string, unknown>[] }>;
        };
      }>;
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      mssql = require('mssql');
    } catch {
      throw new Error(
        'درایور «mssql» نصب نیست. برای اتصال واقعی SQL Server ابتدا `pnpm add mssql` را اجرا کنید.',
      );
    }
    const pool = await mssql.connect({
      server: this.config.get<string>('ERP_SQL_HOST', ''),
      port: Number(this.config.get<string>('ERP_SQL_PORT', '1433')),
      database: this.config.get<string>('ERP_SQL_DATABASE', ''),
      user: this.config.get<string>('ERP_SQL_USER', ''),
      password: this.config.get<string>('ERP_SQL_PASSWORD', ''),
      options: {
        encrypt: this.config.get<string>('ERP_SQL_ENCRYPT', 'true') !== 'false',
        trustServerCertificate:
          this.config.get<string>('ERP_SQL_TRUST_SERVER_CERT', 'false') === 'true',
      },
    });
    return {
      async query(sql, params = {}): Promise<Record<string, unknown>[]> {
        const request = pool.request();
        for (const [name, value] of Object.entries(params)) {
          request.input(name, value);
        }
        const result = await request.query(sql);
        return result.recordset ?? [];
      },
    };
  }
}
