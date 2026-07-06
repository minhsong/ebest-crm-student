'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchLeadProfile,
  fetchLeadTestResults,
} from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import {
  PORTAL_MOCK_TEST_RESULTS_ROUTES,
  resolvePostLeadLoginPath,
} from '@/lib/portal-auth/session-routes';
import { useMockTestResultsList } from './useMockTestResultsList';

/**
 * Container hook — auth lead (layout đã gate), silent upgrade, danh sách kết quả.
 */
export function useLeadMockTestResultsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchLeadProfile();
        const dest = resolvePostLeadLoginPath(next);
        if (!cancelled && dest !== PORTAL_MOCK_TEST_RESULTS_ROUTES.lead) {
          router.replace(dest);
          return;
        }
        if (!cancelled) setAuthReady(true);
      } catch (e) {
        if (!cancelled) {
          if (isLeadPortalUnauthorizedError(e)) {
            router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
            return;
          }
          setAuthError(
            e instanceof Error ? e.message : 'Không tải được phiên đăng nhập.',
          );
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetcher = useCallback(() => fetchLeadTestResults(), []);

  const { items, loading, error } = useMockTestResultsList({
    enabled: authReady,
    fetcher,
  });

  return {
    items,
    loading: !authReady || loading,
    error: authError ?? error,
    authReady,
  };
}
