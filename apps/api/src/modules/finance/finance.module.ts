import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceRepository } from './finance.repository';

/** ماژول مالی (بخش ۱۱.۳) — تراکنش‌ها/صورت وضعیت/صورت‌حساب/گزارش دارایی/فیش واریزی. */
@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FinanceRepository],
})
export class FinanceModule {}
