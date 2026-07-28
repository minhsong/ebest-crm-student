'use client';

import { usePortalExploreOptional } from '@/contexts/portal-explore-context';
import type { PortalExplorePayload } from '@/lib/portal-course-catalog/types';

/** Thin wrapper — data từ PortalExploreProvider; ngoài provider → rỗng. */
export function usePortalCourseCatalog() {
  const explore = usePortalExploreOptional();
  if (!explore) {
    return {
      loading: false,
      error: null,
      courses: [] as PortalExplorePayload['courses'],
    };
  }
  return {
    loading: explore.loading,
    error: explore.error,
    courses: explore.courses,
  };
}
