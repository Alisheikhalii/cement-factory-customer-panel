import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { SurveysModule } from '../surveys/surveys.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardRepository } from './admin-dashboard.repository';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from './admin-customers.service';
import { AdminCustomerRepository } from './admin-customer.repository';

/**
 * ماژول داشبورد ادمین/Command Center (فاز ۴.۵، بخش ۹.۹ / ۱۱.۱۰).
 * - داشبورد: KPIها، فید فعالیت، دو نمودار روند (۹.۹.۱).
 * - مشتریان: ایجاد/ویرایش/فعال‌سازی/بازنشانی رمز (۹.۹.۲، BR-26/BR-28).
 *
 * وابستگی‌ها:
 * - AuthModule → PasswordService (هش رمز موقت مشتری).
 * - ComplaintsModule/SurveysModule → Repository برای KPI شکایت/نظرسنجی.
 * - Notification/AuditLog از ماژول‌های Global تزریق می‌شوند.
 *
 * سایر مسیرهای /admin/* (کارتابل اعلام بار، شکایات، نظرسنجی، ورود) در ماژول‌های
 * دامنه خودشان تعریف شده‌اند تا سرویس دامنه دوباره‌کاری نشود (SRP).
 */
@Module({
  imports: [AuthModule, ComplaintsModule, SurveysModule],
  controllers: [AdminDashboardController, AdminCustomersController],
  providers: [
    AdminDashboardService,
    AdminDashboardRepository,
    AdminCustomersService,
    AdminCustomerRepository,
  ],
})
export class AdminModule {}
