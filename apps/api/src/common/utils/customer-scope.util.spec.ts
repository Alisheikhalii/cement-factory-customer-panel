import { Role, type AuthUser } from '@cement/shared-types';
import { AppException } from '../exceptions/app.exception';
import { requireCustomerId } from './customer-scope.util';

/**
 * تست استخراج مطمئن customerId (بخش ۶.۲ — Data Scoping).
 * تنها منبع مجاز customerId در ماژول‌های مشتری همین تابع است.
 */
describe('customer-scope.util', () => {
  const base: AuthUser = {
    userId: 'u1',
    username: 'C-1001',
    role: Role.CUSTOMER,
    customerId: 'cust-1',
    fullName: 'مشتری نمونه',
    mustResetPassword: false,
  };

  it('کاربر مشتری با customerId → همان شناسه برمی‌گردد', () => {
    expect(requireCustomerId(base)).toBe('cust-1');
  });

  it('بدون customerId (مثلاً ادمین) → AUTH_004', () => {
    const admin: AuthUser = { ...base, role: Role.ADMIN, customerId: null };
    expect(() => requireCustomerId(admin)).toThrow(AppException);
    try {
      requireCustomerId(admin);
    } catch (error) {
      expect((error as AppException).code).toBe('AUTH_004');
    }
  });
});
