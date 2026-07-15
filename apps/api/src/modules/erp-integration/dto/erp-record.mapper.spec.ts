import {
  ErpMappingError,
  mapErpCustomer,
  mapErpDelivery,
  mapErpInventory,
  mapErpInvoice,
  mapErpOrder,
  mapErpProduct,
} from './erp-record.mapper';

/**
 * تست مپر مشترک «رکورد خام → DTO مرزی» (بخش ۱۲.۱ / ۱۸ PRD).
 * دادهٔ خام هر سه منبع (SQL/REST/CSV) از همین مسیر می‌گذرد؛ پس درستی نگاشت و
 * fail-fast بودن دادهٔ خراب اینجا یک‌جا اثبات می‌شود.
 */
describe('erp-record.mapper', () => {
  describe('mapErpProduct', () => {
    it('رکورد سالم را نگاشت می‌کند و type را نرمال می‌کند', () => {
      expect(
        mapErpProduct({ erpCode: '2001240001', name: 'سیمان پاکتی', type: 'bagged' }),
      ).toEqual({ erpCode: '2001240001', name: 'سیمان پاکتی', type: 'BAGGED' });
    });

    it('type نامعتبر → ErpMappingError با نام فیلد', () => {
      expect(() => mapErpProduct({ erpCode: 'X', name: 'Y', type: 'POWDER' })).toThrow(
        ErpMappingError,
      );
      expect(() => mapErpProduct({ erpCode: 'X', name: 'Y', type: 'POWDER' })).toThrow('type');
    });

    it('فیلد الزامی غایب → خطا با نام فیلد', () => {
      expect(() => mapErpProduct({ name: 'Y', type: 'BULK' })).toThrow('erpCode');
    });
  });

  describe('mapErpCustomer', () => {
    it('رشتهٔ خالی CSV = مقدار ندارد (اختیاری → undefined، الزامی → خطا)', () => {
      const customer = mapErpCustomer({
        erpCustomerId: 'E1',
        customerCode: 'C1',
        name: 'مشتری',
        mobile: '09120000000',
        nationalId: '',
        creditLimit: '1,000,000',
      });
      expect(customer.nationalId).toBeUndefined();
      expect(customer.creditLimit).toBe(1000000);
      expect(() =>
        mapErpCustomer({ erpCustomerId: 'E1', customerCode: '', name: 'م', mobile: '0912' }),
      ).toThrow('customerCode');
    });
  });

  describe('mapErpOrder', () => {
    const base = {
      erpOrderId: 'O1',
      orderNumber: 'ORD-1',
      customerCode: 'C1',
      productCode: 'P1',
      orderDate: '2026-07-01T00:00:00.000Z',
      totalQty: '100',
      deliveredQty: 40,
      remainingQty: 60,
      basePrice: 1000,
      baseAmount: 100000,
      deliveredAmount: 40000,
      vatAmount: 9000,
      priceWithFactors: 1090,
      amountWithFactors: 109000,
      remainingAmount: 65400,
      status: 'OPEN',
    };

    it('اعداد رشته‌ای (خروجی CSV) به number تبدیل می‌شوند', () => {
      const order = mapErpOrder(base);
      expect(order.totalQty).toBe(100);
      expect(order.orderDate).toBe('2026-07-01T00:00:00.000Z');
    });

    it('تاریخ خراب → خطا با نام فیلد', () => {
      expect(() => mapErpOrder({ ...base, orderDate: 'نامعتبر' })).toThrow('orderDate');
    });

    it('عدد خراب → خطا با نام فیلد و مقدار', () => {
      expect(() => mapErpOrder({ ...base, totalQty: 'abc' })).toThrow('totalQty');
    });
  });

  describe('mapErpInventory', () => {
    it('remainingAllowance الزامی است', () => {
      expect(() => mapErpInventory({ customerCode: 'C1', productCode: 'P1' })).toThrow(
        'remainingAllowance',
      );
    });
  });

  describe('mapErpDelivery', () => {
    it('فیلدهای اختیاری غایب مجازند', () => {
      const delivery = mapErpDelivery({
        weighingNumber: 'W1',
        loadingRequestNumber: 'LR-1',
        deliveryDate: '2026-07-10',
        productCode: 'P1',
        deliveredQty: 25,
        basePrice: 1000,
        baseAmount: 25000,
        vatAmount: 2250,
        deductions: 0,
        amountWithFactors: 27250,
      });
      expect(delivery.carrierName).toBeUndefined();
      expect(delivery.deliveryDate).toBe(new Date('2026-07-10').toISOString());
    });
  });

  describe('mapErpInvoice', () => {
    const base = {
      customerCode: 'C1',
      docNumber: 'D1',
      date: '2026-07-01',
      operationType: 'واریز',
      amount: 5000,
      status: 'CONFIRMED',
      source: 'transaction',
    };

    it('source نرمال و اعتبارسنجی می‌شود', () => {
      expect(mapErpInvoice(base).source).toBe('TRANSACTION');
      expect(() => mapErpInvoice({ ...base, source: 'LEDGER' })).toThrow('source');
    });

    it('dueDate اختیاریِ حاضر باید تاریخ معتبر باشد', () => {
      expect(mapErpInvoice({ ...base, dueDate: '2026-08-01' }).dueDate).toBe(
        new Date('2026-08-01').toISOString(),
      );
      expect(() => mapErpInvoice({ ...base, dueDate: 'خراب' })).toThrow('dueDate');
    });
  });
});
