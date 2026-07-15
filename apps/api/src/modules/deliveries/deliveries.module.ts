import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryRepository } from './deliveries.repository';

/** ماژول تحویل (بخش ۱۱.۶) — نمای Read + Export/PDF فاز ۲. */
@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService, DeliveryRepository],
})
export class DeliveriesModule {}
