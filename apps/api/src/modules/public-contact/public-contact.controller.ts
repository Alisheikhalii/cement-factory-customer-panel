import { Body, Controller, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ContactMessageResponse } from '@cement/shared-types';
import { Public } from '../auth/decorators/public.decorator';
import { ContactMessageDto } from './dto/contact-message.dto';
import { PublicContactService } from './public-contact.service';

/**
 * کنترلر عمومی فرم تماس (بخش ۹.۱۰.۴) — مسیر: /api/v1/public/contact.
 *
 * ⚠️ بدون Auth و بدون Guard (این بخش کاملاً عمومی و مستقل از پورتال است، ۹.۱۰.۱) —
 * با @Public() از JwtAuthGuard سراسری مستثنا می‌شود.
 * دو لایه Rate Limiting: (۱) لایهٔ HTTP با @Throttle سخت‌گیرانه (۳ درخواست در ساعت
 * به‌ازای هر IP، طبق بخش ۱۱ PRD) و (۲) لایهٔ سرویس درون‌حافظه‌ای (CONTACT_001).
 */
@ApiTags('public')
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly service: PublicContactService) {}

  @Public()
  @Throttle({ default: { ttl: 3_600_000, limit: 3 } })
  @Post()
  @ApiOperation({ summary: 'ارسال پیام فرم تماس عمومی (بدون Auth، با Rate Limiting)' })
  submit(
    @Body() body: ContactMessageDto,
    @Ip() ip: string,
  ): Promise<ContactMessageResponse> {
    return this.service.submit(body, ip);
  }
}
