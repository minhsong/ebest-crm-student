import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { fetchMockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';

export type ResolveSelectExamAttemptStatusInput = {
  session: PortalSessionPayload;
  /** @deprecated Funnel — auth-first bỏ qua. */
  pendingLeadId?: string;
  testTypeCode?: string;
  sessionId?: number;
};

/**
 * SSOT attempt-status trên select-exam — auth-first qua omniLeadId / my-exam-home.
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
        phoneNormalized: input.session.profile.phoneE164 ?? undefined,
      },
    );
  }

  if (input.session.actor === 'customer') {
    const home = await fetchPortalMockTestExamHome();
    const omniLeadId = home?.account?.omniLeadId?.trim();
    if (!omniLeadId) {
      // Fallback: activeAttempt từ home nếu CRM đã embed.
      if (home?.attemptStatus) {
        return home.attemptStatus as MockTestOnlineAttemptStatus;
      }
      return null;
    }
    return fetchMockTestOnlineAttemptStatus(omniLeadId, typeCode, {
      sessionId,
      phoneNormalized: home?.account?.phone?.trim() || undefined,
    });
  }

  return null;
}
