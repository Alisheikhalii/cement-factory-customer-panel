import { Global, Module } from '@nestjs/common';
import { ExcelService } from './services/excel.service';
import { PdfService } from './services/pdf.service';
import { AuditLogService } from './services/audit-log.service';
import { MailerService } from './services/mailer.service';
import { FileStorageService } from './services/file-storage.service';

/**
 * ماژول سرویس‌های مشترک زیرساختی (Export Excel و PDF و AuditLog و Mailer و
 * FileStorage). Global تا همه ماژول‌های دامنه بدون Import تکراری استفاده کنند.
 */
@Global()
@Module({
  providers: [ExcelService, PdfService, AuditLogService, MailerService, FileStorageService],
  exports: [ExcelService, PdfService, AuditLogService, MailerService, FileStorageService],
})
export class CommonServicesModule {}
