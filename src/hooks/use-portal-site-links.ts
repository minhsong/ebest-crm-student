'use client';

import { usePortalExplore } from '@/contexts/portal-explore-context';

/** Thin wrapper — dùng data từ PortalExploreProvider (không fetch lặp). */
export function usePortalSiteLinks() {
  const { loading, error, siteLinks } = usePortalExplore();
  return { loading, error, siteLinks };
}
