import type {
  ErpCustomerDto,
  ErpDeliveryDto,
  ErpInventoryDto,
  ErpInvoiceDto,
  ErpLoadingRequestSubmissionDto,
  ErpOrderDto,
  ErpProductDto,
} from './dto/erp-dtos';

/**
 * ERP Adapter Interface — بخش ۱۲.۱ PRD.
 * ماژول erp-integration هرگز مستقیماً به یک پیاده‌سازی خاص وابسته نیست؛
 * تزریق فقط از طریق ERP_ADAPTER_TOKEN (instruction.md §2).
 */
export interface ErpAdapter {
  // --- Read (ERP → Portal) ---
  getCustomers(since?: Date): Promise<ErpCustomerDto[]>;
  getOrders(customerCode?: string, since?: Date): Promise<ErpOrderDto[]>;
  getProducts(): Promise<ErpProductDto[]>;
  /** مانده برگ فروش */
  getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto>;
  getDeliveries(since?: Date): Promise<ErpDeliveryDto[]>;
  /** شامل هر ۴ زیرتب مالی */
  getInvoices(customerCode: string, from: Date, to: Date): Promise<ErpInvoiceDto[]>;

  // --- Write (Portal → ERP) ---
  submitLoadingRequest(
    request: ErpLoadingRequestSubmissionDto,
  ): Promise<{ erpReferenceId: string }>;
  syncLoadingStatus(requestNumber: string, status: string, note?: string): Promise<void>;
}

/** DI Token برای تزریق پیاده‌سازی ERP Adapter (instruction.md §2). */
export const ERP_ADAPTER_TOKEN = Symbol('ERP_ADAPTER_TOKEN');
