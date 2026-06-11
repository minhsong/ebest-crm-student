import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	fetchAssignmentDrillContext,
	fetchVocabularyPool,
	fetchWeakWords,
} from '@/lib/learning-api';
import { parseLearningAccess } from '@/features/learning/utils/learning-access';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
	WeakWordsPayload,
} from '@/types/learning';

export type DrillGameMode = 'survival' | 'audio_to_word';

type PoolParams = {
	classId: number | null;
	assignmentId: number | null;
};

export function useDrillPracticePool({ classId, assignmentId }: PoolParams) {
	const [assignmentCtx, setAssignmentCtx] = useState<AssignmentDrillContextPayload | null>(null);
	const [gameMode, setGameMode] = useState<DrillGameMode>('survival');
	const [pool, setPool] = useState<VocabularyPoolPayload | null>(null);
	const [poolLoading, setPoolLoading] = useState(true);
	const [poolError, setPoolError] = useState<string | null>(null);

	const [weakWords, setWeakWords] = useState<WeakWordsPayload | null>(null);
	const [weakWordsLoading, setWeakWordsLoading] = useState(false);

	const loadPool = useCallback(async () => {
		if (assignmentId && !Number.isNaN(assignmentId)) {
			setPoolLoading(true);
			setPoolError(null);
			try {
				const ctx = await fetchAssignmentDrillContext(assignmentId);
				setAssignmentCtx(ctx);
				if (classId && classId !== ctx.classId) {
					setPoolError('classId không khớp với bài tập.');
					return;
				}
				const effectiveClassId = classId ?? ctx.classId;
				const data = await fetchVocabularyPool(effectiveClassId);
				setPool(data);
			} catch (err) {
				setPoolError(err instanceof Error ? err.message : 'Không tải được bài luyện từ.');
			} finally {
				setPoolLoading(false);
			}
			return;
		}

		if (!classId || Number.isNaN(classId)) {
			setPoolLoading(false);
			setPoolError('Chọn lớp trên trang Học tập để bắt đầu luyện.');
			return;
		}

		setPoolLoading(true);
		setPoolError(null);
		try {
			const data = await fetchVocabularyPool(classId);
			setPool(data);
		} catch (err) {
			setPoolError(err instanceof Error ? err.message : 'Không tải được pool từ vựng.');
		} finally {
			setPoolLoading(false);
		}
	}, [classId, assignmentId]);

	const effectiveClassId = assignmentCtx?.classId ?? classId;

	const resolvedGameMode = useMemo((): DrillGameMode => {
		if (assignmentCtx?.gameMode === 'audio_to_word') return 'audio_to_word';
		if (assignmentCtx?.gameMode === 'survival') return 'survival';
		return gameMode;
	}, [assignmentCtx, gameMode]);

	const canStart = useMemo(() => {
		if (assignmentCtx) {
			return Boolean(assignmentCtx.canPlay && assignmentCtx.assignmentPoolSize > 0);
		}
		const access = parseLearningAccess(pool?.learningAccess);
		return Boolean(pool?.practiceEnabled && access.canRecordEvents);
	}, [assignmentCtx, pool]);

	useEffect(() => {
		void loadPool();
	}, [loadPool]);

	useEffect(() => {
		if (!classId || Number.isNaN(classId) || assignmentId) {
			setWeakWords(null);
			return;
		}
		setWeakWordsLoading(true);
		void fetchWeakWords(classId)
			.then(setWeakWords)
			.catch(() => setWeakWords(null))
			.finally(() => setWeakWordsLoading(false));
	}, [classId, assignmentId]);

	const refreshWeakWords = useCallback(async () => {
		if (!classId || Number.isNaN(classId)) return;
		try {
			setWeakWords(await fetchWeakWords(classId));
		} catch {
			// Giữ dữ liệu cũ nếu refresh thất bại
		}
	}, [classId]);

	const refreshAssignmentContext = useCallback(async () => {
		if (!assignmentId || Number.isNaN(assignmentId)) return;
		try {
			setAssignmentCtx(await fetchAssignmentDrillContext(assignmentId));
		} catch {
			// Giữ trạng thái cũ nếu refresh context thất bại
		}
	}, [assignmentId]);

	return {
		assignmentCtx,
		gameMode,
		setGameMode,
		pool,
		poolLoading,
		poolError,
		loadPool,
		effectiveClassId,
		resolvedGameMode,
		canStart,
		weakWords,
		weakWordsLoading,
		refreshWeakWords,
		refreshAssignmentContext,
	};
}
