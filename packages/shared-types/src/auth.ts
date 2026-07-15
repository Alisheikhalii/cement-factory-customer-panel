/**
 * Type های احراز هویت — مشترک بین Backend و Frontend (بخش ۶ و ۱۱.۱ PRD).
 * قرارداد Payload توکن، پاسخ ورود و شکل درخواست‌ها اینجا تعریف می‌شود
 * تا هر دو طرف از یک منبع استفاده کنند (instruction.md §3).
 */
import type { Role } from './enums';

/** محتوای امضاشده داخل JWT (Access و Refresh). */
export interface JwtPayload {
  /** شناسه User (نه Customer) */
  sub: string;
  username: string;
  role: Role;
  /** برای ADMIN همیشه null است (بخش ۶.۲) */
  customerId: string | null;
}

/** کاربر احرازشده که به Frontend برگردانده می‌شود (بدون فیلد حساس). */
export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
  customerId: string | null;
  fullName: string | null;
  /** اگر true باشد، کاربر باید در اولین ورود رمز را تغییر دهد (BR-26) */
  mustResetPassword: boolean;
}

/**
 * پاسخ موفق ورود: Access Token در Body، Refresh در Cookie httpOnly.
 * `csrfToken` توکن Double-Submit است که Frontend باید در حافظه نگه دارد و در
 * فراخوانی‌های refresh/logout به‌صورت هدر `X-CSRF-Token` بازپس بفرستد (بخش ۱۳ PRD).
 */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  csrfToken: string;
}

/** پاسخ Refresh: Access Token جدید (به‌همراه همان csrfToken جاری نشست). */
export interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
  csrfToken: string;
}

// ---------- شکل درخواست‌ها (اعتبارسنجی واقعی: Backend=class-validator، Frontend=zod) ----------

export interface CustomerLoginRequest {
  /** کد ملی = Username مشتری (BR-28) */
  nationalId: string;
  password: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  nationalId: string;
}

export interface ForgotPasswordResponse {
  /** شماره موبایل Mask‌شده که OTP به آن ارسال شد (مثلاً ...۹۸۲۴) */
  maskedMobile: string;
}

export interface ResetPasswordRequest {
  nationalId: string;
  otp: string;
  newPassword: string;
}
