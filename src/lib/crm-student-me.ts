import type { NextRequest } from 'next/server';

import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import {
  dedupeInflight,
  getTtlCacheHit,
  setTtlCache,
  type TtlCacheEntry,
} from '@/lib/crm-inflight-cache';
import { getApiBaseUrl } from '@/lib/env';

const ME_INFLIGHT = new Map<string, Promise<Record<string, unknown> | null>>();
const ME_TTL_CACHE = new Map<string, TtlCacheEntry<Record<string, unknown>>>();
const ME_CACHE_TTL_MS = 15_000;

function getBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    return t || null;
  }
  return null;
}

/** Bearer header hoặc cookie `portal_at` — giống các proxy CRM khác. */
export function getPortalAccessTokenFromRequest(
  request: NextRequest,
): string | null {
  return getBearerToken(request) ?? getPortalAccessTokenFromCookie();
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
export type StudentMeProfile = {
  customerId: number;
  displayName: string;
};

async function fetchStudentMeInner(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const token = getPortalAccessTokenFromRequest(request);
  if (!token) return null;

  const cacheKey = token;
  const cached = getTtlCacheHit(ME_TTL_CACHE, cacheKey);
  if (cached) return cached;

  return dedupeInflight(ME_INFLIGHT, cacheKey, async () => {
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
      setTtlCache(ME_TTL_CACHE, cacheKey, inner, ME_CACHE_TTL_MS);
      return inner;
    } catch {
      return null;
    }
  });
}

function displayNameFromCustomer(customer: Record<string, unknown>): string {
  const fullName = customer.fullName;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }
  const parts = [customer.firstName, customer.lastName]
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  const nickname = customer.nickname;
  if (typeof nickname === 'string' && nickname.trim()) return nickname.trim();
  return '';
}

export async function resolveStudentMeViaCrm(
  request: NextRequest,
): Promise<StudentMeProfile | null> {
  const inner = await fetchStudentMeInner(request);
  if (!inner) return null;
  const customer = inner.customer as Record<string, unknown> | null | undefined;
  if (!customer || typeof customer.id !== 'number') return null;
  const customerId = customer.id;
  if (!Number.isFinite(customerId) || customerId < 1) return null;
  const displayName = displayNameFromCustomer(customer);
  if (!displayName) return null;
  return { customerId, displayName };
}

export async function resolveStudentCustomerIdViaCrmMe(
  request: NextRequest,
): Promise<number | null> {
  const inner = await fetchStudentMeInner(request);
  if (!inner) return null;
  const customer = inner.customer as Record<string, unknown> | null | undefined;
  if (!customer || typeof customer.id !== 'number') return null;
  const id = customer.id;
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}
