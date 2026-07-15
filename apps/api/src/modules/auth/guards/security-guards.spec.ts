import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { CsrfGuard, CSRF_COOKIE, CSRF_HEADER } from './csrf.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AppException } from '../../../common/exceptions/app.exception';

/**
 * تست‌های سخت‌سازی فاز ۷ (بخش ۱۳ PRD):
 *  - CsrfGuard: الگوی Double-Submit Cookie (تطابق/عدم تطابق/نبود توکن → AUTH_005).
 *  - JwtAuthGuard: عبور مسیرهای @Public بدون احراز، و رد کاربر نامعتبر (AUTH_003).
 */

/** ساخت ExecutionContext با Cookie و Header دلخواه (برای CsrfGuard). */
function csrfContext(
  cookieToken: string | undefined,
  headerToken: string | string[] | undefined,
): ExecutionContext {
  const request = {
    cookies: cookieToken === undefined ? {} : { [CSRF_COOKIE]: cookieToken },
    headers: headerToken === undefined ? {} : { [CSRF_HEADER]: headerToken },
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard — Double-Submit Cookie', () => {
  const guard = new CsrfGuard();

  it('توکن Cookie و Header برابر → عبور', () => {
    expect(guard.canActivate(csrfContext('tok-123', 'tok-123'))).toBe(true);
  });

  it('عدم تطابق توکن → AUTH_005', () => {
    expect(() => guard.canActivate(csrfContext('tok-123', 'tok-456'))).toThrow(AppException);
    try {
      guard.canActivate(csrfContext('tok-123', 'tok-456'));
    } catch (e) {
      expect((e as AppException).code).toBe('AUTH_005');
    }
  });

  it('نبود Cookie → AUTH_005', () => {
    expect(() => guard.canActivate(csrfContext(undefined, 'tok-123'))).toThrow(AppException);
  });

  it('نبود Header → AUTH_005', () => {
    expect(() => guard.canActivate(csrfContext('tok-123', undefined))).toThrow(AppException);
  });

  it('طول متفاوت توکن → AUTH_005 (بدون پرتاب خطای مقایسه)', () => {
    expect(() => guard.canActivate(csrfContext('short', 'a-much-longer-token'))).toThrow(
      AppException,
    );
  });

  it('هدر آرایه‌ای → اولین مقدار استفاده می‌شود', () => {
    expect(guard.canActivate(csrfContext('tok-123', ['tok-123', 'tok-999']))).toBe(true);
  });
});

/** ExecutionContext مینیمال برای JwtAuthGuard (getHandler/getClass لازم Reflector). */
function jwtContext(): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;
}

/** Reflector ساختگی که مقدار ثابت isPublic برمی‌گرداند. */
function reflectorReturning(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: (): boolean => isPublic,
  } as unknown as Reflector;
}

describe('JwtAuthGuard — @Public bypass و handleRequest', () => {
  it('مسیر @Public بدون فراخوانی Passport عبور می‌کند', () => {
    const guard = new JwtAuthGuard(reflectorReturning(true));
    // اگر super.canActivate صدا زده می‌شد (Passport)، بدون Strategy خطا می‌داد؛
    // چون @Public است باید مستقیماً true برگردد.
    expect(guard.canActivate(jwtContext())).toBe(true);
  });

  it('handleRequest: کاربر معتبر → همان کاربر', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));
    const user = { userId: 'u1' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('handleRequest: نبود کاربر → AUTH_003', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));
    expect(() => guard.handleRequest(null, undefined)).toThrow(AppException);
    try {
      guard.handleRequest(null, undefined);
    } catch (e) {
      expect((e as AppException).code).toBe('AUTH_003');
    }
  });

  it('handleRequest: وجود خطا → AUTH_003', () => {
    const guard = new JwtAuthGuard(reflectorReturning(false));
    expect(() => guard.handleRequest(new Error('boom'), { userId: 'u1' })).toThrow(
      AppException,
    );
  });
});
