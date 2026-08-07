import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AuthUser,
  FinanceAssetReportDto,
  FinanceStatementDto,
  FinanceStatusStatementListData,
  FinanceTransactionListData,
  PaymentReceiptDto,
} from '@cement/shared-types';
import { FEATURE_FLAGS } from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerScopeGuard } from '../auth/guards/customer-scope.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequiresFeature } from '../../common/guards/feature-flag.decorator';
import { requireCustomerId } from '../../common/utils/customer-scope.util';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { sendExcel, sendPdf } from '../../common/http/file-response.util';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { FinanceService, type UploadedFile as MulterFile } from './finance.service';

/**
 * کنترلر مالی (بخش ۱۱.۳) — فقط نقش CUSTOMER.
 *
 * فاز پایلوت: کل کنترلر پشت `FEATURE_FINANCE_ENABLED` است. وقتی خاموش باشد همه
 * مسیرهای /finance/* پاسخ ۴۰۳ با کد FEATURE_DISABLED می‌دهند (نه ۴۰۴). با روشن
 * کردن پرچم، رفتار عیناً به حالت قبل برمی‌گردد.
 */
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(CustomerScopeGuard, FeatureFlagGuard)
@RequiresFeature(FEATURE_FLAGS.FINANCE_ENABLED)
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'تراکنش‌ها (تب پیش‌فرض مالی)' })
  transactions(
    @CurrentUser() user: AuthUser,
    @Query() query: FinanceQueryDto,
  ): Promise<ResponseWithMeta<FinanceTransactionListData>> {
    return this.service.transactions(requireCustomerId(user), query);
  }

  @Get('status-statement')
  @ApiOperation({ summary: 'صورت وضعیت (بدهکار/بستانکار/مانده)' })
  statusStatement(
    @CurrentUser() user: AuthUser,
    @Query() query: FinanceQueryDto,
  ): Promise<ResponseWithMeta<FinanceStatusStatementListData>> {
    return this.service.statusStatement(requireCustomerId(user), query);
  }

  @Get('statements')
  @ApiOperation({ summary: 'لیست صورت‌حساب‌های دوره‌ای' })
  statements(@CurrentUser() user: AuthUser): Promise<FinanceStatementDto[]> {
    return this.service.statements(requireCustomerId(user));
  }

  @Get('statements/:id/pdf')
  @ApiOperation({ summary: 'دانلود/چاپ PDF یک صورت‌حساب' })
  async statementPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.statementPdf(requireCustomerId(user), id);
    sendPdf(res, buffer, `statement-${id}.pdf`);
  }

  @Get('asset-report')
  @ApiOperation({ summary: 'گزارش دارایی (اعتبار/مانده/سقف)' })
  assetReport(@CurrentUser() user: AuthUser): Promise<FinanceAssetReportDto> {
    return this.service.assetReport(requireCustomerId(user));
  }

  @Get('transactions/export/excel')
  @ApiOperation({ summary: 'خروجی Excel تراکنش‌ها' })
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Query() query: FinanceQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.exportTransactionsExcel(requireCustomerId(user), query);
    sendExcel(res, buffer, 'transactions.xlsx');
  }

  @Get('transactions/export/pdf')
  @ApiOperation({ summary: 'خروجی PDF تراکنش‌ها' })
  async exportPdf(
    @CurrentUser() user: AuthUser,
    @Query() query: FinanceQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.exportTransactionsPdf(requireCustomerId(user), query);
    sendPdf(res, buffer, 'transactions.pdf');
  }

  @Get('receipts')
  @ApiOperation({ summary: 'لیست فیش‌های واریزی' })
  listReceipts(@CurrentUser() user: AuthUser): Promise<PaymentReceiptDto[]> {
    return this.service.listReceipts(requireCustomerId(user));
  }

  @Post('receipts')
  @WriteThrottle()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'بارگذاری فیش واریزی (فایل + مبلغ/توضیحات اختیاری)' })
  @UseInterceptors(FileInterceptor('file'))
  createReceipt(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: MulterFile | undefined,
    @Body() dto: CreateReceiptDto,
  ): Promise<PaymentReceiptDto> {
    return this.service.createReceipt(requireCustomerId(user), file, dto);
  }
}
