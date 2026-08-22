import { LoadingRequestStatus } from '@cement/shared-types';
import { AppException } from '../../common/exceptions/app.exception';
import { LoadingRequestStateMachine } from './loading-request.state-machine';

describe('LoadingRequestStateMachine (بخش ۸.۱)', () => {
  let sm: LoadingRequestStateMachine;

  beforeEach(() => {
    sm = new LoadingRequestStateMachine();
  });

  const S = LoadingRequestStatus;

  describe('canTransition — انتقال‌های مجاز طبق جدول ۸.۱', () => {
    it.each([
      [S.SUBMITTED, S.APPROVED],
      [S.SUBMITTED, S.REJECTED],
      [S.SUBMITTED, S.CANCELED],
      [S.APPROVED, S.LOADED],
      [S.APPROVED, S.CANCELED],
      // «ویرایش و ارسال مجدد» توسط مشتری — تنها انتقال برگشتی جدول.
      [S.REJECTED, S.SUBMITTED],
    ])('%s → %s مجاز است', (from, to) => {
      expect(sm.canTransition(from, to)).toBe(true);
    });

    it.each([
      // از حالت‌های پایانی هیچ انتقالی مجاز نیست
      [S.LOADED, S.CANCELED],
      // ردشده فقط به SUBMITTED برمی‌گردد؛ نه مستقیم به تاییدشده یا بارگیری‌شده
      [S.REJECTED, S.APPROVED],
      [S.REJECTED, S.LOADED],
      [S.REJECTED, S.CANCELED],
      [S.CANCELED, S.APPROVED],
      // لغوشده حتی با ویرایش هم برنمی‌گردد (بازگشتِ برگشتی فقط از REJECTED است)
      [S.CANCELED, S.SUBMITTED],
      [S.LOADED, S.SUBMITTED],
      // پرش‌های نامعتبر
      [S.SUBMITTED, S.LOADED],
      [S.APPROVED, S.APPROVED],
      [S.APPROVED, S.REJECTED],
      [S.APPROVED, S.SUBMITTED],
    ])('%s → %s غیرمجاز است', (from, to) => {
      expect(sm.canTransition(from, to)).toBe(false);
    });
  });

  describe('assertTransition — پرتاب خطا', () => {
    it('انتقال مجاز نباید خطا بدهد', () => {
      expect(() => sm.assertTransition(S.SUBMITTED, S.APPROVED)).not.toThrow();
    });

    it('ارسال مجدد درخواست ردشده نباید خطا بدهد', () => {
      expect(() => sm.assertTransition(S.REJECTED, S.SUBMITTED)).not.toThrow();
    });

    it('لغو درخواست بارگیری‌شده → LOAD_004 (BR-10، HTTP 409)', () => {
      try {
        sm.assertTransition(S.LOADED, S.CANCELED);
        fail('باید خطا پرتاب می‌شد');
      } catch (err) {
        expect(err).toBeInstanceOf(AppException);
        expect((err as AppException).code).toBe('LOAD_004');
        expect((err as AppException).httpStatus).toBe(409);
      }
    });

    it('سایر انتقال‌های غیرمجاز هم تعارض وضعیت (409) هستند', () => {
      try {
        sm.assertTransition(S.SUBMITTED, S.LOADED);
        fail('باید خطا پرتاب می‌شد');
      } catch (err) {
        expect(err).toBeInstanceOf(AppException);
        expect((err as AppException).httpStatus).toBe(409);
      }
    });
  });
});
