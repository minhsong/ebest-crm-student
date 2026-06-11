'use client';

import { useEffect, useState } from 'react';
import { getClassVocabularySessionsCached } from '@/lib/class-vocabulary-sessions-cache';
import { parseLearningAccess } from '@/features/learning/utils/learning-access';

export type ClassVocabularySessionMap = {
	loading: boolean;
	assetCountFor: (classSessionId: number) => number;
	canRecordEvents: boolean;
};

export function useClassVocabularySessionMap(
	classId: number | undefined,
): ClassVocabularySessionMap {
	const [loading, setLoading] = useState(() =>
		Boolean(classId && classId >= 1),
	);
	const [sessionAssetCounts, setSessionAssetCounts] = useState<Map<number, number>>(
		() => new Map(),
	);
	const [canRecordEvents, setCanRecordEvents] = useState(true);

	useEffect(() => {
		if (!classId || classId < 1) {
			setLoading(false);
			setSessionAssetCounts(new Map());
			setCanRecordEvents(true);
			return;
		}

		let cancelled = false;
		setLoading(true);

		getClassVocabularySessionsCached(classId)
			.then((payload) => {
				if (cancelled) return;
				const next = new Map<number, number>();
				for (const row of payload.sessions ?? []) {
					next.set(row.classSessionId, row.assetCount);
				}
				setSessionAssetCounts(next);
				setCanRecordEvents(parseLearningAccess(payload.learningAccess).canRecordEvents);
			})
			.catch(() => {
				if (!cancelled) {
					setSessionAssetCounts(new Map());
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [classId]);

	return {
		loading,
		assetCountFor: (classSessionId) => sessionAssetCounts.get(classSessionId) ?? 0,
		canRecordEvents,
	};
}
