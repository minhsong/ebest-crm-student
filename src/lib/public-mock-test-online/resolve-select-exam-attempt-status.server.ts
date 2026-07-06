import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { fetchMockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { fetchGatewayLeadPendingAttemptContext } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';

export type ResolveSelectExamAttemptStatusInput = {
  session: PortalSessionPayload;
  pendingLeadId: string;
  testTypeCode?: string;
  sessionId?: number;
};

/**
 * SSOT attempt-status trên select-exam — lead cookie hoặc guest pending (GW).
 */
export async function resolveSelectExamAttemptStatus(
  input: ResolveSelectExamAttemptStatusInput,
): Promise<MockTestOnlineAttemptStatus | null> {
  const typeCode =
    input.testTypeCode?.trim() || MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE;
  const sessionId = input.sessionId;

  if (input.session.actor === 'lead') {
    return fetchMockTestOnlineAttemptStatus(
      input.session.omniLeadId,
      typeCode,
      {
        sessionId,
        phoneNormalized: input.session.profile.phoneE164,
      },
    );
  }

  const pendingLeadId = input.pendingLeadId.trim();
  if (!pendingLeadId) return null;

  const ctx = await fetchGatewayLeadPendingAttemptContext(pendingLeadId);
  if (!ctx?.omniLeadId) return null;

  return fetchMockTestOnlineAttemptStatus(ctx.omniLeadId, typeCode, {
    sessionId,
    phoneNormalized: ctx.primaryPhoneE164,
  });
}
