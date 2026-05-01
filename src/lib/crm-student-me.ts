import type { NextRequest } from 'next/server';

import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { getApiBaseUrl } from '@/lib/env';

function getBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    return t || null;
  }
  return null;
}

/** Bearer header hoặc cookie httpOnly — giống các proxy CRM khác. */
export function getStudentAccessTokenFromRequest(request: NextRequest): string | null {
  return getBearerToken(request) ?? getStudentAccessTokenFromCookie();
}

function unwrapCrmPayload(json: unknown): unknown {
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if ('result' in o) return o.result;
    if ('data' in o) return o.data;
  }
  return json;
}

/**
 * CRM là IdP duy nhất — không verify JWT trên Portal.
 * Dùng chung **`GET /api/v1/student/me`** (đã có Passport + cache Redis profile/classes) thay vì endpoint tách rời.
 */
export async function resolveStudentCustomerIdViaCrmMe(
  request: NextRequest,
): Promise<number | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const token = getStudentAccessTokenFromRequest(request);
  if (!token) return null;

  const url = `${apiBase.replace(/\/$/, '')}/api/v1/student/me`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    const inner = unwrapCrmPayload(json) as Record<string, unknown> | null;
    if (!inner || typeof inner !== 'object') return null;
    const customer = inner.customer as Record<string, unknown> | null | undefined;
    if (!customer || typeof customer.id !== 'number') return null;
    const id = customer.id;
    if (!Number.isFinite(id) || id < 1) return null;
    return id;
  } catch {
    return null;
  }
}
