import type { LearningHubPayload } from '@/types/learning';

export function isLearningHubNoEnrollment(
	data: LearningHubPayload | null | undefined,
): boolean {
	if (!data?.context?.messageCode) {
		return false;
	}
	return (
		data.context.messageCode === 'NO_ENROLLMENT' ||
		data.context.messageCode === 'NO_ACTIVE_ENROLLMENT'
	);
}
