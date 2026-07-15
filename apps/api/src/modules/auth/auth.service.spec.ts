import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { AppException } from '../../common/exceptions/app.exception';
import type {
  UserRepository,
  UserWithCustomer,
} from '../../common/repositories/user.repository';
import { LoginThrottleService } from './services/login-throttle.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';

/**
 * تست واحد AuthService (بخش ۶ و ۹.۱ PRD):
 *  - ورود موفق مشتری
 *  - رمز اشتباه → AUTH_001
 *  - عدم تطابق نقش (مشتری از مسیر ادمین) → AUTH_001
 *  - قفل پس از ۵ تلاش ناموفق → AUTH_002
 */

const NATIONAL_ID = '0013542419';

function buildCustomer(passwordHash: string): UserWithCustomer {
  return {
    id: 'user-A',
    customerId: 'cust-A',
    username: NATIONAL_ID,
    fullName: 'مشتری A',
    passwordHash,
    role: Role.CUSTOMER,
    isActive: true,
    lastLoginAt: null,
    lastActivityAt: null,
    mustResetPassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    customer: {
      id: 'cust-A',
      erpCustomerId: null,
      customerCode: 'TEST-0001',
      nationalId: NATIONAL_ID,
      economicCode: null,
      name: 'مشتری A',
      address: null,
      postalCode: null,
      mobile: '09120000000',
      creditLimit: null,
      creditBalance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  } as UserWithCustomer;
}

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Pick<UserRepository, 'findByUsername' | 'findById' | 'markLoggedIn'>>;
  let passwords: PasswordService;
  let throttle: LoginThrottleService;

  const config = {
    get: (key: string): string => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test_access_secret_least_32_chars_long',
        JWT_REFRESH_SECRET: 'test_refresh_secret_least_32_chars_lon',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] ?? '';
    },
  } as unknown as ConfigService;

  beforeEach(async () => {
    passwords = new PasswordService();
    throttle = new LoginThrottleService();
    const hash = await passwords.hash('Customer@12345');

    repo = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      markLoggedIn: jest.fn().mockResolvedValue(undefined),
    };
    repo.findByUsername.mockResolvedValue(buildCustomer(hash));

    service = new AuthService(
      repo as unknown as UserRepository,
      passwords,
      throttle,
      new OtpService(),
      new JwtService({}),
      config,
    );
  });

  it('ورود موفق مشتری با رمز درست، Access Token و AuthUser برمی‌گرداند', async () => {
    const res = await service.loginCustomer(NATIONAL_ID, 'Customer@12345');
    expect(res.accessToken).toEqual(expect.any(String));
    expect(res.user.customerId).toBe('cust-A');
    expect(res.user.role).toBe(Role.CUSTOMER);
  });

  it('رمز اشتباه → AUTH_001', async () => {
    await expect(service.loginCustomer(NATIONAL_ID, 'wrong')).rejects.toMatchObject({
      code: 'AUTH_001',
    });
  });

  it('مشتری که از مسیر ادمین وارد شود → AUTH_001 (عدم تطابق نقش)', async () => {
    await expect(service.loginAdmin(NATIONAL_ID, 'Customer@12345')).rejects.toMatchObject({
      code: 'AUTH_001',
    });
  });

  it('پس از ۵ تلاش ناموفق، حساب قفل و AUTH_002 برمی‌گردد', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(service.loginCustomer(NATIONAL_ID, 'wrong')).rejects.toBeInstanceOf(
        AppException,
      );
    }
    // تلاش ششم حتی با رمز درست باید قفل باشد
    await expect(service.loginCustomer(NATIONAL_ID, 'Customer@12345')).rejects.toMatchObject({
      code: 'AUTH_002',
    });
  });
});
