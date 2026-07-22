import { getApiBaseUrl } from '@/lib/env';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';

export const STUDENT_CRM_BASE = '/api/v1/student';

export function getStudentCrmAuthHeaders(): HeadersInit | null {
  const token = getPortalAccessTokenFromCookie();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export function buildStudentCrmUrl(path: string): string | null {
  const base = getApiBaseUrl();
  if (!base) return null;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}

export { unwrapCrmPayload } from '@/lib/crm-payload';
