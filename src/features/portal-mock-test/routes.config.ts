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
  offlineRegister: '/api/mock-test/offline-register',
} as const;

export function isPortalMockTestFunnelPath(pathname: string): boolean {
  return pathname.startsWith('/mock-test-online');
}

/**
 * Path Lead chưa hoàn thiện hồ sơ vẫn được vào trước ≥1 bài (PO-D30).
 * Hub `/mock-test` được phép — SSR gate ép complete-profile sau khi đã có bài xong.
 * Results/offline: SSR `assertPortalMockTestAccessWithExamHome`.
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
