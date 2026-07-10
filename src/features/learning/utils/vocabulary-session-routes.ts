export function vocabularySessionDetailHref(classId: number, classSessionId: number): string {
	return `/learning/vocabulary/sessions/${classSessionId}?classId=${classId}`;
}

export function flashcardSessionHref(classId: number, classSessionId: number): string {
	return `/learning/flashcard?classId=${classId}&classSessionId=${classSessionId}`;
}

import { buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';
import { DEFAULT_GAME_SLUG } from '@/features/learning/games/catalog/game-catalog.registry';

/** Lobby game luyện từ — mặc định meaning-to-word (Q2). */
export function vocabularyPracticeHref(classId: number): string {
	return buildGameReadyHref(DEFAULT_GAME_SLUG, { classId, modeId: 'survival' });
}

export function vocabularyGamesHref(query = ''): string {
	return query ? `/learning/games?${query}` : '/learning/games';
}

export function vocabularySessionBestOfHref(
	classId: number,
	classSessionId: number,
	slug = DEFAULT_GAME_SLUG,
): string {
	return buildGameReadyHref(slug, {
		classId,
		classSessionId,
		modeId: 'pool_coverage',
	});
}

export function vocabularyLeaderboardHref(
	classId: number,
	filters?: { promptType?: string; modeId?: string },
): string {
	const qs = new URLSearchParams({ classId: String(classId) });
	if (filters?.promptType?.trim()) {
		qs.set('promptType', filters.promptType.trim());
	}
	if (filters?.modeId?.trim()) {
		qs.set('modeId', filters.modeId.trim());
	}
	return `/learning/games/leaderboard?${qs.toString()}`;
}

/** Danh sách bài tập game (vocabulary drill) — không play ngay. */
export function vocabularyGameAssignmentsHref(): string {
	return '/learning/games/assignments';
}

export function vocabularyHomeHref(classId?: number, fallback = '/learning/vocabulary'): string {
	return classId && classId > 0 ? `/learning/vocabulary?classId=${classId}` : fallback;
}

export function vocabularySessionsBrowseHref(classId: number): string {
	return `/learning/vocabulary?classId=${classId}&view=sessions`;
}

export function flashcardBackHref(classId: number, classSessionId: number): string {
	if (Number.isFinite(classId) && Number.isFinite(classSessionId)) {
		return vocabularySessionDetailHref(classId, classSessionId);
	}
	return '/learning/vocabulary';
}
