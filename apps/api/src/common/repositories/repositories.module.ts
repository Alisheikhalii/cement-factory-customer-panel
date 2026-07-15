import { Global, Module } from '@nestjs/common';
import { UserRepository } from './user.repository';

/**
 * ماژول Repository های مشترک (instruction.md §4).
 * Global است تا ماژول‌های دامنه‌ای (auth، بعداً orders و ...) بدون Import مکرر
 * به Repository ها دسترسی داشته باشند.
 */
@Global()
@Module({
  providers: [UserRepository],
  exports: [UserRepository],
})
export class RepositoriesModule {}
