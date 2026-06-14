export function vocabularySessionDetailHref(classId: number, classSessionId: number): string {
	return `/learning/vocabulary/sessions/${classSessionId}?classId=${classId}`;
}

export function flashcardSessionHref(classId: number, classSessionId: number): string {
	return `/learning/flashcard?classId=${classId}&classSessionId=${classSessionId}`;
}

/** Lobby game luyện từ (Survival, pool coverage, resume playId). */
export function vocabularyPracticeHref(classId: number): string {
	return `/learning/games?classId=${classId}`;
}

export function vocabularyGamesHref(query = ''): string {
	return query ? `/learning/games?${query}` : '/learning/games';
}

export function vocabularyLeaderboardHref(classId: number): string {
	return `/learning/games/leaderboard?classId=${classId}`;
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
