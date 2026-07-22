/**
 * Proxy JSON POST từ Route Handler Next.js → CRM `/api/v1/student/*`.
 * Một nơi xử lý URL, unwrap `result`/`data`, lỗi CRM, 502.
 */

import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  forcePortalLogoutCookies,
  readPortalAccessTokenOrSweepLegacy,
} from '@/lib/portal-auth-cookie';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy.shared';

/** Bearer từ một cookie `portal_at` (UPA-D11); quét legacy. */
function readPortalBearerToken(): string | null {
  return readPortalAccessTokenOrSweepLegacy()?.trim() || null;
}

/** CRM 401 + request đã gửi Bearer → force logout rồi trả 401. */
function jsonCrmFailure(
  data: Record<string, unknown>,
  status: number,
  errorFallback: string,
  clearSessionOnUnauthorized: boolean,
): NextResponse {
  if (status === 401 && clearSessionOnUnauthorized) {
    forcePortalLogoutCookies();
  }
  return NextResponse.json(
    mapPortalConflictForClient(data, status, errorFallback),
    { status },
  );
}

function headersHaveAuthorization(headers?: HeadersInit): boolean {
  if (!headers) return false;
  if (headers instanceof Headers) {
    return Boolean(headers.get('authorization')?.trim());
  }
  if (Array.isArray(headers)) {
    return headers.some(
      ([key, value]) =>
        key.toLowerCase() === 'authorization' && Boolean(String(value).trim()),
    );
  }
  const record = headers as Record<string, string>;
  const auth = record.Authorization ?? record.authorization;
  return typeof auth === 'string' && Boolean(auth.trim());
}

export {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy.shared';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const MSG_CRM_CONFIG = 'Cấu hình server chưa đúng.';
export const MSG_CRM_NETWORK = 'Không thể kết nối. Vui lòng thử lại.';

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
  /** Mapper allowlist cho response thành công trước khi trả browser. */
  transform?: (payload: unknown) => unknown;
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
      return jsonCrmFailure(
        data,
        res.status,
        options.errorFallback,
        headersHaveAuthorization(options.headers),
      );
    }
    const payload = unwrapCrmResponseBody(data);
    const responsePayload = payload ?? data;
    return NextResponse.json(
      options.transform ? options.transform(responsePayload) : responsePayload,
    );
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
  const token = options.token?.trim() || readPortalBearerToken();
  if (!token) {
    forcePortalLogoutCookies();
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
  const token = options.token?.trim() || readPortalBearerToken();
  if (!token) {
    forcePortalLogoutCookies();
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
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return jsonCrmFailure(data, res.status, options.errorFallback, true);
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
  const token = options.token?.trim() || readPortalBearerToken();
  if (!token) {
    forcePortalLogoutCookies();
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
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return jsonCrmFailure(
        data,
        res.status,
        options.errorFallback ?? MSG_CRM_NETWORK,
        true,
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

export type ProxyPortalAuthenticatedPostOptions = {
  body: unknown;
  path: string;
  errorFallback: string;
};

/** POST có Bearer — một cookie `portal_at` (UPA-D11). */
export async function proxyPortalAuthenticatedPostJson(
  options: ProxyPortalAuthenticatedPostOptions,
): Promise<NextResponse> {
  const token = readPortalBearerToken();
  if (token) {
    return proxyStudentPostJson({
      body: options.body,
      path: options.path,
      headers: { Authorization: `Bearer ${token}` },
      errorFallback: options.errorFallback,
    });
  }
  forcePortalLogoutCookies();
  return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
}

export type ProxyPortalAuthenticatedGetOptions = {
  path: string;
  query?: Record<string, string>;
  errorFallback?: string;
};

/** GET có Bearer — một cookie `portal_at` (UPA-D11). */
export async function proxyPortalAuthenticatedGetJson(
  options: ProxyPortalAuthenticatedGetOptions,
): Promise<NextResponse> {
  const token = readPortalBearerToken();
  if (token) {
    return proxyAuthenticatedGetWithToken(token, options);
  }
  forcePortalLogoutCookies();
  return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
}

async function proxyAuthenticatedGetWithToken(
  token: string,
  options: ProxyPortalAuthenticatedGetOptions,
): Promise<NextResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }
  const baseUrl = buildCrmStudentUrl(apiBase, options.path);
  const qs = options.query
    ? `?${new URLSearchParams(options.query).toString()}`
    : '';
  const url = `${baseUrl}${qs}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return jsonCrmFailure(
        data,
        res.status,
        options.errorFallback ?? MSG_CRM_NETWORK,
        true,
      );
    }
    const payload = unwrapCrmResponseBody(data) ?? data;
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: options.errorFallback ?? MSG_CRM_NETWORK },
      { status: 502 },
    );
  }
}
