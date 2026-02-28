/**
 * Server-side: gọi CRM Student Portal API (domain /api/v1/student/*).
 * GET /api/v1/student/profile?token=...
 * Chỉ gọi từ Server Component (SSR).
 */

import type {
  ProfileByTokenResponse,
  ProfileByTokenResult,
} from '@/types/profile';

const ERRORS = {
  invalidToken: 'Link không hợp lệ hoặc đã hết hạn.',
  generic: 'Có lỗi xảy ra.',
  invalidData: 'Dữ liệu không hợp lệ.',
  network: 'Không thể kết nối. Vui lòng thử lại.',
} as const;

function parseJsonSafe<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function errorMessage(
  res: Response,
  json: ProfileByTokenResponse | null
): string {
  if (json?.message) return json.message;
  if (res.status === 422) return ERRORS.invalidToken;
  return ERRORS.generic;
}

import { getProfileUrl } from './student-api';

/**
 * Server-only: lấy profile theo token từ CRM API.
 */
export async function getProfileByToken(
  apiBaseUrl: string,
  token: string
): Promise<{ data: ProfileByTokenResult | null; error: string | null }> {
  const url = getProfileUrl(apiBaseUrl, token);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const text = await res.text();
    const json = parseJsonSafe<ProfileByTokenResponse>(text);

    if (!res.ok) {
      return { data: null, error: errorMessage(res, json) };
    }

    const payload = json?.data ?? json?.result;
    if (!payload?.customer) {
      return { data: null, error: ERRORS.invalidData };
    }

    return { data: payload, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : ERRORS.network;
    return { data: null, error: msg };
  }
}
