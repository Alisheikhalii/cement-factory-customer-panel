import type {
  ErpCustomerDto,
  ErpDeliveryDto,
  ErpInventoryDto,
  ErpInvoiceDto,
  ErpOrderDto,
  ErpProductDto,
} from './erp-dtos';

/**
 * مپر مشترک «رکورد خام → DTO مرزی ERP» (بخش ۱۲.۱ / ۱۲.۳ PRD).
 *
 * هر سه Adapter واقعی (sql-server / rest-api / file-based) دادهٔ خام را به شکل
 * `Record<string, unknown>` تولید می‌کنند (ردیف SQL، آبجکت JSON، رکورد CSV).
 * این ماژول نگاشت و اعتبارسنجی را یک‌جا انجام می‌دهد تا:
 *  ۱) قرارداد ستون/فیلدها فقط در یک نقطه تعریف شود،
 *  ۲) دادهٔ ناقص/خراب ERP با خطای شفاف (نام فیلد + مقدار) رد شود نه رفتار خاموش.
 *
 * قرارداد نام فیلدها = نام فیلدهای DTO (بخش ۱۲.۱). سمت ERP (View/API/CSV) باید
 * خروجی را با همین نام‌ها Alias کند؛ به این ترتیب پس از دریافت اطلاعات اتصال از
 * کارخانه فقط .env تغییر می‌کند، نه کد.
 */

export class ErpMappingError extends Error {
  constructor(context: string, field: string, reason: string) {
    super(`دادهٔ ERP نامعتبر (${context}): فیلد «${field}» ${reason}`);
    this.name = 'ErpMappingError';
  }
}

function raw(rec: Record<string, unknown>, field: string): unknown {
  const value = rec[field];
  // رشتهٔ خالی در CSV یعنی «مقدار ندارد»
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function optStr(rec: Record<string, unknown>, field: string, context: string): string | undefined {
  const value = raw(rec, field);
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  throw new ErpMappingError(context, field, `قابل تبدیل به رشته نیست (نوع: ${typeof value})`);
}

function str(rec: Record<string, unknown>, field: string, context: string): string {
  const value = optStr(rec, field, context);
  if (value === undefined) {
    throw new ErpMappingError(context, field, 'الزامی است اما مقدار ندارد');
  }
  return value;
}

function optNum(rec: Record<string, unknown>, field: string, context: string): number | undefined {
  const value = raw(rec, field);
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    // جداکنندهٔ هزارگان رایج در خروجی‌های مالی حذف می‌شود
    const parsed = Number(value.replace(/[,\s]/g, ''));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new ErpMappingError(context, field, `عدد معتبر نیست (مقدار: ${String(value)})`);
}

function num(rec: Record<string, unknown>, field: string, context: string): number {
  const value = optNum(rec, field, context);
  if (value === undefined) {
    throw new ErpMappingError(context, field, 'الزامی است اما مقدار ندارد');
  }
  return value;
}

/** تاریخ به رشتهٔ ISO — ورودی Date یا رشتهٔ تاریخ معتبر پذیرفته می‌شود. */
function isoDate(rec: Record<string, unknown>, field: string, context: string): string {
  const value = str(rec, field, context);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ErpMappingError(context, field, `تاریخ معتبر نیست (مقدار: ${value})`);
  }
  return parsed.toISOString();
}

function optIsoDate(
  rec: Record<string, unknown>,
  field: string,
  context: string,
): string | undefined {
  const value = raw(rec, field);
  if (value === undefined || value === null) {
    return undefined;
  }
  return isoDate(rec, field, context);
}

export function mapErpCustomer(rec: Record<string, unknown>): ErpCustomerDto {
  const ctx = 'customer';
  return {
    erpCustomerId: str(rec, 'erpCustomerId', ctx),
    customerCode: str(rec, 'customerCode', ctx),
    nationalId: optStr(rec, 'nationalId', ctx),
    economicCode: optStr(rec, 'economicCode', ctx),
    name: str(rec, 'name', ctx),
    address: optStr(rec, 'address', ctx),
    postalCode: optStr(rec, 'postalCode', ctx),
    mobile: str(rec, 'mobile', ctx),
    creditLimit: optNum(rec, 'creditLimit', ctx),
    creditBalance: optNum(rec, 'creditBalance', ctx),
  };
}

