import { fetchClassVocabularySessions } from '@/lib/learning-api';
import type { LearningVocabularySessionsPayload } from '@/types/learning';

const inflight = new Map<number, Promise<LearningVocabularySessionsPayload>>();
const resolved = new Map<number, LearningVocabularySessionsPayload>();

/** Dedupe fetch vocabulary-sessions theo classId (nhiều SessionCard cùng lớp). */
export function getClassVocabularySessionsCached(
	classId: number,
): Promise<LearningVocabularySessionsPayload> {
	const cached = resolved.get(classId);
	if (cached) {
		return Promise.resolve(cached);
	}

	let pending = inflight.get(classId);
	if (!pending) {
		pending = fetchClassVocabularySessions(classId)
			.then((data) => {
				resolved.set(classId, data);
				inflight.delete(classId);
				return data;
			})
			.catch((err) => {
				inflight.delete(classId);
				throw err;
			});
		inflight.set(classId, pending);
	}
	return pending;
}
