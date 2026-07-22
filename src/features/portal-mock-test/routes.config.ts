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
 * Path Lead chưa hoàn thiện hồ sơ vẫn được vào (exam.start / exam.resume / funnel).
 * Hub/dashboard KHÔNG nằm trong danh sách — PO-D19: hoàn thiện hồ sơ trước khi
 * vào dashboard/results. Route đích vẫn tự guard capability server-side.
 */
export function isLeadIncompleteProfileAllowedPath(pathname: string): boolean {
  const n = pathname.replace(/\/$/, '') || '/';
  if (n === PORTAL_MOCK_TEST_ROUTES.onlineStart) return true;
  if (n.startsWith(`${PORTAL_MOCK_TEST_ROUTES.onlineStart}/`)) return true;
  if (isPortalMockTestFunnelPath(n)) return true;
  if (n === '/lead/complete-profile' || n.startsWith('/lead/complete-profile/')) {
    return true;
  }
  return false;
}
