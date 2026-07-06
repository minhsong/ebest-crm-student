import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { fetchMockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { fetchGatewayLeadPendingAttemptContext } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';

/** Attempt-status cho trang đăng ký — lead cookie hoặc guest pending. */
export async function resolveRegisterAttemptStatus(input: {
	session: PortalSessionPayload;
	pendingLeadId?: string;
}): Promise<MockTestOnlineAttemptStatus | null> {
	const typeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE;

	if (input.session.actor === 'lead') {
		return fetchMockTestOnlineAttemptStatus(input.session.omniLeadId, typeCode, {
			phoneNormalized: input.session.profile.phoneE164,
		});
	}

	const pendingLeadId = input.pendingLeadId?.trim();
	if (!pendingLeadId) return null;

	const ctx = await fetchGatewayLeadPendingAttemptContext(pendingLeadId);
	if (!ctx?.omniLeadId) return null;

	return fetchMockTestOnlineAttemptStatus(ctx.omniLeadId, typeCode, {
		phoneNormalized: ctx.primaryPhoneE164,
	});
}
