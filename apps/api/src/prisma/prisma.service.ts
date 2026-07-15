import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — تنها نقطه اتصال به دیتابیس.
 * طبق instruction.md §2 هرگز مستقیماً داخل *.service.ts دامنه‌ای تزریق نمی‌شود؛
 * از فاز ۱ به بعد پشت Repository اختصاصی هر Domain قرار می‌گیرد.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
