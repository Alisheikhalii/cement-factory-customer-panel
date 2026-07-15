import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

/**
 * MockErpAdapter — پیاده‌سازی پیش‌فرض فاز ۱ (بخش ۱۲.۲ PRD).
 * تمام متدهای ErpAdapter را با داده درون‌حافظه‌ای پیاده می‌کند و تاخیر مصنوعی
 * (۲۰۰-۵۰۰ms قابل تنظیم در .env) اعمال می‌کند تا Loading State های UI واقعی‌تر تست شوند.
 *
 * ⚠️ داده کامل و حجیم Seed (بخش ۱۹) در فاز ۲ به دیتابیس محلی افزوده می‌شود؛
 * این مجموعه فقط برای اثبات کارکرد Adapter در فاز ۰ است.
 */
@Injectable()
export class MockErpAdapter implements ErpAdapter {
  private readonly logger = new Logger(MockErpAdapter.name);
  private readonly latencyMin: number;
  private readonly latencyMax: number;

  // محصولات پایه طبق بخش ۱۹.۳ PRD
  private readonly products: ErpProductDto[] = [
    { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲ داخلی', type: 'BAGGED' },
    { erpCode: '2001240002', name: 'سیمان پاکتی تیپ ۲-۴۲۵ داخلی', type: 'BAGGED' },
    { erpCode: '2001240004', name: 'سیمان فله تیپ ۲-۴۲۵ داخلی', type: 'BULK' },
    { erpCode: '2001240005', name: 'سیمان فله پوزولانی داخلی', type: 'BULK' },
  ];

  private readonly submittedRequests = new Map<string, ErpLoadingRequestSubmissionDto>();

  constructor(config: ConfigService) {
    this.latencyMin = config.get<number>('ERP_MOCK_LATENCY_MIN', 200);
    this.latencyMax = config.get<number>('ERP_MOCK_LATENCY_MAX', 500);
    this.logger.log('MockErpAdapter فعال شد (ERP_ADAPTER=mock)');
  }

  async getCustomers(): Promise<ErpCustomerDto[]> {
    await this.simulateLatency();
    return [];
  }

  async getOrders(): Promise<ErpOrderDto[]> {
    await this.simulateLatency();
    return [];
  }

  async getProducts(): Promise<ErpProductDto[]> {
    await this.simulateLatency();
    return [...this.products];
  }

  async getInventory(customerCode: string, productCode: string): Promise<ErpInventoryDto> {
    await this.simulateLatency();
    return { customerCode, productCode, remainingAllowance: 0 };
  }

  async getDeliveries(): Promise<ErpDeliveryDto[]> {
    await this.simulateLatency();
    return [];
  }

  async getInvoices(): Promise<ErpInvoiceDto[]> {
    await this.simulateLatency();
    return [];
  }

  async submitLoadingRequest(
    request: ErpLoadingRequestSubmissionDto,
  ): Promise<{ erpReferenceId: string }> {
    await this.simulateLatency();
    this.submittedRequests.set(request.requestNumber, request);
    // شبیه‌سازی ثبت محلی بدون تماس خارجی واقعی
    return { erpReferenceId: `MOCK-${request.requestNumber}` };
  }

  async syncLoadingStatus(requestNumber: string, status: string): Promise<void> {
    await this.simulateLatency();
    this.logger.debug(`syncLoadingStatus(mock): ${requestNumber} → ${status}`);
  }

  /** تاخیر تصادفی بین min و max برای شبیه‌سازی شبکه ERP واقعی. */
  private simulateLatency(): Promise<void> {
    const span = Math.max(0, this.latencyMax - this.latencyMin);
    const delay = this.latencyMin + Math.floor(Math.random() * (span + 1));
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }
}
