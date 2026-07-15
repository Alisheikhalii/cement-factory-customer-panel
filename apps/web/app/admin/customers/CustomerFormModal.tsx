'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import type {
  AdminCustomerDto,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@cement/shared-types';
import { ApiError } from '../../../lib/api';
import {
  createCustomerSchema,
  editCustomerSchema,
  type CreateCustomerForm,
} from '../../../lib/customer-schemas';

/**
 * فرم مودال تعریف/ویرایش مشتری (بخش ۹.۹.۲). React Hook Form + Zod (instruction.md §6).
 * در حالت ویرایش، کد تفصیل و کد ملی فقط‌خواندنی‌اند (هویت ورود، تغییرناپذیر).
 */
export function CustomerFormModal({
  customer,
  onClose,
  onSubmit,
}: {
  customer: AdminCustomerDto | null;
  onClose: () => void;
  onSubmit: (input: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
}): React.ReactElement {
  const isEdit = customer !== null;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerForm>({
    resolver: zodResolver(isEdit ? editCustomerSchema : createCustomerSchema) as Resolver<CreateCustomerForm>,
    mode: 'onTouched',
    defaultValues: {
      customerCode: customer?.customerCode ?? '',
      name: customer?.name ?? '',
      nationalId: customer?.nationalId ?? '',
      economicCode: customer?.economicCode ?? '',
      mobile: customer?.mobile ?? '',
      address: customer?.address ?? '',
      postalCode: customer?.postalCode ?? '',
      creditLimit: customer?.creditLimit != null ? String(customer.creditLimit) : '',
    },
  });

  async function submit(values: CreateCustomerForm): Promise<void> {
    setServerError(null);
    const creditLimit =
      values.creditLimit && values.creditLimit.trim() !== ''
        ? Number(values.creditLimit)
        : undefined;
    try {
      if (isEdit) {
        const input: UpdateCustomerInput = {
          name: values.name,
          economicCode: values.economicCode || undefined,
          mobile: values.mobile,
          address: values.address || undefined,
          postalCode: values.postalCode || undefined,
          creditLimit,
        };
        await onSubmit(input);
      } else {
        const input: CreateCustomerInput = {
          customerCode: values.customerCode,
          name: values.name,
          nationalId: values.nationalId,
          economicCode: values.economicCode || undefined,
          mobile: values.mobile,
          address: values.address || undefined,
          postalCode: values.postalCode || undefined,
          creditLimit,
        };
        await onSubmit(input);
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'ثبت اطلاعات ناموفق بود');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl p-6 shadow-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'ویرایش مشتری' : 'تعریف مشتری جدید'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field label="کد تفصیل" error={errors.customerCode?.message}>
            <input
              {...register('customerCode')}
              readOnly={isEdit}
              className={inputClass(isEdit)}
            />
          </Field>
          <Field label="نام مشتری" error={errors.name?.message}>
            <input {...register('name')} className={inputClass(false)} />
          </Field>
          <Field label="کد ملی (نام کاربری ورود)" error={errors.nationalId?.message}>
            <input {...register('nationalId')} readOnly={isEdit} className={inputClass(isEdit)} />
          </Field>
          <Field label="کد اقتصادی" error={errors.economicCode?.message}>
            <input {...register('economicCode')} className={inputClass(false)} />
          </Field>
          <Field label="موبایل" error={errors.mobile?.message}>
            <input {...register('mobile')} className={inputClass(false)} dir="ltr" />
          </Field>
          <Field label="کد پستی" error={errors.postalCode?.message}>
            <input {...register('postalCode')} className={inputClass(false)} dir="ltr" />
          </Field>
          <Field label="سقف اعتباری (ریال)" error={errors.creditLimit?.message}>
            <input {...register('creditLimit')} className={inputClass(false)} dir="ltr" inputMode="numeric" />
          </Field>
          <Field label="آدرس" error={errors.address?.message} full>
            <textarea {...register('address')} rows={2} className={inputClass(false)} />
          </Field>

          {serverError && (
            <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'ذخیره تغییرات' : 'ثبت مشتری'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(readOnly: boolean): string {
  return `input-glass w-full px-3 py-2 text-sm text-on-surface ${
    readOnly ? '!bg-surface-container/60 text-on-surface-variant' : ''
  }`;
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
