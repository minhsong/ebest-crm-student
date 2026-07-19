/**
 * SSOT URL — hub thi thử portal (actor-agnostic).
 * Funnel GW giữ namespace /mock-test-online (cookie mto_*).
 */
export const PORTAL_MOCK_TEST_ROUTES = {
  hub: '/mock-test',
  results: '/mock-test/results',
  offline: '/mock-test/offline',
  onlineStart: '/mock-test/online/start',
  onlineRegisterGuest: '/mock-test-online/register',
  onlineSelect: '/mock-test-online/select-exam',
  onlineConfirm: '/mock-test-online/confirm-exam',
  onlineExamRun: '/mock-test-online/exam/run',
  offlinePublic: '/mock-test-register',
} as const;

export const PORTAL_MOCK_TEST_API = {
  bootstrapOnline: '/api/mock-test/bootstrap-online',
  offlineRegister: '/api/mock-test/offline-register',
} as const;

/** Legacy alias — redirect tới results. */
export const LEGACY_LEAD_TESTS_PATH = '/lead/tests';

export function isPortalMockTestHubPath(pathname: string): boolean {
  const n = pathname.replace(/\/$/, '') || '/';
  return n === PORTAL_MOCK_TEST_ROUTES.hub || n.startsWith(`${PORTAL_MOCK_TEST_ROUTES.hub}/`);
}

export function isPortalMockTestFunnelPath(pathname: string): boolean {
  return pathname.startsWith('/mock-test-online');
}

/**
 * Path Lead chưa hoàn thiện hồ sơ vẫn được vào (exam.start / exam.resume).
 * Route đích vẫn tự guard capability server-side.
 */
export function isLeadIncompleteProfileAllowedPath(pathname: string): boolean {
  const n = pathname.replace(/\/$/, '') || '/';
  if (n === PORTAL_MOCK_TEST_ROUTES.hub) return true;
  if (n === PORTAL_MOCK_TEST_ROUTES.onlineStart) return true;
  if (n.startsWith(`${PORTAL_MOCK_TEST_ROUTES.onlineStart}/`)) return true;
  if (isPortalMockTestFunnelPath(n)) return true;
  if (n === '/lead/complete-profile' || n.startsWith('/lead/complete-profile/')) {
    return true;
  }
  return false;
}
