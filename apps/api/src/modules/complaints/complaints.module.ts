import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { AdminComplaintsController } from './admin-complaints.controller';
import { ComplaintsService } from './complaints.service';
import { AdminComplaintsService } from './admin-complaints.service';
import { ComplaintRepository } from './complaints.repository';

/**
 * ماژول شکایات (فاز ۴ مشتری + فاز ۴.۵ ادمین).
 * State Machine ساده ۸.۲: PENDING → ANSWERED (پایانی).
 * Repository صادر می‌شود تا داشبورد ادمین شمارنده PENDING را بخواند.
 */
@Module({
  controllers: [ComplaintsController, AdminComplaintsController],
  providers: [ComplaintsService, AdminComplaintsService, ComplaintRepository],
  exports: [ComplaintRepository],
})
export class ComplaintsModule {}
