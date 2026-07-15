import { Module } from '@nestjs/common';
import { PublicContactController } from './public-contact.controller';
import { PublicContactService } from './public-contact.service';

/**
 * ماژول فرم تماس عمومی (بخش ۹.۱۰.۴).
 * MailerService از CommonServicesModule (Global) تزریق می‌شود.
 */
@Module({
  controllers: [PublicContactController],
  providers: [PublicContactService],
})
export class PublicContactModule {}