export function mapErpOrder(rec: Record<string, unknown>): ErpOrderDto {
  const ctx = 'order';
  return {
    erpOrderId: str(rec, 'erpOrderId', ctx),
    orderNumber: str(rec, 'orderNumber', ctx),
    customerCode: str(rec, 'customerCode', ctx),
    productCode: str(rec, 'productCode', ctx),
    orderDate: isoDate(rec, 'orderDate', ctx),
    totalQty: num(rec, 'totalQty', ctx),
    deliveredQty: num(rec, 'deliveredQty', ctx),
    remainingQty: num(rec, 'remainingQty', ctx),
    basePrice: num(rec, 'basePrice', ctx),
    baseAmount: num(rec, 'baseAmount', ctx),
    deliveredAmount: num(rec, 'deliveredAmount', ctx),
    vatAmount: num(rec, 'vatAmount', ctx),
    priceWithFactors: num(rec, 'priceWithFactors', ctx),
    amountWithFactors: num(rec, 'amountWithFactors', ctx),
    remainingAmount: num(rec, 'remainingAmount', ctx),
    status: str(rec, 'status', ctx),
  };
}

export function mapErpProduct(rec: Record<string, unknown>): ErpProductDto {
  const ctx = 'product';
  const type = str(rec, 'type', ctx).toUpperCase();
  if (type === 'BAGGED' || type === 'BULK') {
    return {
      erpCode: str(rec, 'erpCode', ctx),
      name: str(rec, 'name', ctx),
      type,
    };
  }
  throw new ErpMappingError(ctx, 'type', `باید BAGGED یا BULK باشد (مقدار: ${type})`);
}

export function mapErpInventory(rec: Record<string, unknown>): ErpInventoryDto {
  const ctx = 'inventory';
  return {
    customerCode: str(rec, 'customerCode', ctx),
    productCode: str(rec, 'productCode', ctx),
    remainingAllowance: num(rec, 'remainingAllowance', ctx),
  };
}

export function mapErpDelivery(rec: Record<string, unknown>): ErpDeliveryDto {
  const ctx = 'delivery';
  return {
    weighingNumber: str(rec, 'weighingNumber', ctx),
    loadingRequestNumber: str(rec, 'loadingRequestNumber', ctx),
    deliveryDate: isoDate(rec, 'deliveryDate', ctx),
    carrierName: optStr(rec, 'carrierName', ctx),
    vehicleNumber: optStr(rec, 'vehicleNumber', ctx),
    driverName: optStr(rec, 'driverName', ctx),
    productCode: str(rec, 'productCode', ctx),
    deliveredQty: num(rec, 'deliveredQty', ctx),
    basePrice: num(rec, 'basePrice', ctx),
    baseAmount: num(rec, 'baseAmount', ctx),
    vatAmount: num(rec, 'vatAmount', ctx),
    deductions: num(rec, 'deductions', ctx),
    amountWithFactors: num(rec, 'amountWithFactors', ctx),
  };
}

const INVOICE_SOURCES = ['TRANSACTION', 'STATEMENT', 'ASSET_REPORT', 'STATUS_STATEMENT'] as const;

export function mapErpInvoice(rec: Record<string, unknown>): ErpInvoiceDto {
  const ctx = 'invoice';
  const source = str(rec, 'source', ctx).toUpperCase();
  if (!(INVOICE_SOURCES as readonly string[]).includes(source)) {
    throw new ErpMappingError(
      ctx,
      'source',
      `باید یکی از ${INVOICE_SOURCES.join(' | ')} باشد (مقدار: ${source})`,
    );
  }
  return {
    customerCode: str(rec, 'customerCode', ctx),
    docNumber: str(rec, 'docNumber', ctx),
    date: isoDate(rec, 'date', ctx),
    operationType: str(rec, 'operationType', ctx),
    bankName: optStr(rec, 'bankName', ctx),
    accountNumber: optStr(rec, 'accountNumber', ctx),
    amount: num(rec, 'amount', ctx),
    description: optStr(rec, 'description', ctx),
    dueDate: optIsoDate(rec, 'dueDate', ctx),
    debit: optNum(rec, 'debit', ctx),
    credit: optNum(rec, 'credit', ctx),
    balance: optNum(rec, 'balance', ctx),
    status: str(rec, 'status', ctx),
    source: source as ErpInvoiceDto['source'],
  };
}
