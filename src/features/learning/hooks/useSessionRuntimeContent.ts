'use client';

import { useEffect, useState } from 'react';
import { fetchSessionRuntimeContent } from '@/lib/learning-api';
import type { SessionKnowledgeLesson } from '@/types/learning';
import {
	getSessionUnlockErrorMessage,
	parseLearningAccess,
} from '@/features/learning/utils/learning-access';

type Options = {
	classId: number;
	classSessionId: number;
};

export function useSessionRuntimeContent({ classId, classSessionId }: Options) {
	const [lessons, setLessons] = useState<SessionKnowledgeLesson[]>([]);
	const [sessionTitle, setSessionTitle] = useState<string | null>(null);
	const [emptyReason, setEmptyReason] = useState<string | null>(null);
	const [readOnlyReason, setReadOnlyReason] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!classId || !classSessionId) {
			setLoading(false);
			setError('Thiếu thông tin buổi học.');
			return;
		}

		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const payload = await fetchSessionRuntimeContent(classId, classSessionId);
				if (cancelled) return;
				const access = parseLearningAccess(payload.learningAccess);
				setLessons(payload.lessons ?? []);
				setSessionTitle(payload.sessionTitle?.trim() || null);
				setEmptyReason(payload.emptyReason ?? null);
				setReadOnlyReason(access.readOnlyReason);
			} catch (e) {
				if (!cancelled) {
					setError(
						getSessionUnlockErrorMessage(
							e as Error & { code?: string },
							'Không tải được nội dung bài học.',
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
	}, [classId, classSessionId]);

	return {
		lessons,
		sessionTitle,
		emptyReason,
		readOnlyReason,
		loading,
		error,
	};
}
