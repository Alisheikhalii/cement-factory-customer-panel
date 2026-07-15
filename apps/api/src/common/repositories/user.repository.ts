import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** User به‌همراه رکورد Customer متصل (برای بررسی فعال بودن حساب در ورود). */
export type UserWithCustomer = Prisma.UserGetPayload<{ include: { customer: true } }>;

/**
 * Repository لایه دسترسی داده User (instruction.md §4).
 * سرویس‌های دامنه هرگز مستقیماً PrismaClient تزریق نمی‌کنند؛ فقط از این Repository استفاده می‌کنند.
 * همه Query ها Soft Delete را رعایت می‌کنند (بخش ۵.۲).
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<UserWithCustomer | null> {
    return this.prisma.user.findFirst({
      where: { username, isDeleted: false },
      include: { customer: true },
    });
  }

  findById(id: string): Promise<UserWithCustomer | null> {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: { customer: true },
    });
  }

  updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustResetPassword: false },
    });
  }

  markLoggedIn(id: string, when: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: when, lastActivityAt: when },
    });
  }

  async touchActivity(id: string, when: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastActivityAt: when },
    });
  }
}
