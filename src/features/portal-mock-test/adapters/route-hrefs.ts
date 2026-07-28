import type { PortalMockTestPrincipal } from '../identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { buildLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';

export type MockTestHubAccess = {
  canUse: boolean;
  onlineHref: string;
  offlineHref: string;
  resultsHref: string;
  needsProfileCompletion: boolean;
};

/** SSOT href + gate cho hub và các entry mock-test. */
export function resolveMockTestHubAccess(
  principal: PortalMockTestPrincipal,
  opts?: { hasCompletedOnlineExam?: boolean },
): MockTestHubAccess {
  const hasCompletedOnlineExam = opts?.hasCompletedOnlineExam === true;

  if (principal.actor === 'customer') {
    const incomplete = !principal.profileCompleted;
    // PO-D30: sau ≥1 bài mới cần SĐT để xem điểm / offline.
    const gateAfterExam = incomplete && hasCompletedOnlineExam;
    return {
      canUse: true,
      onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      offlineHref: gateAfterExam
        ? `${PORTAL_MOCK_TEST_ROUTES.hub}?notice=profile_required`
        : PORTAL_MOCK_TEST_ROUTES.offline,
      resultsHref: gateAfterExam
        ? `${PORTAL_MOCK_TEST_ROUTES.hub}?notice=profile_required`
        : PORTAL_MOCK_TEST_ROUTES.results,
      needsProfileCompletion: incomplete,
    };
  }

  if (principal.actor === 'lead') {
    if (!principal.profileCompleted) {
      // Bài đầu: thi online OK; results/offline → wizard (đặc biệt sau ≥1 bài SSR cũng chặn).
      return {
        canUse: true,
        onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
        offlineHref: buildLeadCompleteProfilePath(PORTAL_MOCK_TEST_ROUTES.offline),
        resultsHref: buildLeadCompleteProfilePath(PORTAL_MOCK_TEST_ROUTES.results),
        needsProfileCompletion: true,
      };
    }
    return {
      canUse: true,
      onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      offlineHref: PORTAL_MOCK_TEST_ROUTES.offline,
      resultsHref: PORTAL_MOCK_TEST_ROUTES.results,
      needsProfileCompletion: false,
    };
  }

  const hubLogin = buildPortalLoginHref({
    returnUrl: PORTAL_MOCK_TEST_ROUTES.hub,
  });
  return {
    canUse: false,
    onlineHref: hubLogin,
    offlineHref: hubLogin,
    resultsHref: hubLogin,
    needsProfileCompletion: false,
  };
}
