/**
 * Server-side API: fetch profile by token from CRM.
 * Data load từ API server (SSR) để bảo mật.
 */

import type {
  ProfileByTokenResponse,
  ProfileByTokenResult,
} from '@/types/profile';

/**
 * Server-only: fetch profile by token from CRM API.
 * Gọi từ Server Component (SSR).
 */
export async function getProfileByToken(
  apiBaseUrl: string,
  token: string
): Promise<{ data: ProfileByTokenResult | null; error: string | null }> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/customers/profile-by-token?token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const json = (await res.json()) as ProfileByTokenResponse;
    if (!res.ok) {
      const msg =
        json?.message ||
        (res.status === 422
          ? 'Link không hợp lệ hoặc đã hết hạn.'
          : 'Có lỗi xảy ra.');
      return { data: null, error: msg };
    }
    if (!json?.result?.customer) {
      return { data: null, error: 'Dữ liệu không hợp lệ.' };
    }
    return { data: json.result, error: null };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Không thể kết nối. Vui lòng thử lại.';
    return { data: null, error: msg };
  }
}
