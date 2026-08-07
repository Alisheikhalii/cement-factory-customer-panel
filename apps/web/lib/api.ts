import type { ApiMeta, ApiResponse } from '@cement/shared-types';
import { authStorage } from './auth-storage';

/**
 * کلاینت fetch برای ارتباط با Backend (بخش ۱۱ PRD).
 * - Base URL از NEXT_PUBLIC_API_URL
 * - credentials: 'include' برای Cookie ی Refresh (httpOnly)
 * - پاسخ در قالب { success, data, meta? } | { success:false, error } باز می‌شود
 * - Access Token از authStorage به‌صورت خودکار ضمیمه می‌شود
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** خروجی درخواست همراه با meta (برای لیست‌های صفحه‌بندی‌شده). */
export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = options.token ?? authStorage.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // هدر CSRF (Double-Submit Cookie، بخش ۱۳ PRD): Backend فقط روی مسیرهای مبتنی بر
  // Cookie مثل /auth/refresh و /auth/logout آن را بررسی می‌کند؛ روی بقیه بی‌اثر است.
  const csrf = authStorage.getCsrf();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('GENERIC_500', 'پاسخ نامعتبر از سرور', res.status);
  }

  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, res.status);
  }
  return { data: payload.data, meta: payload.meta };
}

export const apiClient = {
  async get<T>(path: string, token?: string | null): Promise<T> {
    return (await request<T>(path, { token })).data;
  },
  async getWithMeta<T>(path: string, token?: string | null): Promise<ApiResult<T>> {
    return request<T>(path, { token });
  },
  async post<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
    return (await request<T>(path, { method: 'POST', body, token })).data;
  },
  async patch<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
    return (await request<T>(path, { method: 'PATCH', body, token })).data;
  },
  async del<T>(path: string, token?: string | null): Promise<T> {
    return (await request<T>(path, { method: 'DELETE', token })).data;
  },
};

/**
 * دانلود فایل باینری (Excel/PDF) از یک Endpoint محافظت‌شده و باز کردن آن.
 * از fetch با Authorization استفاده می‌کند (نه لینک مستقیم) چون توکن Bearer لازم است.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = authStorage.getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    throw new ApiError('GENERIC_500', 'دانلود فایل ناموفق بود', res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
