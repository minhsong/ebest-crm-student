import {
	normalizeVocabularyDrillGameConfig,
	formatSpellingDifficultyLabel,
	formatVocabularyDrillPromptTypeLabel,
} from '@ebest/game-vocabulary-drill';
import {
	DEFAULT_GAME_SLUG,
	promptTypeToSlug,
} from '@/features/learning/games/catalog/game-catalog.registry';
import { buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';

export {
	formatSpellingDifficultyLabel,
	formatVocabularyDrillPromptTypeLabel,
};

/** Parse checklist `gameConfig` — SSOT `@ebest/game-vocabulary-drill`. */
export function parseChecklistGameConfig(
	raw: Record<string, unknown> | null | undefined,
) {
	return normalizeVocabularyDrillGameConfig(raw);
}

export function buildChecklistGameReadyHref(
	classId: number,
	checklistId: number,
	gameConfig: Record<string, unknown> | null | undefined,
): string {
	const parsed = normalizeVocabularyDrillGameConfig(gameConfig);
	const slug = parsed
		? (promptTypeToSlug(parsed.promptType) ?? DEFAULT_GAME_SLUG)
		: DEFAULT_GAME_SLUG;

	return buildGameReadyHref(slug, {
		classId,
		checklistId,
		modeId: 'pool_coverage',
	});
}
