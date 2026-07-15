import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * سرویس هش/بررسی رمز عبور (بخش ۶ PRD).
 * استفاده از bcryptjs (پیاده‌سازی خالص JS، بدون نیاز به Build ابزار Native روی ویندوز).
 */
@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
