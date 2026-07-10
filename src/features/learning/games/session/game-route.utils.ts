import {
	DEFAULT_GAME_SLUG,
	resolveGameSlugFromPromptType,
} from '@/features/learning/games/catalog/game-catalog.registry';
import { modeIdFromUrlParam, modeIdToUrlParam } from '@/features/learning/games/session/game-mode.utils';

export type GameUrlSegment = 'ready' | 'playing' | 'result';

export type GameRouteQuery = {
	classId?: number | null;
	modeId?: string | null;
	assignmentId?: number | null;
	checklistId?: number | null;
	playId?: string | null;
	classSessionId?: number | null;
};

function gamesBase(slug: string): string {
	return `/learning/games/${slug}`;
}

function appendQuery(href: string, params: GameRouteQuery): string {
	const sp = new URLSearchParams();
	if (params.classId != null && Number.isFinite(params.classId)) {
		sp.set('classId', String(params.classId));
	}
	if (params.modeId) {
		const urlMode = modeIdToUrlParam(params.modeId);
		if (urlMode) sp.set('modeId', urlMode);
	}
	if (params.assignmentId != null && Number.isFinite(params.assignmentId)) {
		sp.set('assignmentId', String(params.assignmentId));
	}
	if (params.checklistId != null && Number.isFinite(params.checklistId)) {
		sp.set('checklistId', String(params.checklistId));
	}
	if (params.playId) {
		sp.set('playId', params.playId);
	}
	if (params.classSessionId != null && Number.isFinite(params.classSessionId)) {
		sp.set('classSessionId', String(params.classSessionId));
	}
	const qs = sp.toString();
	return qs ? `${href}?${qs}` : href;
}

export function buildGameReadyHref(slug: string, params: GameRouteQuery = {}): string {
	return appendQuery(`${gamesBase(slug)}/ready`, params);
}

export function buildGamePlayingHref(slug: string, params: GameRouteQuery & { playId: string }): string {
	return appendQuery(`${gamesBase(slug)}/playing`, params);
}

export function buildGameResultHref(slug: string, params: GameRouteQuery & { playId: string }): string {
	return appendQuery(`${gamesBase(slug)}/result`, params);
}

export function expectedSegmentForPlayStatus(
	status: string,
): 'playing' | 'result' {
	return status === 'in_progress' ? 'playing' : 'result';
}

/** Legacy `/learning/games?…` → route mới (Q2: default meaning-to-word). */
export function resolveLegacyGamesUrl(searchParams: URLSearchParams): string | null {
	const classId = searchParams.get('classId');
	const assignmentId = searchParams.get('assignmentId');
	const checklistId = searchParams.get('checklistId');
	const playId = searchParams.get('playId');
	const modeId = searchParams.get('modeId');

	if (!classId && !assignmentId && !checklistId && !playId) {
		return null;
	}

	const baseParams: GameRouteQuery = {
		classId: classId ? Number(classId) : null,
		assignmentId: assignmentId ? Number(assignmentId) : null,
		checklistId: checklistId ? Number(checklistId) : null,
		modeId: modeIdFromUrlParam(modeId) ?? 'survival',
	};

	if (playId) {
		const slug = DEFAULT_GAME_SLUG;
		return buildGamePlayingHref(slug, { ...baseParams, playId });
	}

	return buildGameReadyHref(DEFAULT_GAME_SLUG, baseParams);
}

export function buildGameRouteForPlay(
	promptType: string,
	status: string,
	params: GameRouteQuery & { playId?: string },
): string {
	const slug = resolveGameSlugFromPromptType(promptType);
	const segment = expectedSegmentForPlayStatus(status);

	if (segment === 'playing' && params.playId) {
		return buildGamePlayingHref(slug, { ...params, playId: params.playId });
	}
	if (segment === 'result' && params.playId) {
		return buildGameResultHref(slug, { ...params, playId: params.playId });
	}
	return buildGameReadyHref(slug, params);
}
