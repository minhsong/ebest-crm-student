'use client';

import { useEffect, useState } from 'react';
import { getClassVocabularySessionsCached } from '@/lib/class-vocabulary-sessions-cache';
import type { LearningVocabularySessionListItem } from '@/types/learning';
import { parseLearningAccess } from '@/features/learning/utils/learning-access';

export function useClassVocabularySessionsList(classId: number) {
	const [loading, setLoading] = useState(() => Number.isFinite(classId) && classId >= 1);
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<LearningVocabularySessionListItem[]>([]);
	const [canRecordEvents, setCanRecordEvents] = useState(true);
	const [readOnlyReason, setReadOnlyReason] = useState<string | null>(null);

	useEffect(() => {
		if (!Number.isFinite(classId) || classId < 1) {
			setLoading(false);
			setSessions([]);
			setError(null);
			setCanRecordEvents(true);
			setReadOnlyReason(null);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		getClassVocabularySessionsCached(classId)
			.then((payload) => {
				if (cancelled) return;
				const access = parseLearningAccess(payload.learningAccess);
				setSessions(payload.sessions ?? []);
				setCanRecordEvents(access.canRecordEvents);
				setReadOnlyReason(access.readOnlyReason);
			})
			.catch((e) => {
				if (!cancelled) {
					setSessions([]);
					setError(e instanceof Error ? e.message : 'Không tải được buổi có từ vựng.');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [classId]);

	return { loading, error, sessions, canRecordEvents, readOnlyReason };
}
