'use client';

import { useEffect, useState } from 'react';
import type { CourseRecommendationResponseWire } from '@/lib/portal-recommendations/types';
import { DEFAULT_PORTAL_LOCALE } from '@/lib/portal-course-catalog/types';

type State = {
  loading: boolean;
  error: string | null;
  data: CourseRecommendationResponseWire | null;
};

export function usePortalRecommendations(
  locale: string = DEFAULT_PORTAL_LOCALE,
): State {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/portal/recommendations?locale=${encodeURIComponent(locale)}`,
          { cache: 'no-store' },
        );
        if (res.status === 401) {
          if (!cancelled) {
            setState({ loading: false, error: null, data: null });
          }
          return;
        }
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        } & Partial<CourseRecommendationResponseWire>;
        if (!res.ok) {
          throw new Error(body.message ?? 'Không tải được gợi ý khóa học.');
        }
        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            data: body as CourseRecommendationResponseWire,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e instanceof Error ? e.message : 'Không tải được gợi ý khóa học.',
            data: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return state;
}
