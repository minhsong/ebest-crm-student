'use client';

import { useEffect, useState } from 'react';
import { fetchSessionVocabulary } from '@/lib/learning-api';
import type { LearningVocabularyItem } from '@/types/learning';
import {
	getSessionUnlockErrorMessage,
	parseLearningAccess,
} from '@/features/learning/utils/learning-access';

type Options = {
	classId: number;
	classSessionId: number;
	missingContextMessage?: string;
	loadErrorFallback?: string;
	unlockErrorMessage?: string;
};

export function useSessionVocabulary({
	classId,
	classSessionId,
	missingContextMessage = 'Thiếu thông tin buổi học.',
	loadErrorFallback = 'Không tải được danh sách từ.',
	unlockErrorMessage,
}: Options) {
	const [items, setItems] = useState<LearningVocabularyItem[]>([]);
	const [sessionTitle, setSessionTitle] = useState<string | null>(null);
	const [courseSessionId, setCourseSessionId] = useState<number | null>(null);
	const [canRecordEvents, setCanRecordEvents] = useState(true);
	const [readOnlyReason, setReadOnlyReason] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!classId || !classSessionId) {
			setLoading(false);
			setError(missingContextMessage);
			return;
		}

		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const payload = await fetchSessionVocabulary(classId, classSessionId);
				if (cancelled) return;
				const access = parseLearningAccess(payload.learningAccess);
				setItems(payload.items ?? []);
				setSessionTitle(payload.sessionTitle?.trim() || null);
				setCourseSessionId(payload.courseSessionId ?? null);
				setCanRecordEvents(access.canRecordEvents);
				setReadOnlyReason(access.readOnlyReason);
			} catch (e) {
				if (!cancelled) {
					setError(
						getSessionUnlockErrorMessage(
							e as Error & { code?: string },
							loadErrorFallback,
							unlockErrorMessage,
						),
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [classId, classSessionId, loadErrorFallback, missingContextMessage, unlockErrorMessage]);

	return {
		items,
		sessionTitle,
		courseSessionId,
		canRecordEvents,
		readOnlyReason,
		loading,
		error,
	};
}
