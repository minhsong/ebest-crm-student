import type { LearningVocabularyLearningAccess } from '@/types/learning';

export function parseLearningAccess(access?: LearningVocabularyLearningAccess | null) {
	return {
		canRecordEvents: access?.canRecordEvents !== false,
		readOnlyReason: access?.readOnlyReason ?? null,
	};
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
