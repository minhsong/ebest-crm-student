import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

export const STUDENT_CRM_BASE = '/api/v1/student';

export function getStudentCrmAuthHeaders(): HeadersInit | null {
  const token = getStudentAccessTokenFromCookie();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export function buildStudentCrmUrl(path: string): string | null {
  const base = getApiBaseUrl();
  if (!base) return null;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}

/** CRM thường bọc { result } — trả payload trong. */
export function unwrapCrmPayload<T = unknown>(data: unknown): T {
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (o.result != null) return o.result as T;
    if (o.data != null) return o.data as T;
  }
  return data as T;
}
