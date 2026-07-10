import {
	DEFAULT_GAME_SLUG,
	promptTypeToSlug,
	resolveGameSlugFromPromptType,
} from '@/features/learning/games/catalog/game-catalog.registry';
import {
	buildGamePlayingHref,
	buildGameReadyHref,
	buildGameResultHref,
	type GameRouteQuery,
} from '@/features/learning/games/session/game-route.utils';

/** Ready href khi biết promptType assignment (sau fetch context). */
export function buildGameReadyHrefForAssignment(
	classId: number,
	assignmentId: number,
	promptType?: string | null,
	modeId?: string | null,
): string {
	const slug = promptType ? (promptTypeToSlug(promptType) ?? DEFAULT_GAME_SLUG) : DEFAULT_GAME_SLUG;
	return buildGameReadyHref(slug, { classId, assignmentId, modeId: modeId ?? undefined });
}

/**
 * Redirect khi URL slug không khớp promptType assignment/play.
 * Trả href mới hoặc null nếu đã khớp.
 */
export function resolveGameSlugRedirect(
	currentSlug: string,
	promptType: string,
	params: GameRouteQuery,
	segment: 'ready' | 'playing' | 'result' = 'ready',
): string | null {
	const targetSlug = resolveGameSlugFromPromptType(promptType);
	if (targetSlug === currentSlug) return null;

	if (segment === 'playing' && params.playId) {
		return buildGamePlayingHref(targetSlug, { ...params, playId: params.playId });
	}
	if (segment === 'result' && params.playId) {
		return buildGameResultHref(targetSlug, { ...params, playId: params.playId });
	}
	return buildGameReadyHref(targetSlug, params);
}
