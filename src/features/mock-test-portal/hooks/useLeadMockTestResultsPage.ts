'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLeadTestResults } from '@/lib/lead-portal/client-api';
import { usePortalSession } from '@/contexts/portal-session-context';
import {
  getLeadSessionSummary,
  getPortalActor,
  isPortalSessionReady,
} from '@/lib/portal-auth/portal-session-selectors';
import {
  PORTAL_MOCK_TEST_RESULTS_ROUTES,
} from '@/lib/portal-auth/session-routes';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import { resolveLeadPostLoginDestination } from '@/lib/portal-auth/resolve-lead-navigation';
import { useMockTestResultsList } from './useMockTestResultsList';

/**
 * Container hook — auth lead (layout đã gate), post-login hub redirect, danh sách kết quả.
 * Không gọi thêm `/api/portal/session` — dùng SSOT `PortalSessionProvider`.
 */
export function useLeadMockTestResultsPage() {
  const router = useRouter();
  const portal = usePortalSession();
  const portalReady = isPortalSessionReady(portal);
  const actor = getPortalActor(portal);
  const profile = getLeadSessionSummary(portal);
  const [authReady, setAuthReady] = useState(false);
  const [authError] = useState<string | null>(null);

  useEffect(() => {
    if (!portalReady) return;

    if (actor === 'customer') {
      router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
      return;
    }
    if (actor !== 'lead' || !profile) {
      router.replace(
        buildPortalLoginHref({
          returnUrl: PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
        }),
      );
      return;
    }

    // Đang ở trang kết quả: giữ results làm intent; incomplete → hub (PO-D30).
    const dest = resolveLeadPostLoginDestination(
      profile,
      PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
    );
    if (dest !== PORTAL_MOCK_TEST_RESULTS_ROUTES.lead) {
      router.replace(dest);
      return;
    }

    setAuthReady(true);
  }, [portalReady, actor, profile, router]);

  const { items, loading, error } = useMockTestResultsList({
    enabled: authReady,
    fetcher: fetchLeadTestResults,
  });

  return {
    items,
    loading: !authReady || loading,
    error: authError ?? error,
    authReady,
  };
}
