import type { MockTestOnlinePollStatus } from '@/lib/public-mock-test-online/types';
import type { MockTestOnlineUnlockReadyEvent } from '@/lib/public-mock-test-online/mock-test-online-ws-client';

/** Channel đã verify (product: Zalo; legacy `channel_verified` vẫn accept để đọc poll cũ). */
export function isMockTestOnlineChannelVerified(
	status: MockTestOnlinePollStatus | null | undefined,
): boolean {
	if (!status) return false;
	return (
		Boolean(status.examUnlockActive) ||
		status.status === 'zalo_verified' ||
		status.status === 'channel_verified'
	);
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
