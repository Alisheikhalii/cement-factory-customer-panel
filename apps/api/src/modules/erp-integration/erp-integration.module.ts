import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ERP_ADAPTER_TOKEN, type ErpAdapter } from './erp-adapter.interface';
import { MockErpAdapter } from './adapters/mock.adapter';
import { SqlServerErpAdapter } from './adapters/sql-server.adapter';
import { RestApiErpAdapter } from './adapters/rest-api.adapter';
import { FileBasedErpAdapter } from './adapters/file-based.adapter';

/**
 * ERP Integration Module — بخش ۱۲ PRD.
 * پیاده‌سازی Adapter بر اساس متغیر محیطی ERP_ADAPTER انتخاب می‌شود؛
 * ماژول‌های کسب‌وکاری فقط ERP_ADAPTER_TOKEN را تزریق می‌کنند، نه کلاس مشخص را.
 *
 * فاز ۶: هر سه Adapter واقعی (sql-server/rest-api/file-based) پیاده‌سازی شده و
 * کاملاً env-driven هستند (ERP_SQL_* / ERP_REST_* / ERP_FILE_*): پس از دریافت
 * اطلاعات اتصال از کارخانه فقط .env تغییر می‌کند، نه کد (بخش ۱۲.۳ و ۲۰.۲).
 * تا آن زمان ERP_ADAPTER=mock می‌ماند؛ اگر Adapter واقعی بدون env کامل انتخاب
 * شود، در بوت با پیام شفافِ متغیرهای گم‌شده fail-fast می‌شود.
 */
const erpAdapterProvider: Provider = {
  provide: ERP_ADAPTER_TOKEN,
  inject: [ConfigService],
  useFactory: (config: ConfigService): ErpAdapter => {
    const kind = config.get<string>('ERP_ADAPTER', 'mock');
    switch (kind) {
      case 'mock':
        return new MockErpAdapter(config);
      case 'sql-server':
        return new SqlServerErpAdapter(config);
      case 'rest-api':
        return new RestApiErpAdapter(config);
      case 'file-based':
        return new FileBasedErpAdapter(config);
      default:
        throw new Error(
          `ERP_ADAPTER پشتیبانی‌نشده: "${kind}". ` +
            'مقادیر مجاز: mock | sql-server | rest-api | file-based.',
        );
    }
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [erpAdapterProvider],
  exports: [ERP_ADAPTER_TOKEN],
})
export class ErpIntegrationModule {}
