import { slugToPromptType, resolveGameSlugFromPromptType } from '@/features/learning/games/catalog/game-catalog.registry';
import {
	buildGamePlayingHref,
	buildGameReadyHref,
	buildGameResultHref,
	expectedSegmentForPlayStatus,
	type GameUrlSegment,
} from '@/features/learning/games/session/game-route.utils';
import type { DrillSessionResumePayload } from '@/types/learning';

export type ReconcileOutcome =
	| { kind: 'match' }
	| { kind: 'redirect'; href: string }
	| { kind: 'confirm_continue' }
	| { kind: 'invalid'; reason: 'missing_play_id' | 'missing_class' };

type ReconcileInput = {
	gameSlug: string;
	urlSegment: GameUrlSegment;
	playId: string | null;
	classId: number | null;
	play: DrillSessionResumePayload | null;
};

function queryFromPlay(play: DrillSessionResumePayload, classId: number | null) {
	return {
		classId: classId ?? play.classId,
		assignmentId: play.assignmentId,
		playId: play.playId,
		modeId: play.modeId,
	};
}

export function reconcileGameRoute(input: ReconcileInput): ReconcileOutcome {
	const { gameSlug, urlSegment, playId, classId, play } = input;
	const expectedPrompt = slugToPromptType(gameSlug);

	if (urlSegment === 'playing' || urlSegment === 'result') {
		if (!playId) {
			return { kind: 'invalid', reason: 'missing_play_id' };
		}
	}

	if (!playId) {
		if (urlSegment === 'ready') {
			return { kind: 'match' };
		}
		return {
			kind: 'redirect',
			href: buildGameReadyHref(gameSlug, { classId, modeId: 'survival' }),
		};
	}

	if (!play) {
		return {
			kind: 'redirect',
			href: buildGameReadyHref(gameSlug, { classId, modeId: 'survival' }),
		};
	}

	const correctSlug = resolveGameSlugFromPromptType(play.promptType);
	const segmentForStatus = expectedSegmentForPlayStatus(play.status);
	const params = queryFromPlay(play, classId);

	if (expectedPrompt && play.promptType !== expectedPrompt) {
		const href =
			segmentForStatus === 'playing'
				? buildGamePlayingHref(correctSlug, params)
				: buildGameResultHref(correctSlug, params);
		return { kind: 'redirect', href };
	}

	if (gameSlug !== correctSlug) {
		const href =
			segmentForStatus === 'playing'
				? buildGamePlayingHref(correctSlug, params)
				: buildGameResultHref(correctSlug, params);
		return { kind: 'redirect', href };
	}

	if (urlSegment === 'playing' && play.status === 'in_progress') {
		if (!classId && play.classId) {
			return { kind: 'redirect', href: buildGamePlayingHref(gameSlug, params) };
		}
		return { kind: 'match' };
	}

	if (urlSegment === 'playing' && play.status !== 'in_progress') {
		return {
			kind: 'redirect',
			href: buildGameResultHref(gameSlug, params),
		};
	}

	if (urlSegment === 'result' && play.status !== 'in_progress') {
		if (!classId && play.classId) {
			return { kind: 'redirect', href: buildGameResultHref(gameSlug, params) };
		}
		return { kind: 'match' };
	}

	if (urlSegment === 'result' && play.status === 'in_progress') {
		return { kind: 'confirm_continue' };
	}

	if (urlSegment === 'ready' && play.status === 'in_progress') {
		return { kind: 'confirm_continue' };
	}

	if (urlSegment === 'ready' && play.status !== 'in_progress' && playId) {
		return {
			kind: 'redirect',
			href: buildGameResultHref(gameSlug, params),
		};
	}

	return { kind: 'match' };
}
