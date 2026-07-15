import { Module } from '@nestjs/common';
import { LoadingRequestsModule } from '../loading-requests/loading-requests.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRepository } from './orders.repository';

/** ماژول سفارشات (بخش ۱۱.۴) — نمای Read فاز ۲. */
@Module({
  imports: [LoadingRequestsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
})
export class OrdersModule {}
