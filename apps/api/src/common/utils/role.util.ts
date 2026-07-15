import { Role } from '@cement/shared-types';

/**
 * تبدیل نقش تولیدشده توسط Prisma (اتحاد رشته‌ای 'CUSTOMER' | 'ADMIN') به enum مشترک
 * shared-types. مقادیر رشته‌ای یکسان‌اند اما نوع‌ها از نظر TypeScript متفاوت‌اند؛
 * این تبدیل صریح بدون cast/any مرز دو نوع را پل می‌زند (instruction.md §7).
 */
export function toSharedRole(role: string): Role {
  return role === Role.ADMIN ? Role.ADMIN : Role.CUSTOMER;
}
