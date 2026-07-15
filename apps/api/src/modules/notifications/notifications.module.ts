import { Global, Module } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationQueryService } from './notification-query.service';
import { NotificationsController } from './notifications.controller';
import { AdminNotificationsController } from './admin-notifications.controller';

/**
 * ماژول اعلانات (بخش ۱۷). Global است تا هر ماژول کسب‌وکاری بدون Import مکرر
 * بتواند `NotificationService.emit...` را صدا بزند.
 * کنترلرها (خواندن مشتری/ادمین، بخش ۱۱.۹) اینجا ثبت می‌شوند.
 */
@Global()
@Module({
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationRepository, NotificationService, NotificationQueryService],
  exports: [NotificationService],
})
export class NotificationsModule {}
