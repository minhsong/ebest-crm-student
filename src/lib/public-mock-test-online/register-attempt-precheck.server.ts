import { redirect } from 'next/navigation';
import {
  fetchMockTestOnlineAttemptStatusNoStore,
} from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { resolveAttemptRegisterRedirectPath } from '@/lib/public-mock-test-online/attempt-status-redirect.server';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';

export {
  MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  PORTAL_MOCK_TEST_DEFAULT_TEST_TYPE,
} from '@/lib/public-mock-test-online/constants';

/**
 * Pre-check lượt thi trước fast-path register/bootstrap (G2).
 * Redirect khi hết lượt; giữ resume qua bootstrap.
 */
export async function redirectLeadRegisterIfAttemptBlocked(
  omniLeadId: string,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  phoneNormalized?: string | null,
): Promise<void> {
  const { status } = await fetchMockTestOnlineAttemptStatusNoStore(
    omniLeadId,
    testTypeCode,
    phoneNormalized?.trim()
      ? { phoneNormalized: phoneNormalized.trim() }
      : undefined,
  );

  const path = resolveAttemptRegisterRedirectPath(status);
  if (path) redirect(path);
}
