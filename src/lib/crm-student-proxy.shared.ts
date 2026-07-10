import { STUDENT_API } from '@/lib/student-api';

/** Pure helpers — safe for client bundles (no next/headers). */

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
