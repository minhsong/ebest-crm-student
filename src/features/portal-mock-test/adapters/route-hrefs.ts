import type { PortalMockTestPrincipal } from '../identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { buildLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';

export type MockTestHubAccess = {
  canUse: boolean;
  onlineHref: string;
  offlineHref: string;
  resultsHref: string;
  needsProfileCompletion: boolean;
};

function loginHref(mode: 'lead' | 'student', returnPath: string): string {
  return `/login?mode=${mode}&returnUrl=${encodeURIComponent(returnPath)}`;
}

/** SSOT href + gate cho hub và các entry mock-test. */
export function resolveMockTestHubAccess(
  principal: PortalMockTestPrincipal,
): MockTestHubAccess {
  if (principal.actor === 'customer') {
    return {
      canUse: true,
      onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      offlineHref: PORTAL_MOCK_TEST_ROUTES.offline,
      resultsHref: PORTAL_MOCK_TEST_ROUTES.results,
      needsProfileCompletion: false,
    };
  }

  if (principal.actor === 'lead') {
    if (!principal.profileCompleted) {
      // exam.start được phép khi thiếu hồ sơ; results/offline vẫn gate.
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

  const hubLogin = loginHref('lead', PORTAL_MOCK_TEST_ROUTES.hub);
  return {
    canUse: false,
    onlineHref: hubLogin,
    offlineHref: hubLogin,
    resultsHref: hubLogin,
    needsProfileCompletion: false,
  };
}
