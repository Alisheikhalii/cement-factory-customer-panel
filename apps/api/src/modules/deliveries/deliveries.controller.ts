import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AuthUser,
  DeliveryDto,
  DeliveryGroupData,
  DeliveryListData,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { sendExcel, sendPdf } from '../../common/http/file-response.util';
import { DeliveryQueryDto } from './dto/delivery-query.dto';
import { DeliveriesService } from './deliveries.service';

/** کنترلر تحویل (بخش ۱۱.۶) — فقط نقش CUSTOMER. */
@ApiTags('deliveries')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  @Get()
  @ApiOperation({ summary: 'لیست تحویل‌ها (ریز/سرجمع محصول/سرجمع تاریخ)' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: DeliveryQueryDto,
  ): Promise<ResponseWithMeta<DeliveryListData | DeliveryGroupData>> {
    return this.service.list(requireCustomerId(user), query);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'خروجی Excel تحویل' })
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Query() query: DeliveryQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.exportExcel(requireCustomerId(user), query);
    sendExcel(res, buffer, 'deliveries.xlsx');
  }

  @Get('print/pdf')
  @ApiOperation({ summary: 'چاپ گزارش تحویل به‌صورت PDF واقعی (بخش ۹.۶)' })
  async printPdf(
    @CurrentUser() user: AuthUser,
    @Query() query: DeliveryQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.printPdf(requireCustomerId(user), query);
    sendPdf(res, buffer, 'deliveries.pdf');
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک رکورد تحویل' })
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<DeliveryDto> {
    return this.service.detail(requireCustomerId(user), id);
  }
}
