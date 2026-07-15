import { Role } from '@cement/shared-types';
import { toSharedRole } from './role.util';

/** تست پل نوعی نقش Prisma → enum مشترک (فاز ۷e — پوشش واحدهای خالص). */
describe('role.util', () => {
  it('ADMIN رشته‌ای → Role.ADMIN', () => {
    expect(toSharedRole('ADMIN')).toBe(Role.ADMIN);
  });

  it('CUSTOMER رشته‌ای → Role.CUSTOMER', () => {
    expect(toSharedRole('CUSTOMER')).toBe(Role.CUSTOMER);
  });

  it('مقدار ناشناخته به CUSTOMER (کم‌امتیازترین نقش) بازمی‌گردد', () => {
    expect(toSharedRole('SUPERUSER')).toBe(Role.CUSTOMER);
  });
});
