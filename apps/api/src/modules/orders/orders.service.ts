import { Injectable } from '@nestjs/common';
import type { LoadingRequestListData, OrderDto, OrderListData } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { resolvePagination } from '../../common/dto/pagination.dto';
import { buildMeta, ResponseWithMeta } from '../../common/http/response-with-meta';
import { ExcelService } from '../../common/services/excel.service';
import { LoadingRequestService } from '../loading-requests/loading-requests.service';
import type { OrderQueryDto } from './dto/order-query.dto';
import { OrderFilter, OrderRepository } from './orders.repository';
import { buildOrderSumRow, toOrderDto } from './orders.mapper';

/**
 * سرویس سفارشات (بخش ۹.۴ / ۱۱.۴) — فقط خواندنی در فاز ۲.
 * ⚠️ customerId همیشه از JWT می‌آید (پارامتر متد)، هرگز از Query/Body (بخش ۶.۲).
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly excel: ExcelService,
    private readonly loadingRequests: LoadingRequestService,
  ) {}

  private buildFilter(customerId: string, query: OrderQueryDto): OrderFilter {
    return {
      customerId,
      status: query.status,
      hasRemaining: query.hasRemaining === 'true',
    };
  }

  async list(customerId: string, query: OrderQueryDto): Promise<ResponseWithMeta<OrderListData>> {
    const filter = this.buildFilter(customerId, query);
    const { page, pageSize, skip, take } = resolvePagination(query);

    const [{ rows, total }, sums] = await Promise.all([
      this.orders.findPage(filter, skip, take),
      this.orders.aggregateSums(filter),
    ]);

    const data: OrderListData = {
      rows: rows.map(toOrderDto),
      sumRow: buildOrderSumRow(sums),
    };
    return new ResponseWithMeta(data, buildMeta(page, pageSize, total));
  }

  async detail(customerId: string, id: string): Promise<OrderDto> {
    const order = await this.orders.findById(customerId, id);
    if (!order) {
      throw new AppException('ORDER_001');
    }
    return toOrderDto(order);
  }

  /** اعلام‌بارهای ثبت‌شده روی یک سفارش (نقطه ورود Drawer بخش ۹.۴). */
  async loadingRequestsOf(customerId: string, orderId: string): Promise<LoadingRequestListData> {
    // اطمینان از تعلق سفارش به همین مشتری قبل از افشای اعلام‌بارها
    await this.detail(customerId, orderId);
    return this.loadingRequests.listByOrder(customerId, orderId);
  }

  async exportExcel(customerId: string, query: OrderQueryDto): Promise<Buffer> {
    const filter = this.buildFilter(customerId, query);
    const [rows, sums] = await Promise.all([
      this.orders.findAll(filter),
      this.orders.aggregateSums(filter),
    ]);
    const dtos = rows.map(toOrderDto);
    const sumRow = buildOrderSumRow(sums);

    return this.excel.build({
      sheetName: 'سفارشات',
      title: 'گزارش سفارشات',
      columns: [
        { header: 'شماره', key: 'orderNumber' },
        { header: 'تاریخ', key: 'orderDate' },
        { header: 'محصول', key: 'productName', width: 28 },
        { header: 'وضعیت', key: 'status' },
        { header: 'مقدار', key: 'totalQty', numeric: true },
        { header: 'حمل‌شده', key: 'deliveredQty', numeric: true },
        { header: 'باقیمانده', key: 'remainingQty', numeric: true },
        { header: 'مبلغ با عوامل', key: 'amountWithFactors', numeric: true, width: 20 },
        { header: 'مبلغ حمل‌شده', key: 'deliveredAmount', numeric: true, width: 20 },
        { header: 'مبلغ باقیمانده', key: 'remainingAmount', numeric: true, width: 20 },
      ],
      rows: dtos.map((o) => ({
        orderNumber: o.orderNumber,
        orderDate: o.orderDate.slice(0, 10),
        productName: o.productName,
        status: o.status,
        totalQty: o.totalQty,
        deliveredQty: o.deliveredQty,
        remainingQty: o.remainingQty,
        amountWithFactors: o.amountWithFactors,
        deliveredAmount: o.deliveredAmount,
        remainingAmount: o.remainingAmount,
      })),
      sumRow: {
        totalQty: sumRow.totalQty,
        deliveredQty: sumRow.deliveredQty,
        remainingQty: sumRow.remainingQty,
        amountWithFactors: sumRow.amountWithFactors,
        deliveredAmount: sumRow.deliveredAmount,
        remainingAmount: sumRow.remainingAmount,
      },
    });
  }
}
