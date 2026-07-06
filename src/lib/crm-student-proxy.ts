/**
 * Proxy JSON POST từ Route Handler Next.js → CRM `/api/v1/student/*`.
 * Một nơi xử lý URL, unwrap `result`/`data`, lỗi CRM, 502.
 */

import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

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
  if (typeof msg === 'string' && msg.trim()) {
    return sanitizeStudentFacingMessage(msg, fallback);
  }
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
  method?: 'POST' | 'PATCH' | 'PUT';
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
      method: options.method ?? 'POST',
      headers: { ...JSON_HEADERS, ...options.headers },
      body: JSON.stringify(options.body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, options.errorFallback),
        { status: res.status },
      );
    }
    const payload = unwrapCrmResponseBody(data);
    return NextResponse.json(payload ?? data);
  } catch {
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}

export type ProxyLeadAuthenticatedPostOptions = {
  body: unknown;
  path: string;
  token: string | null | undefined;
  errorFallback: string;
};

/** POST có Bearer lead JWT — tái dùng cho `/api/auth/lead/*` authenticated. */
export async function proxyLeadAuthenticatedPostJson(
  options: ProxyLeadAuthenticatedPostOptions,
): Promise<NextResponse> {
  const token = options.token?.trim();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  return proxyStudentPostJson({
    body: options.body,
    path: options.path,
    headers: { Authorization: `Bearer ${token}` },
    errorFallback: options.errorFallback,
  });
}

export type ProxyLeadAuthenticatedPatchOptions = {
  body: unknown;
  path: string;
  token: string | null | undefined;
  errorFallback: string;
  transform?: (payload: unknown) => unknown;
};

/** PATCH có Bearer lead JWT. */
export async function proxyLeadAuthenticatedPatchJson(
  options: ProxyLeadAuthenticatedPatchOptions,
): Promise<NextResponse> {
  const token = options.token?.trim();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, options.path);
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options.body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, options.errorFallback),
        { status: res.status },
      );
    }
    const payload = unwrapCrmResponseBody(data) ?? data;
    const body = options.transform ? options.transform(payload) : payload;
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}

export type ProxyLeadAuthenticatedGetOptions = {
  path: string;
  token: string | null | undefined;
  errorFallback?: string;
  transform?: (payload: unknown) => unknown;
};

/** GET có Bearer lead JWT — tái dùng cho `/api/lead/*`. */
export async function proxyLeadAuthenticatedGetJson(
  options: ProxyLeadAuthenticatedGetOptions,
): Promise<NextResponse> {
  const token = options.token?.trim();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, options.path);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(
          data,
          res.status,
          options.errorFallback ?? MSG_CRM_NETWORK,
        ),
        { status: res.status },
      );
    }
    const payload = unwrapCrmResponseBody(data) ?? data;
    const body = options.transform ? options.transform(payload) : payload;
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { message: options.errorFallback ?? MSG_CRM_NETWORK },
      { status: 502 },
    );
  }
}
