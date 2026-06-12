import type {
	LearningHubClass,
	LearningVocabularyLearningAccess,
} from '@/types/learning';

export function parseLearningAccess(access?: LearningVocabularyLearningAccess | null) {
	return {
		canRecordEvents: access?.canRecordEvents !== false,
		readOnlyReason: access?.readOnlyReason ?? null,
	};
}

/** Hub / class row — mặc định true nếu field chưa có (client cũ). */
export function hubClassCanRecordEvents(
	hubClass?: Pick<LearningHubClass, 'canRecordEvents'> | null,
): boolean {
	return hubClass?.canRecordEvents !== false;
}

export function getSessionUnlockErrorMessage(
	err: Error & { code?: string },
	fallback = 'Không tải được dữ liệu.',
	unlockMessage = 'Buổi học chưa diễn ra — chưa thể xem từ vựng buổi này.',
): string {
	if (err.code === 'SESSION_NOT_UNLOCKED') {
		return unlockMessage;
	}
	return err.message || fallback;
}

export function getFlashcardReadOnlyErrorMessage(
	readOnlyReason?: string | null,
): string {
	return readOnlyReason ?? 'Lớp chỉ cho phép xem lại. Không thể luyện flashcard mới.';
}

/** Ghi chú read-only từ API — null nếu không có. */
export function resolveReadOnlyNoticeMessage(
	readOnlyReason?: string | null,
): string | null {
	const trimmed = readOnlyReason?.trim();
	return trimmed || null;
}
