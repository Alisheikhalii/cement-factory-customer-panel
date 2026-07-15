import { Module } from '@nestjs/common';
import { LoadingRequestsController } from './loading-requests.controller';
import { AdminLoadingRequestsController } from './admin-loading-requests.controller';
import { LoadingRequestService } from './loading-requests.service';
import { LoadingRequestRepository } from './loading-requests.repository';
import { LoadingRequestStateMachine } from './loading-request.state-machine';

/**
 * ماژول اعلام بار.
 * فاز ۲: نمای Read؛ فاز ۳: ثبت/لغو مشتری + تایید/رد/بارگیری ادمین با State Machine.
 * سرویس صادر می‌شود تا ماژول سفارشات (Drawer جزئیات) از آن استفاده کند.
 */
@Module({
  controllers: [LoadingRequestsController, AdminLoadingRequestsController],
  providers: [
    LoadingRequestService,
    LoadingRequestRepository,
    LoadingRequestStateMachine,
  ],
  exports: [LoadingRequestService],
})
export class LoadingRequestsModule {}
