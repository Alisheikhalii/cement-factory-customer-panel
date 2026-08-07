import { Injectable } from '@nestjs/common';
import type {
  DeliveryDto,
  DeliveryGroupData,
  DeliveryListData,
} from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination } from '../../common/dto/pagination.dto';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { ExcelService } from '../../common/services/excel.service';
import { PdfService } from '../../common/services/pdf.service';
import type { DeliveryQueryDto } from './dto/delivery-query.dto';
import { DeliveryFilter, DeliveryRepository } from './deliveries.repository';
import {
  buildDeliverySumRow,
  groupDeliveries,
  toDeliveryDto,
} from './deliveries.mapper';
import { renderDeliveryPdfHtml } from './deliveries.pdf-template';

/**
 * سرویس تحویل (بخش ۹.۶ / ۱۱.۶) — فقط خواندنی.
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲)؛ Scope تحویل از رابطه loadingRequest.
 */
@Injectable()
export class DeliveriesService {
  constructor(
    private readonly repo: DeliveryRepository,
    private readonly excel: ExcelService,
    private readonly pdf: PdfService,
  ) {}

  private buildFilter(customerId: string, query: DeliveryQueryDto): DeliveryFilter {
    return {
      customerId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }

  async list(
    customerId: string,
    query: DeliveryQueryDto,
  ): Promise<ResponseWithMeta<DeliveryListData | DeliveryGroupData>> {
    const filter = this.buildFilter(customerId, query);
    const view = query.view ?? 'detail';

    if (view === 'by-product' || view === 'by-date') {
      // نماهای سرجمع روی کل مجموعه محاسبه می‌شوند، نه فقط یک صفحه.
      const [all, sums] = await Promise.all([
        this.repo.findAll(filter),
        this.repo.aggregateSums(filter),
      ]);
      const groups = groupDeliveries(all, view);
      const data: DeliveryGroupData = {
        rows: groups,
        sumRow: buildDeliverySumRow(sums),
      };
      return new ResponseWithMeta(data, buildMeta(1, groups.length, groups.length));
    }

    const { page, pageSize, skip, take } = resolvePagination(query);
    const [{ rows, total }, sums] = await Promise.all([
      this.repo.findPage(filter, skip, take),
      this.repo.aggregateSums(filter),
    ]);
    const data: DeliveryListData = {
      rows: rows.map(toDeliveryDto),
      sumRow: buildDeliverySumRow(sums),
    };
    return new ResponseWithMeta(data, buildMeta(page, pageSize, total));
  }

  async detail(customerId: string, id: string): Promise<DeliveryDto> {
    const row = await this.repo.findById(customerId, id);
    if (!row) {
      throw new AppException('ORDER_001', 'رکورد تحویل یافت نشد');
    }
    return toDeliveryDto(row);
  }

  async exportExcel(customerId: string, query: DeliveryQueryDto): Promise<Buffer> {
    const filter = this.buildFilter(customerId, query);
    const [rows, sums] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateSums(filter),
    ]);
    const dtos = rows.map(toDeliveryDto);
    const sumRow = buildDeliverySumRow(sums);

    return this.excel.build({
      sheetName: 'تحویل',
      title: 'گزارش تحویل',
      columns: [
        { header: 'شماره توزین', key: 'weighingNumber' },
        { header: 'اعلام بار', key: 'loadingRequestNumber' },
        { header: 'تاریخ', key: 'deliveryDate' },
        { header: 'باربری', key: 'carrierName', width: 20 },
        { header: 'شماره ماشین', key: 'vehicleNumber' },
        { header: 'راننده', key: 'driverName', width: 18 },
        { header: 'موبایل راننده', key: 'driverMobile', width: 16 },
        { header: 'محصول', key: 'productName', width: 26 },
        { header: 'تحویل', key: 'deliveredQty', numeric: true },
        { header: 'مبلغ پایه', key: 'baseAmount', numeric: true, width: 18 },
        { header: 'ارزش‌افزوده', key: 'vatAmount', numeric: true, width: 16 },
        { header: 'کسورات', key: 'deductions', numeric: true },
        { header: 'مبلغ با عوامل', key: 'amountWithFactors', numeric: true, width: 20 },
      ],
      rows: dtos.map((d) => ({
        weighingNumber: d.weighingNumber,
        loadingRequestNumber: d.loadingRequestNumber ?? '',
        deliveryDate: d.deliveryDate.slice(0, 10),
        carrierName: d.carrierName ?? '',
        vehicleNumber: d.vehicleNumber ?? '',
        driverName: d.driverName ?? '',
        driverMobile: d.driverMobile ?? '',
        productName: d.productName,
        deliveredQty: d.deliveredQty,
        baseAmount: d.baseAmount,
        vatAmount: d.vatAmount,
        deductions: d.deductions,
        amountWithFactors: d.amountWithFactors,
      })),
      sumRow: {
        deliveredQty: sumRow.deliveredQty,
        baseAmount: sumRow.baseAmount,
        vatAmount: sumRow.vatAmount,
        deductions: sumRow.deductions,
        amountWithFactors: sumRow.amountWithFactors,
      },
    });
  }

  async printPdf(customerId: string, query: DeliveryQueryDto): Promise<Buffer> {
    const filter = this.buildFilter(customerId, query);
    const [rows, sums] = await Promise.all([
      this.repo.findAll(filter),
      this.repo.aggregateSums(filter),
    ]);
    const html = renderDeliveryPdfHtml({
      rows: rows.map(toDeliveryDto),
      sumRow: buildDeliverySumRow(sums),
      from: query.from ?? null,
      to: query.to ?? null,
    });
    return this.pdf.renderHtml(html);
  }
}
