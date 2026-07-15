import { ComplaintStatus } from '@cement/shared-types';
import type { AdminComplaintDto, ComplaintDto } from '@cement/shared-types';
import type { ComplaintWithCustomer } from './complaints.repository';

function toStatus(status: string): ComplaintStatus {
  return ComplaintStatus[status as keyof typeof ComplaintStatus];
}

export function toComplaintDto(row: {
  id: string;
  subject: string;
  description: string;
  submittedAt: Date;
  status: string;
  reply: string | null;
  repliedAt: Date | null;
}): ComplaintDto {
  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    submittedAt: row.submittedAt.toISOString(),
    status: toStatus(row.status),
    reply: row.reply,
    repliedAt: row.repliedAt ? row.repliedAt.toISOString() : null,
  };
}

export function toAdminComplaintDto(row: ComplaintWithCustomer): AdminComplaintDto {
  return {
    id: row.id,
    customerName: row.customer.name,
    subject: row.subject,
    description: row.description,
    submittedAt: row.submittedAt.toISOString(),
    status: toStatus(row.status),
    reply: row.reply,
    repliedAt: row.repliedAt ? row.repliedAt.toISOString() : null,
  };
}
