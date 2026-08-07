import { Global, Module } from '@nestjs/common';
import { ExcelService } from './services/excel.service';
import { PdfService } from './services/pdf.service';
import { AuditLogService } from './services/audit-log.service';
import { MailerService } from './services/mailer.service';
import { FileStorageService } from './services/file-storage.service';
import { FeatureFlagsService } from './services/feature-flags.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';

/**
 * ماژول سرویس‌های مشترک زیرساختی (Export Excel و PDF و AuditLog و Mailer و
 * FileStorage و FeatureFlags). Global تا همه ماژول‌های دامنه بدون Import تکراری
 * استفاده کنند.
 */
@Global()
@Module({
  providers: [
    ExcelService,
    PdfService,
    AuditLogService,
    MailerService,
    FileStorageService,
    FeatureFlagsService,
    FeatureFlagGuard,
  ],
  exports: [
    ExcelService,
    PdfService,
    AuditLogService,
    MailerService,
    FileStorageService,
    FeatureFlagsService,
    FeatureFlagGuard,
  ],
})
export class CommonServicesModule {}
