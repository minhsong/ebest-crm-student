'use client';

/**
 * @deprecated Dùng `usePortalCourseCatalog` + `usePortalSiteLinks` (Postgres SSOT).
 */
import { useEffect, useState } from 'react';
import { fetchPortalExplore } from '@/lib/portal-course-catalog/fetch-portal-explore';
import { mapPortalExploreToLegacyMarketing } from '@/lib/portal-marketing/explore-legacy-mapper';
import type { PortalMarketingPayload } from '@/lib/portal-marketing/types';

export function usePortalMarketing(locale = 'vi-VN') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketing, setMarketing] = useState<PortalMarketingPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const explore = await fetchPortalExplore(locale);
        if (!cancelled) {
          setMarketing(mapPortalExploreToLegacyMarketing(explore));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được nội dung.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { loading, error, marketing };
}
