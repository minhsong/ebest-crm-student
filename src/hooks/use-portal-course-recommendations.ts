'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CourseRecommendationResponseWire } from '@/lib/portal-recommendations/types';
import { fetchPortalCourseRecommendations } from '@/lib/portal-recommendations/fetch-portal-recommendations';
import { usePortalExploreOptional } from '@/contexts/portal-explore-context';

type Options = {
  /** false = không fetch (vd. guest). */
  enabled?: boolean;
  locale?: string;
  /**
   * Ưu tiên data từ PortalExploreProvider nếu đã có (tránh double fetch trên /lead/courses).
   * Thiếu explore / chưa có recommendations → gọi GET /api/portal/recommendations.
   */
  preferExplore?: boolean;
};

/**
 * Hook CRE cho HV — explore reuse hoặc fetch dedicated.
 */
export function usePortalCourseRecommendations({
  enabled = true,
  locale = 'vi-VN',
  preferExplore = true,
}: Options = {}) {
  const explore = usePortalExploreOptional();
  const [data, setData] = useState<CourseRecommendationResponseWire | null>(
    null,
  );
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (preferExplore && explore) {
      if (explore.loading) {
        setLoading(true);
        return;
      }
      if (explore.recommendations) {
        setData(explore.recommendations);
        setError(explore.error);
        setLoading(false);
        return;
      }
      if (explore.error) {
        setError(explore.error);
      }
    }

    setLoading(true);
    try {
      const res = await fetchPortalCourseRecommendations(locale);
      setData(res);
      setError(null);
    } catch (e) {
      setData(null);
      setError(
        e instanceof Error ? e.message : 'Không tải được gợi ý khóa học.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    locale,
    preferExplore,
    explore,
    explore?.loading,
    explore?.recommendations,
    explore?.error,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading: Boolean(enabled) && loading,
    error,
    refresh: load,
  };
}
