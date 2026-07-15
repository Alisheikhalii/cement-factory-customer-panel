import { AppException } from '../../common/exceptions/app.exception';
import { FinanceService, type UploadedFile } from './finance.service';
import type { FinanceRepository } from './finance.repository';
import type { ExcelService } from '../../common/services/excel.service';
import type { PdfService } from '../../common/services/pdf.service';
import type { FileStorageService } from '../../common/services/file-storage.service';
import type { NotificationService } from '../notifications/notification.service';

/**
 * تست واحد اعتبارسنجی/ذخیرهٔ فیش واریزی (BR-16 + فاز ۷b) با وابستگی‌های ساختگی.
 * اثبات می‌کند: فرمت/حجم مجاز، ذخیره از طریق FileStorageService (نه placeholder)
 * و ثبت URL منطقی storage:// در دیتابیس.
 */
describe('FinanceService — createReceipt', () => {
  function makeService(): {
    service: FinanceService;
    saved: Array<{ prefix: string; name: string }>;
    createdUrls: string[];
  } {
    const saved: Array<{ prefix: string; name: string }> = [];
    const createdUrls: string[] = [];
    const repo = {
      createReceipt: (input: { fileUrl: string }): Promise<unknown> => {
        createdUrls.push(input.fileUrl);
        return Promise.resolve({
          id: 'r1',
          amount: null,
          description: null,
          uploadedAt: new Date('2026-07-14T00:00:00Z'),
          status: 'PENDING',
          reviewNote: null,
        });
      },
      findCustomerName: (): Promise<string> => Promise.resolve('مشتری نمونه'),
    } as unknown as FinanceRepository;
    const storage = {
      save: (prefix: string, name: string): Promise<string> => {
        saved.push({ prefix, name });
        return Promise.resolve(`storage://${prefix}/uuid.png`);
      },
    } as unknown as FileStorageService;
    const notifications = {
      emitReceiptUploaded: (): Promise<void> => Promise.resolve(),
    } as unknown as NotificationService;
    const service = new FinanceService(
      repo,
      {} as ExcelService,
      {} as PdfService,
      storage,
      notifications,
    );
    return { service, saved, createdUrls };
  }

  function file(overrides: Partial<UploadedFile> = {}): UploadedFile {
    return {
      originalname: 'فیش.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('x'),
      ...overrides,
    };
  }

  it('فایل مجاز → از طریق FileStorageService ذخیره و URL منطقی ثبت می‌شود', async () => {
    const { service, saved, createdUrls } = makeService();
    const dto = await service.createReceipt('cust-1', file(), {});
    expect(saved).toEqual([{ prefix: 'receipts/cust-1', name: 'فیش.png' }]);
    expect(createdUrls).toEqual(['storage://receipts/cust-1/uuid.png']);
    expect(createdUrls[0]).not.toContain('pending-storage');
    expect(dto.id).toBe('r1');
  });

  it('بدون فایل → RECEIPT_001', async () => {
    const { service } = makeService();
    await expect(service.createReceipt('cust-1', undefined, {})).rejects.toThrow(AppException);
  });

  it('فرمت غیرمجاز → RECEIPT_001 و چیزی ذخیره نمی‌شود', async () => {
    const { service, saved } = makeService();
    await expect(
      service.createReceipt('cust-1', file({ mimetype: 'application/zip' }), {}),
    ).rejects.toThrow(AppException);
    expect(saved).toHaveLength(0);
  });

  it('حجم بیش از ۵MB → RECEIPT_002', async () => {
    const { service } = makeService();
    await expect(
      service.createReceipt('cust-1', file({ size: 5 * 1024 * 1024 + 1 }), {}),
    ).rejects.toThrow(AppException);
  });
});
