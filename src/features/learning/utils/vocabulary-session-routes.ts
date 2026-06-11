export function vocabularySessionDetailHref(classId: number, classSessionId: number): string {
	return `/learning/vocabulary/sessions/${classSessionId}?classId=${classId}`;
}

export function flashcardSessionHref(classId: number, classSessionId: number): string {
	return `/learning/flashcard?classId=${classId}&classSessionId=${classSessionId}`;
}

export function vocabularyPracticeHref(classId: number): string {
	return `/learning/practice?classId=${classId}`;
}

export function vocabularyHomeHref(classId?: number, fallback = '/learning/vocabulary'): string {
	return classId && classId > 0 ? `/learning/vocabulary?classId=${classId}` : fallback;
}

export function flashcardBackHref(classId: number, classSessionId: number): string {
	if (Number.isFinite(classId) && Number.isFinite(classSessionId)) {
		return vocabularySessionDetailHref(classId, classSessionId);
	}
	return '/learning/vocabulary';
}
