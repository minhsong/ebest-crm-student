import { getApiBaseUrl } from '@/lib/env';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy.shared';
import { STUDENT_API } from '@/lib/student-api';
import type { PortalExplorePayload } from './types';

function parseExplorePayload(data: unknown): PortalExplorePayload {
  const payload = unwrapCrmResponseBody(
    (data && typeof data === 'object' ? data : {}) as Record<string, unknown>,
  ) as PortalExplorePayload;
  return {
    locale: payload?.locale ?? 'vi-VN',
    siteLinks: payload?.siteLinks ?? {
      locale: 'vi-VN',
      aboutUrl: 'https://ebest.edu.vn/ve-chung-toi/',
      zaloChatUrl: 'https://zalo.me/ebestenglish',
      facebookMessengerUrl: 'https://www.facebook.com/ebestenglish',
    },
    courses: Array.isArray(payload?.courses) ? payload.courses : [],
    recommendations: payload?.recommendations,
  };
}

/** Client — SSOT 1 request (site links + course catalog + optional recommendations). */
export async function fetchPortalExplore(
  locale = 'vi-VN',
  options?: { includeRecommendations?: boolean },
): Promise<PortalExplorePayload> {
  const params = new URLSearchParams({ locale });
  if (options?.includeRecommendations) {
    params.set('include', 'recommendations');
  }
  const res = await fetch(`/api/portal/explore?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  const data = (await res.json().catch(() => ({}))) as PortalExplorePayload & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? 'Không tải được nội dung portal.');
  }
  return parseExplorePayload(data);
}

/** SSR / BFF → CRM. */
export async function fetchPortalExploreFromCrm(
  locale = 'vi-VN',
): Promise<PortalExplorePayload> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    throw new Error('Chưa cấu hình CRM_API_URL.');
  }
  const url = `${buildCrmStudentUrl(apiBase, STUDENT_API.portalExplore)}?locale=${encodeURIComponent(locale)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 600 },
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof raw.message === 'string'
        ? raw.message
        : 'Không tải được nội dung portal.';
    throw new Error(message);
  }
  return parseExplorePayload(raw);
}
