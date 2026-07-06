import { getApiBaseUrl } from '@/lib/env';
import { fetchPortalExplore, fetchPortalExploreFromCrm } from '@/lib/portal-course-catalog/fetch-portal-explore';
import { mapPortalExploreToLegacyMarketing } from './explore-legacy-mapper';
import type { PortalMarketingPayload } from './types';

/**
 * @deprecated Dùng `fetchPortalExplore` — giữ compat hook cũ.
 */
export async function fetchPortalMarketing(
  locale = 'vi-VN',
): Promise<PortalMarketingPayload> {
  const explore = await fetchPortalExplore(locale);
  return mapPortalExploreToLegacyMarketing(explore);
}

/**
 * @deprecated Postgres explore SSOT — không gọi Mongo CRM.
 */
export async function fetchPortalMarketingFromCrm(
  locale = 'vi-VN',
): Promise<PortalMarketingPayload> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    throw new Error('Chưa cấu hình CRM_API_URL.');
  }
  const explore = await fetchPortalExploreFromCrm(locale);
  return mapPortalExploreToLegacyMarketing(explore);
}
