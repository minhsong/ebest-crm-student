import type {
  AssignmentDrillContextPayload,
  DrillAnswerResult,
	DrillLeaderboardPayload,
	DrillSessionClient,
	LearningEventItem,
	LearningHubPayload,
	LearningVocabularyPayload,
	LearningVocabularySessionsPayload,
	VocabularyPoolPayload,
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
  const res = await fetch('/api/student/learning/drill/sessions', {
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

export async function submitDrillAnswer(
	playId: string,
	questionId: string,
	selectedOptionId: string,
): Promise<DrillAnswerResult> {
	const res = await fetch(`/api/student/learning/drill/sessions/${playId}/answer`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ questionId, selectedOptionId }),
	});
	return parseJsonResponse(res, 'Không gửi được câu trả lời.');
}

export async function fetchDrillLeaderboard(
	classId: number,
	scope: 'class' | 'course',
	period: 'week' | 'month' | 'all',
): Promise<DrillLeaderboardPayload> {
	const qs = new URLSearchParams({
		classId: String(classId),
		scope,
		period,
	}).toString();
	const res = await fetch(`/api/student/learning/leaderboards?${qs}`, {
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
