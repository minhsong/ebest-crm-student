'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PortalExplorePayload } from '@/lib/portal-course-catalog/types';
import { DEFAULT_PORTAL_LOCALE } from '@/lib/portal-course-catalog/types';
import { fetchPortalExplore } from '@/lib/portal-course-catalog/fetch-portal-explore';

type PortalExploreState = {
  loading: boolean;
  error: string | null;
  explore: PortalExplorePayload | null;
  courses: PortalExplorePayload['courses'];
  siteLinks: PortalExplorePayload['siteLinks'] | null;
  recommendations: PortalExplorePayload['recommendations'] | null;
};

const PortalExploreContext = createContext<PortalExploreState | null>(null);

type ProviderProps = {
  locale?: string;
  children: ReactNode;
};

/** Provider — 1 fetch explore cho toàn layout lead (strip + courses). */
export function PortalExploreProvider({
  locale = DEFAULT_PORTAL_LOCALE,
  children,
}: ProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explore, setExplore] = useState<PortalExplorePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchPortalExplore(locale, {
          includeRecommendations: true,
        });
        if (!cancelled) setExplore(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được nội dung portal.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo<PortalExploreState>(
    () => ({
      loading,
      error,
      explore,
      courses: explore?.courses ?? [],
      siteLinks: explore?.siteLinks ?? null,
      recommendations: explore?.recommendations ?? null,
    }),
    [loading, error, explore],
  );

  return (
    <PortalExploreContext.Provider value={value}>
      {children}
    </PortalExploreContext.Provider>
  );
}

export function usePortalExplore(): PortalExploreState {
  const ctx = useContext(PortalExploreContext);
  if (!ctx) {
    throw new Error('usePortalExplore phải dùng trong PortalExploreProvider.');
  }
  return ctx;
}
