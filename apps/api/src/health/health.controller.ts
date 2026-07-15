import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ERP_ADAPTER_TOKEN,
  type ErpAdapter,
} from '../modules/erp-integration/erp-adapter.interface';
import { Public } from '../modules/auth/decorators/public.decorator';

/**
 * Health Check — بخش ۱۳ PRD (رصدپذیری).
 * تایید بالا بودن سرویس و دسترسی به ERP Adapter.
 * عمومی است (بدون JWT) تا ابزارهای رصد بتوانند بدون احراز هویت آن را صدا بزنند.
 * خروجی خام برمی‌گرداند؛ TransformInterceptor آن را در { success, data } می‌پیچد.
 */
@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(ERP_ADAPTER_TOKEN) private readonly erp: ErpAdapter) {}

  @Get()
  @ApiOperation({ summary: 'وضعیت سلامت سرویس' })
  check(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('erp')
  @ApiOperation({ summary: 'تست اتصال ERP Adapter (تعداد محصولات)' })
  async erpCheck(): Promise<{ adapter: string; productCount: number }> {
    const products = await this.erp.getProducts();
    return {
      adapter: process.env.ERP_ADAPTER ?? 'mock',
      productCount: products.length,
    };
  }
}
