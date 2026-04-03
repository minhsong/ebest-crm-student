/**
 * Proxy JSON POST từ Route Handler Next.js → CRM `/api/v1/student/*`.
 * Một nơi xử lý URL, unwrap `result`/`data`, lỗi CRM, 502.
 */

import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const MSG_CRM_CONFIG = 'Cấu hình server chưa đúng.';
export const MSG_CRM_NETWORK = 'Không thể kết nối. Vui lòng thử lại.';

export function buildCrmStudentUrl(apiBaseUrl: string, relativePath: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  const path = relativePath.replace(/^\//, '');
  return `${base}${STUDENT_API.basePath}/${path}`;
}

/** CRM thường bọc `{ success, result | data }`. */
export function unwrapCrmResponseBody(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const o = data as Record<string, unknown>;
  return o.result ?? o.data ?? data;
}

function errorMessageFromCrmPayload(
  data: Record<string, unknown>,
  fallback: string,
): string {
  const msg = data.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  const errors = data.errors;
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const e = errors as Record<string, unknown>;
    if ('token' in e) {
      if (e.token === 'alreadyUsed') {
        return 'Liên kết đặt lại mật khẩu đã được sử dụng. Vui lòng yêu cầu gửi lại email nếu cần.';
      }
      return 'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.';
    }
    const first = Object.values(e)[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export type ProxyStudentPostOptions = {
  body: unknown;
  /** Đoạn sau `.../student/`, ví dụ `auth/login` */
  path: string;
  headers?: HeadersInit;
  /** Khi CRM không trả `message` rõ ràng */
  errorFallback: string;
};

export async function proxyStudentPostJson(
  options: ProxyStudentPostOptions,
): Promise<NextResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, options.path);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...options.headers },
      body: JSON.stringify(options.body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return NextResponse.json(
        { message: errorMessageFromCrmPayload(data, options.errorFallback) },
        { status: res.status },
      );
    }
    const payload = unwrapCrmResponseBody(data);
    return NextResponse.json(payload ?? data);
  } catch {
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}
