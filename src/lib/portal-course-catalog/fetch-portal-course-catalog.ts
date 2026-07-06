import type { PortalCourseCatalogItem, PortalSiteLinks } from './types';
import { fetchPortalExplore, fetchPortalExploreFromCrm } from './fetch-portal-explore';

/** @deprecated Prefer `fetchPortalExplore` — giữ tương thích BFF cũ. */
export async function fetchPortalCourseCatalog(
  locale = 'vi-VN',
): Promise<PortalCourseCatalogItem[]> {
  const explore = await fetchPortalExplore(locale);
  return explore.courses;
}

/** @deprecated Prefer `fetchPortalExplore`. */
export async function fetchPortalSiteLinks(
  locale = 'vi-VN',
): Promise<PortalSiteLinks> {
  const explore = await fetchPortalExplore(locale);
  return explore.siteLinks;
}

export async function fetchPortalCourseCatalogFromCrm(
  locale = 'vi-VN',
): Promise<PortalCourseCatalogItem[]> {
  const explore = await fetchPortalExploreFromCrm(locale);
  return explore.courses;
}

export async function fetchPortalSiteLinksFromCrm(
  locale = 'vi-VN',
): Promise<PortalSiteLinks> {
  const explore = await fetchPortalExploreFromCrm(locale);
  return explore.siteLinks;
}
