/**
 * فرمت پاسخ استاندارد API — بخش ۱۱.۱۱ PRD.
 * تمام Endpointها باید یکی از این دو شکل را برگردانند.
 */

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
