import type {
  AssignmentDrillContextPayload,
  DrillAnswerResult,
	DrillLeaderboardPayload,
	DrillSessionClient,
	DrillSessionResumePayload,
	LearningEventItem,
	LearningHubPayload,
	LearningVocabularyPayload,
	LearningVocabularySessionsPayload,
	VocabularyPoolPayload,
	FlashcardSessionPayload,
	WeakWordsPayload,
} from '@/types/learning';

async function parseJsonResponse<T>(res: Response, fallback: string): Promise<T> {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const message =
			typeof (data as { message?: string })?.message === 'string'
				? (data as { message: string }).message
				: fallback;
		const err = new Error(message) as Error & { code?: string; status?: number };
		if (typeof (data as { code?: string })?.code === 'string') {
			err.code = (data as { code: string }).code;
		}
		err.status = res.status;
		throw err;
	}
	return data as T;
}

export async function fetchLearningHub(): Promise<LearningHubPayload> {
	const res = await fetch('/api/student/learning/hub', { cache: 'no-store' });
	return parseJsonResponse(res, 'Không tải được trang Học tập.');
}

export async function fetchSessionVocabulary(
	classId: number,
	classSessionId: number,
): Promise<LearningVocabularyPayload> {
	const res = await fetch(
		`/api/student/learning/classes/${classId}/sessions/${classSessionId}/vocabulary`,
		{ cache: 'no-store' },
	);
	return parseJsonResponse(res, 'Không tải được danh sách từ vựng.');
}

export async function fetchClassVocabularySessions(
	classId: number,
): Promise<LearningVocabularySessionsPayload> {
	const res = await fetch(
		`/api/student/learning/classes/${classId}/vocabulary-sessions`,
		{ cache: 'no-store' },
	);
	return parseJsonResponse(res, 'Không tải được danh sách buổi có từ vựng.');
}

export async function fetchVocabularyPool(classId: number): Promise<VocabularyPoolPayload> {
	const res = await fetch(
		`/api/student/learning/classes/${classId}/vocabulary-pool`,
		{ cache: 'no-store' },
	);
	return parseJsonResponse(res, 'Không tải được pool từ vựng.');
}

export async function startDrillSession(
  classId: number,
  options?: { gameMode?: string; assignmentId?: number },
): Promise<DrillSessionClient> {
  const res = await fetch('/api/learning-drill-runtime/plays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classId,
      gameMode: options?.gameMode ?? 'survival',
      assignmentId: options?.assignmentId,
    }),
  });
  return parseJsonResponse(res, 'Không bắt đầu được lượt luyện.');
}

export async function fetchAssignmentDrillContext(
  assignmentId: number,
): Promise<AssignmentDrillContextPayload> {
  const res = await fetch(
    `/api/student/learning/drill/assignments/${assignmentId}/context`,
    { cache: 'no-store' },
  );
  return parseJsonResponse(res, 'Không tải được thông tin bài luyện từ.');
}

export async function fetchDrillSession(playId: string): Promise<DrillSessionResumePayload> {
	const res = await fetch(`/api/learning-drill-runtime/plays/${playId}`, {
		cache: 'no-store',
	});
	return parseJsonResponse(res, 'Không khôi phục được lượt luyện.');
}

export async function submitDrillAnswer(
	playId: string,
	questionId: string,
	options?: { selectedOptionId?: string; timedOut?: boolean },
): Promise<DrillAnswerResult> {
	const body: Record<string, unknown> = { questionId };
	if (options?.selectedOptionId) {
		body.selectedOptionId = options.selectedOptionId;
	}
	if (options?.timedOut) {
		body.timedOut = true;
	}
	const res = await fetch(`/api/learning-drill-runtime/plays/${playId}/answer`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return parseJsonResponse(res, 'Không gửi được câu trả lời.');
}

export async function fetchDrillLeaderboard(
	classId: number,
	scope: 'class' | 'course',
	period: 'week' | 'month' | 'all',
	options?: { refresh?: boolean },
): Promise<DrillLeaderboardPayload> {
	const qs = new URLSearchParams({
		classId: String(classId),
		scope,
		period,
	});
	if (options?.refresh) {
		qs.set('_', String(Date.now()));
	}
	const res = await fetch(`/api/student/learning/leaderboards?${qs.toString()}`, {
		cache: 'no-store',
	});
	return parseJsonResponse(res, 'Không tải được bảng xếp hạng.');
}

export async function postLearningEvents(events: LearningEventItem[]): Promise<void> {
	const res = await fetch('/api/student/learning/events', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ events }),
	});
	await parseJsonResponse(res, 'Không ghi được tiến độ học tập.');
}

export async function fetchWeakWords(
	classId: number,
	limit?: number,
): Promise<WeakWordsPayload> {
	const qs = new URLSearchParams({ classId: String(classId) });
	if (limit != null) {
		qs.set('limit', String(limit));
	}
	const res = await fetch(`/api/student/learning/analytics/weak-words?${qs.toString()}`, {
		cache: 'no-store',
	});
	return parseJsonResponse(res, 'Không tải được danh sách từ hay sai.');
}

export async function startFlashcardSession(
	classId: number,
	classSessionId: number,
): Promise<FlashcardSessionPayload> {
	const res = await fetch('/api/learning-flashcard-runtime/sessions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ classId, classSessionId }),
	});
	return parseJsonResponse(res, 'Không bắt đầu được phiên flashcard.');
}

export async function reviewFlashcardCard(
	sessionId: string,
	assetId: number,
	selfRating: 'known' | 'unknown',
): Promise<{ summary: FlashcardSessionPayload['summary'] }> {
	const res = await fetch(`/api/learning-flashcard-runtime/sessions/${sessionId}/review`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ assetId, selfRating }),
	});
	return parseJsonResponse(res, 'Không ghi được đánh giá thẻ.');
}

export async function completeFlashcardSession(
	sessionId: string,
): Promise<FlashcardSessionPayload> {
	const res = await fetch(`/api/learning-flashcard-runtime/sessions/${sessionId}/complete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	return parseJsonResponse(res, 'Không hoàn thành được phiên flashcard.');
}
