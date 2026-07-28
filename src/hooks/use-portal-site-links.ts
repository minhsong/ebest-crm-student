'use client';

import { usePortalExploreOptional } from '@/contexts/portal-explore-context';

/** Thin wrapper — data từ PortalExploreProvider; ngoài provider → rỗng (an toàn sau logout). */
export function usePortalSiteLinks() {
  const explore = usePortalExploreOptional();
  if (!explore) {
    return { loading: false, error: null, siteLinks: null };
  }
  return {
    loading: explore.loading,
    error: explore.error,
    siteLinks: explore.siteLinks,
  };
}
