import type { CourseRecommendationResponseWire } from '@/lib/portal-recommendations/types';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy.shared';

/**
 * Client — chạy CRE cho HV đã đăng nhập (Lead/Customer JWT cookie).
 * Dùng khi không có PortalExploreProvider (exam done) hoặc cần refresh riêng.
 */
export async function fetchPortalCourseRecommendations(
  locale = 'vi-VN',
): Promise<CourseRecommendationResponseWire> {
  const params = new URLSearchParams({ locale });
  const res = await fetch(`/api/portal/recommendations?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(raw.message ?? 'Không tải được gợi ý khóa học.');
  }
  const payload = unwrapCrmResponseBody(raw) as CourseRecommendationResponseWire;
  return {
    locale: payload?.locale ?? locale,
    generatedAt: payload?.generatedAt ?? new Date().toISOString(),
    primaryTestTypeCode: payload?.primaryTestTypeCode ?? null,
    proficiencySummary: payload?.proficiencySummary ?? null,
    recommendations: Array.isArray(payload?.recommendations)
      ? payload.recommendations
      : [],
    fallbackUsed: Boolean(payload?.fallbackUsed),
  };
}
