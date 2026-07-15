import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { isValidIranianNationalId } from '@cement/shared-types';

/**
 * Decorator اعتبارسنجی class-validator برای کد ملی ایران.
 * منطق اصلی از shared-types می‌آید (بدون کپی — instruction.md §3).
 */
export function IsIranianNationalId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isIranianNationalId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isValidIranianNationalId(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} یک کد ملی معتبر نیست`;
        },
      },
    });
  };
}
