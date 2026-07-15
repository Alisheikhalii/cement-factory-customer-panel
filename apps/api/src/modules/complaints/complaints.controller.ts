import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser, ComplaintDto } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ComplaintsService } from './complaints.service';

/**
 * کنترلر شکایات مشتری (بخش ۱۱.۸) — نقش CUSTOMER.
 * مسیر: /api/v1/complaints
 */
@ApiTags('complaints')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست شکایات مشتری' })
  list(@CurrentUser() user: AuthUser): Promise<ComplaintDto[]> {
    return this.service.list(requireCustomerId(user));
  }

  @Post()
  @WriteThrottle()
  @ApiOperation({ summary: 'ثبت شکایت جدید (subject + description، BR-22)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateComplaintDto,
  ): Promise<ComplaintDto> {
    return this.service.create(requireCustomerId(user), body);
  }
}
