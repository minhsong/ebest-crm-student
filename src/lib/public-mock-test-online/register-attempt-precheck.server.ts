import { redirect } from 'next/navigation';
import {
  fetchMockTestOnlineAttemptStatusNoStore,
} from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { resolveAttemptRegisterRedirectPath } from '@/lib/public-mock-test-online/attempt-status-redirect.server';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { fetchCustomerOnlineBootstrapContextSsr } from '@/features/portal-mock-test/server/fetch-customer-bootstrap-context.server';

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

/**
 * P5c — HV portal: resolve omniLeadId qua CRM rồi precheck attempt-status.
 * Không redirect khi không load được context — bootstrap sẽ báo lỗi rõ.
 */
export async function redirectCustomerRegisterIfAttemptBlocked(
  customerId: number,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
): Promise<void> {
  const ctx = await fetchCustomerOnlineBootstrapContextSsr();
  if (!ctx || ctx.customerId !== customerId) return;
  await redirectLeadRegisterIfAttemptBlocked(
    ctx.omniLeadId,
    testTypeCode,
    ctx.phoneE164,
  );
}
