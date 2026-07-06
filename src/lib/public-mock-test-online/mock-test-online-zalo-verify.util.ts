import type { MockTestOnlinePollStatus } from '@/lib/public-mock-test-online/types';
import type { MockTestOnlineUnlockReadyEvent } from '@/lib/public-mock-test-online/mock-test-online-ws-client';

export function isMockTestOnlineZaloVerified(
	status: MockTestOnlinePollStatus | null | undefined,
): boolean {
	if (!status) return false;
	return Boolean(status.examUnlockActive) || status.status === 'zalo_verified';
}

export function pollStatusFromUnlockReadyEvent(
	event: MockTestOnlineUnlockReadyEvent,
): MockTestOnlinePollStatus {
	return {
		pendingRegistrationId: event.pendingRegistrationId,
		registrationId: event.registrationId,
		status: event.status,
		zaloVerifiedAt: new Date().toISOString(),
		examUnlockActive: true,
		examUnlockExpiresAt: event.examUnlockExpiresAt,
		pollAfterMs: 0,
		nextStep: 'proceed_to_ready',
		autoProceedAvailable: true,
	};
}
