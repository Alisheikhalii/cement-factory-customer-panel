import type { ExecutionContext } from '@nestjs/common';
import { Role, type AuthUser } from '@cement/shared-types';
import { AdminGuard } from './admin.guard';
import { CustomerScopeGuard } from './customer-scope.guard';
import { AppException } from '../../../common/exceptions/app.exception';

/**
 * تست‌های امنیتی حیاتی فاز ۱ (چک‌لیست بخش ۱۵):
 *  - کاربر CUSTOMER نتواند مسیر ادمین را فراخوانی کند و برعکس.
 *  - Data Scoping بر اساس customerId توکن باشد، نه پارامتر قابل‌دستکاری URL/Body.
 */

function contextWithUser(user: AuthUser | undefined, query: Record<string, unknown> = {}) {
  const request = { user, query, params: {}, body: {} };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const customerUser: AuthUser = {
  userId: 'user-A',
  username: '0013542419',
  role: Role.CUSTOMER,
  customerId: 'cust-A',
  fullName: 'مشتری A',
  mustResetPassword: false,
};

const adminUser: AuthUser = {
  userId: 'user-admin',
  username: 'admin',
  role: Role.ADMIN,
  customerId: null,
  fullName: 'ادمین',
  mustResetPassword: false,
};

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('اجازه عبور به ADMIN می‌دهد', () => {
    expect(guard.canActivate(contextWithUser(adminUser))).toBe(true);
  });

  it('CUSTOMER را از مسیر ادمین رد می‌کند (AUTH_004)', () => {
    expect(() => guard.canActivate(contextWithUser(customerUser))).toThrow(AppException);
    try {
      guard.canActivate(contextWithUser(customerUser));
    } catch (e) {
      expect((e as AppException).code).toBe('AUTH_004');
    }
  });

  it('درخواست بدون کاربر را رد می‌کند', () => {
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(AppException);
  });
});

describe('CustomerScopeGuard', () => {
  const guard = new CustomerScopeGuard();

  it('اجازه عبور به CUSTOMER دارای customerId می‌دهد', () => {
    expect(guard.canActivate(contextWithUser(customerUser))).toBe(true);
  });

  it('ADMIN را از مسیر داده مشتری رد می‌کند (AUTH_004)', () => {
    expect(() => guard.canActivate(contextWithUser(adminUser))).toThrow(AppException);
  });

  it('CUSTOMER بدون customerId را رد می‌کند', () => {
    const broken: AuthUser = { ...customerUser, customerId: null };
    expect(() => guard.canActivate(contextWithUser(broken))).toThrow(AppException);
  });

  it('customerId مهاجم در Query را نادیده می‌گیرد؛ منبع همیشه توکن است', () => {
    // مهاجم customerId مشتری B را در Query جا می‌زند
    const ctx = contextWithUser(customerUser, { customerId: 'cust-B' });
    expect(guard.canActivate(ctx)).toBe(true);
    // Guard فقط از req.user (توکن) می‌خواند؛ Query هرگز Scope را تغییر نمی‌دهد.
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    expect(req.user.customerId).toBe('cust-A');
  });
});
