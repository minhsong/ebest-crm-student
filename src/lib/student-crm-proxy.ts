import { NextRequest, NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';

export const STUDENT_CRM_API_PREFIX = '/api/v1/student';

function getAuthHeader(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth;
  return null;
}

export async function proxyStudentCrmGet(
  request: NextRequest,
  relativePath: string,
): Promise<NextResponse> {
  const authFromHeader = getAuthHeader(request);
  const tokenFromCookie = getStudentAccessTokenFromCookie();
  const auth = authFromHeader || (tokenFromCookie ? `Bearer ${tokenFromCookie}` : null);
  if (!auth) return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }
  const path = relativePath.replace(/^\//, '');
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_CRM_API_PREFIX}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: auth },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(sanitizeApiErrorPayload(data, res.status), {
      status: res.status,
    });
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(payload ?? data);
}

type ProxyStudentCrmMutationMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** GET/POST/PATCH… tới CRM `/api/v1/student/{relativePath}` (Bearer từ cookie/header). */
export async function proxyStudentCrmRequest(
  request: NextRequest,
  relativePath: string,
  options:
    | { method: 'GET' | 'HEAD' }
    | {
        method: ProxyStudentCrmMutationMethod;
        jsonBody?: unknown;
      },
): Promise<NextResponse> {
  const authFromHeader = getAuthHeader(request);
  const tokenFromCookie = getStudentAccessTokenFromCookie();
  const auth =
    authFromHeader || (tokenFromCookie ? `Bearer ${tokenFromCookie}` : null);
  if (!auth) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }
  const path = relativePath.replace(/^\//, '');
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_CRM_API_PREFIX}/${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: auth,
  };
  const init: RequestInit = { method: options.method, headers };
  if ('jsonBody' in options && options.jsonBody !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.jsonBody);
  }

  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(sanitizeApiErrorPayload(data, res.status), {
      status: res.status,
    });
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(payload ?? data);
}
