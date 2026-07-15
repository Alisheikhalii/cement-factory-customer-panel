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
 * پورت حداقلی HTTP — Adapter فقط به این وابسته است؛ پیش‌فرض همان `fetch` سراسری
 * Node ≥ 18 است و تست‌ها یک نمونهٔ ساختگی تزریق می‌کنند (بدون شبکهٔ واقعی).
 */
export type ErpHttpFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const KIND = 'rest-api';

/**
 * Adapter اتصال به ERP از طریق سرویس REST میانی (بخش ۱۲.۳ PRD).
 *
 * قرارداد داده: سرویس واسط برای هر موجودیت یک Endpoint با خروجی JSON آرایه‌ای از
 * آبجکت‌هایی هم‌نام فیلدهای DTO مرزی (بخش ۱۲.۱) ارائه می‌کند. Base URL، کلید API و
 * مسیر هر Endpoint همه از env می‌آیند (ERP_REST_*) — پس از دریافت مشخصات واقعی از
 * کارخانه فقط .env تغییر می‌کند، نه کد.
 */
@Injectable()
export class RestApiErpAdapter implements ErpAdapter {
  private readonly logger = new Logger(RestApiErpAdapter.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly paths: Record<
    | 'customers'
    | 'orders'
    | 'products'
    | 'inventory'
    | 'deliveries'
    | 'invoices'
    | 'loadingRequests'
    | 'loadingStatus',
    string
  >;
  private readonly fetchImpl: ErpHttpFetch;

  constructor(config: ConfigService, fetchImpl?: ErpHttpFetch) {
    const required = requireEnv(config, KIND, ['ERP_REST_BASE_URL', 'ERP_REST_API_KEY']);
    // اسلش انتهایی حذف می‌شود تا اتصال مسیرها یکدست باشد.
    this.baseUrl = (required['ERP_REST_BASE_URL'] ?? '').replace(/\/+$/, '');
    this.apiKey = required['ERP_REST_API_KEY'] ?? '';
    this.timeoutMs = Number(config.get<string>('ERP_REST_TIMEOUT_MS', '15000'));
    this.paths = {
      customers: config.get<string>('ERP_REST_PATH_CUSTOMERS', '/customers'),
      orders: config.get<string>('ERP_REST_PATH_ORDERS', '/orders'),
      products: config.get<string>('ERP_REST_PATH_PRODUCTS', '/products'),
      inventory: config.get<string>('ERP_REST_PATH_INVENTORY', '/inventory'),
      deliveries: config.get<string>('ERP_REST_PATH_DELIVERIES', '/deliveries'),
      invoices: config.get<string>('ERP_REST_PATH_INVOICES', '/invoices'),
      loadingRequests: config.get<string>('ERP_REST_PATH_LOADING_REQUESTS', '/loading-requests'),
      loadingStatus: config.get<string>('ERP_REST_PATH_LOADING_STATUS', '/loading-status'),
    };
    this.fetchImpl = fetchImpl ?? (fetch as unknown as ErpHttpFetch);
    this.logger.log(`RestApiErpAdapter فعال شد (ERP_ADAPTER=${KIND})`);
  }

  // --- Read (ERP → Portal) ---

  async getCustomers(since?: Date): Promise<ErpCustomerDto[]> {
    const rows = await this.getList(this.paths.customers, 'getCustomers', {
      since: since?.toISOString(),
    });
    return rows.map(mapErpCustomer);
  }

  async getOrders(customerCode?: string, since?: Date): Promise<ErpOrderDto[]> {
    const rows = await this.getList(this.paths.orders, 'getOrders', {
      customerCode,
      since: since?.toISOString(),
    });
    return rows.map(mapErpOrder);
  }

  async getProducts(): Promise<ErpProductDto[]> {
    const rows = await this.getList(this.paths.products, 'getProducts', {});
    return rows.map(mapErpProduct);
  }

  async getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto> {
    const body = await this.request('GET', this.paths.inventory, 'getInventory', undefined, {
      customerCode,
      productCode,
    });
    // هم آبجکت تکی و هم آرایهٔ تک‌عضوی پذیرفته می‌شود؛ نبودِ داده = ماندهٔ صفر.
    const rec = Array.isArray(body) ? body[0] : body;
    if (rec === null || rec === undefined) {
      return { customerCode, productCode, remainingAllowance: 0 };
    }
    return mapErpInventory(rec as Record<string, unknown>);
  }

  async getDeliveries(since?: Date): Promise<ErpDeliveryDto[]> {
    const rows = await this.getList(this.paths.deliveries, 'getDeliveries', {
      since: since?.toISOString(),
    });
    return rows.map(mapErpDelivery);
  }

  async getInvoices(customerCode: string, from: Date, to: Date): Promise<ErpInvoiceDto[]> {
    const rows = await this.getList(this.paths.invoices, 'getInvoices', {
      customerCode,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return rows.map(mapErpInvoice);
  }

  // --- Write (Portal → ERP) ---

  async submitLoadingRequest(
    request: ErpLoadingRequestSubmissionDto,
  ): Promise<{ erpReferenceId: string }> {
    const body = await this.request(
      'POST',
      this.paths.loadingRequests,
      'submitLoadingRequest',
      request,
    );
    const ref = (body as Record<string, unknown> | null)?.['erpReferenceId'];
    if (typeof ref !== 'string' && typeof ref !== 'number') {
      throw new ErpConnectionError(
        KIND,
        'submitLoadingRequest',
        'پاسخ سرویس واسط فیلد erpReferenceId ندارد',
      );
    }
    return { erpReferenceId: String(ref) };
  }

  async syncLoadingStatus(requestNumber: string, status: string, note?: string): Promise<void> {
    await this.request('POST', this.paths.loadingStatus, 'syncLoadingStatus', {
      requestNumber,
      status,
      note,
    });
  }

  // --- زیرساخت ---

  private async getList(
    path: string,
    operation: string,
    query: Record<string, string | undefined>,
  ): Promise<Record<string, unknown>[]> {
    const body = await this.request('GET', path, operation, undefined, query);
    if (body === null || body === undefined) {
      return [];
    }
    // هم آرایهٔ خام و هم پاکت {data: [...]} پذیرفته می‌شود.
    const list = Array.isArray(body) ? body : (body as Record<string, unknown>)['data'];
    if (!Array.isArray(list)) {
      throw new ErpConnectionError(KIND, operation, `پاسخ ${path} آرایه (یا {data: []}) نیست`);
    }
    return list as Record<string, unknown>[];
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    operation: string,
    body?: unknown,
    query?: Record<string, string | undefined>,
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ErpConnectionError(KIND, operation, `HTTP ${response.status} از ${path}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ErpConnectionError) {
        throw error;
      }
      const detail =
        (error as Error).name === 'AbortError'
          ? `Timeout پس از ${this.timeoutMs}ms`
          : (error as Error).message;
      throw new ErpConnectionError(KIND, operation, detail);
    } finally {
      clearTimeout(timer);
    }
  }
}
