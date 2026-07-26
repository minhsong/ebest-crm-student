import { redirect } from 'next/navigation';
import {
  fetchMockTestOnlineAttemptStatusNoStore,
} from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { resolveAttemptRegisterRedirectPath } from '@/lib/public-mock-test-online/attempt-status-redirect.server';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { resolveMtoCallerIdentityFromCookies } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

export {
  MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
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

export type CustomerAttemptPrecheckHints = {
  omniLeadId?: string | null;
  phoneE164?: string | null;
};

/**
 * P5c — HV portal: resolve omniLeadId (session embed → bootstrap fallback) rồi precheck.
 * Không redirect khi không load được identity — bootstrap sẽ báo lỗi rõ.
 */
export async function redirectCustomerRegisterIfAttemptBlocked(
  customerId: number,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  hints?: CustomerAttemptPrecheckHints,
): Promise<void> {
  const hintOmni = hints?.omniLeadId?.trim() || '';
  if (hintOmni) {
    await redirectLeadRegisterIfAttemptBlocked(
      hintOmni,
      testTypeCode,
      hints?.phoneE164,
    );
    return;
  }

  const resolved = await resolveMtoCallerIdentityFromCookies();
  if (
    !resolved.ok ||
    resolved.identity.actor !== 'customer' ||
    resolved.identity.customerId !== customerId
  ) {
    return;
  }
  await redirectLeadRegisterIfAttemptBlocked(
    resolved.identity.omniLeadId,
    testTypeCode,
    resolved.identity.phoneE164,
  );
}
