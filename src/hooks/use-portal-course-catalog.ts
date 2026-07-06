'use client';

import { usePortalExplore } from '@/contexts/portal-explore-context';

/** Thin wrapper — dùng data từ PortalExploreProvider (không fetch lặp). */
export function usePortalCourseCatalog() {
  const { loading, error, courses } = usePortalExplore();
  return { loading, error, courses };
}
