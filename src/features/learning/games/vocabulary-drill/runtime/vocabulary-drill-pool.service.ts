import { parseLearningAccess } from '@/features/learning/utils/learning-access';
import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
} from '@/types/learning';
import { DEFAULT_SPELLING_DIFFICULTY } from '@/features/learning/games/vocabulary-drill/spelling.constants';

const DEFAULT_SELECTION: DrillPracticeSelection = {
	modeId: 'survival',
	promptType: 'meaning_to_word',
	sessionDurationSec: 90,
};

export function defaultVocabularyDrillSelection(): DrillPracticeSelection {
	return { ...DEFAULT_SELECTION };
}

/** SSOT selection theo ngữ cảnh route (assignment / checklist / free practice). */
export function resolveVocabularyDrillSelection(input: {
	selection: DrillPracticeSelection;
	assignmentCtx: AssignmentDrillContextPayload | null;
	checklistId?: number | null;
	promptTypeFromSlug?: DrillPracticeSelection['promptType'] | null;
}): DrillPracticeSelection {
	if (input.checklistId) {
		return {
			modeId: 'pool_coverage',
			promptType: input.promptTypeFromSlug ?? 'meaning_to_word',
		};
	}
	if (input.assignmentCtx) {
		return {
			modeId: input.assignmentCtx.modeId,
			promptType: input.assignmentCtx.promptType,
			...(input.assignmentCtx.promptType === 'spelling'
				? {
						spellingDifficulty:
							input.assignmentCtx.spellingDifficulty ?? DEFAULT_SPELLING_DIFFICULTY,
					}
				: {}),
		};
	}
	if (input.promptTypeFromSlug) {
		return {
			...input.selection,
			promptType: input.promptTypeFromSlug,
			spellingDifficulty:
				input.promptTypeFromSlug === 'spelling'
					? (input.selection.spellingDifficulty ?? DEFAULT_SPELLING_DIFFICULTY)
					: undefined,
		};
	}
	return input.selection;
}

/** Đồng bộ lobby selection sau authorize / prefetch checklist (sessionConfig SSOT). */
export function selectionFromVocabularyDrillSessionConfig(
	sessionConfig: GameSessionConfig,
): DrillPracticeSelection {
	return {
		modeId: sessionConfig.modeId,
		promptType: sessionConfig.promptType,
		...(sessionConfig.modeId === 'speed_run' &&
		sessionConfig.rules.sessionDurationSec != null
			? {
					sessionDurationSec: sessionConfig.rules.sessionDurationSec as 60 | 90 | 120,
				}
			: {}),
		...(sessionConfig.promptType === 'spelling'
			? {
					spellingDifficulty:
						sessionConfig.rules.spellingDifficulty ?? DEFAULT_SPELLING_DIFFICULTY,
				}
			: {}),
	};
}

export function resolveVocabularyDrillCanStart(input: {
	classId: number | null;
	checklistId?: number | null;
	assignmentCtx: AssignmentDrillContextPayload | null;
	pool: VocabularyPoolPayload | null;
}): boolean {
	if (input.checklistId) {
		return Boolean(input.classId && !Number.isNaN(input.classId));
	}
	if (input.assignmentCtx) {
		return Boolean(
			input.assignmentCtx.canPlay && input.assignmentCtx.assignmentPoolSize > 0,
		);
	}
	const access = parseLearningAccess(input.pool?.learningAccess);
	return Boolean(input.pool?.practiceEnabled && access.canRecordEvents);
}

export function resolveVocabularyDrillStartBlockReason(input: {
	assignmentCtx: AssignmentDrillContextPayload | null;
	pool: VocabularyPoolPayload | null;
	checklistId?: number | null;
}): string | null {
	if (input.assignmentCtx) {
		if (!input.assignmentCtx.canPlay) {
			return (
				input.assignmentCtx.learningAccess?.readOnlyReason ??
				'Bạn chưa thể làm bài luyện từ này.'
			);
		}
		if (input.assignmentCtx.assignmentPoolSize <= 0) {
			return 'Chưa có từ vựng unlock phù hợp với phạm vi bài tập.';
		}
	}
	if (!input.assignmentCtx && !input.checklistId && input.pool) {
		const access = parseLearningAccess(input.pool.learningAccess);
		if (!input.pool.practiceEnabled) {
			return 'Luyện tập chưa được bật cho lớp này.';
		}
		if (!access.canRecordEvents) {
			return access.readOnlyReason ?? 'Bạn chưa thể ghi nhận kết quả luyện tập.';
		}
	}
	return null;
}
