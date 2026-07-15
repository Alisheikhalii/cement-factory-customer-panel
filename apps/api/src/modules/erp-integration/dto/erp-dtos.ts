/**
 * DTOهای مرزی ERP (بخش ۱۲.۱ PRD).
 * این‌ها شکل داده‌ای هستند که Adapter از/به ERP رد و بدل می‌کند —
 * جدا از مدل‌های Prisma تا استقلال پورتال از ساختار ERP حفظ شود.
 */

export interface ErpCustomerDto {
  erpCustomerId: string;
  customerCode: string;
  nationalId?: string;
  economicCode?: string;
  name: string;
  address?: string;
  postalCode?: string;
  mobile: string;
  creditLimit?: number;
  creditBalance?: number;
}

export interface ErpOrderDto {
  erpOrderId: string;
  orderNumber: string;
  customerCode: string;
  productCode: string;
  orderDate: string; // ISO
  totalQty: number;
  deliveredQty: number;
  remainingQty: number;
  basePrice: number;
  baseAmount: number;
  deliveredAmount: number;
  vatAmount: number;
  priceWithFactors: number;
  amountWithFactors: number;
  remainingAmount: number;
  status: string;
}

export interface ErpProductDto {
  erpCode: string;
  name: string;
  type: 'BAGGED' | 'BULK';
}

export interface ErpInventoryDto {
  customerCode: string;
  productCode: string;
  /** مانده برگ فروش */
  remainingAllowance: number;
}

export interface ErpDeliveryDto {
  weighingNumber: string;
  loadingRequestNumber: string;
  deliveryDate: string; // ISO
  carrierName?: string;
  vehicleNumber?: string;
  driverName?: string;
  productCode: string;
  deliveredQty: number;
  basePrice: number;
  baseAmount: number;
  vatAmount: number;
  deductions: number;
  amountWithFactors: number;
}

export interface ErpInvoiceDto {
  customerCode: string;
  docNumber: string;
  date: string; // ISO
  operationType: string;
  bankName?: string;
  accountNumber?: string;
  amount: number;
  description?: string;
  dueDate?: string;
  debit?: number;
  credit?: number;
  balance?: number;
  status: string;
  source: 'TRANSACTION' | 'STATEMENT' | 'ASSET_REPORT' | 'STATUS_STATEMENT';
}

export interface ErpLoadingRequestSubmissionDto {
  requestNumber: string;
  customerCode: string;
  productCode: string;
  requestedQty: number;
  vehicleType: string;
  loadType: string;
  requestDate: string; // ISO
  destinationCity: string;
  additionalAddress?: string;
  destinationPostalCode?: string;
  recipientMobile: string;
  carrierName?: string;
}
