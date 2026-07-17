import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { isMockTestOnlineAttemptBlocked } from './mock-test-online-attempt-limit.util';

/** Đường redirect khi attempt status chặn register/bootstrap (G2). */
export function resolveAttemptRegisterRedirectPath(
  status: MockTestOnlineAttemptStatus | null | undefined,
): string | null {
  if (!status || !isMockTestOnlineAttemptBlocked(status)) return null;
  return `${PORTAL_MOCK_TEST_ROUTES.results}?notice=attempt_limit`;
}
