import { Injectable } from '@nestjs/common';
import type { ComplaintDto, CreateComplaintInput } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { NotificationService } from '../notifications/notification.service';
import { ComplaintRepository } from './complaints.repository';
import { toComplaintDto } from './complaints.mapper';

/**
 * سرویس شکایات سمت مشتری (بخش ۹.۸، BR-21..BR-23).
 * ⚠️ customerId همیشه از JWT (بخش ۶.۲). مدل ساده: بدون پیوست، بدون Thread (BR-22).
 */
@Injectable()
export class ComplaintsService {
  constructor(
    private readonly repo: ComplaintRepository,
    private readonly notifications: NotificationService,
  ) {}

  async list(customerId: string): Promise<ComplaintDto[]> {
    const rows = await this.repo.findForCustomer(customerId);
    return rows.map(toComplaintDto);
  }

  /**
   * ثبت شکایت جدید. موضوع و شرح اجباری (COMPLAINT_001). پس از ثبت، اعلان به
   * همه ادمین‌ها (ماتریس بخش ۱۷).
   */
  async create(customerId: string, input: CreateComplaintInput): Promise<ComplaintDto> {
    const subject = input.subject?.trim() ?? '';
    const description = input.description?.trim() ?? '';
    if (subject === '' || description === '') {
      throw new AppException('COMPLAINT_001');
    }

    const created = await this.repo.create({ customerId, subject, description });

    const customer = await this.repo.findCustomerName(customerId);
    await this.notifications.emitComplaintSubmitted({
      customerId,
      customerName: customer?.name ?? '',
    });

    return toComplaintDto(created);
  }
}
