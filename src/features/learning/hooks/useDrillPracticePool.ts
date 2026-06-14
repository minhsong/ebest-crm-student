import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	fetchAssignmentDrillContext,
	fetchVocabularyPool,
	fetchWeakWords,
} from '@/lib/learning-api';
import { authorizeDrillSession, type DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import { parseLearningAccess } from '@/features/learning/utils/learning-access';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
	WeakWordsPayload,
} from '@/types/learning';


export type { DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';

export type DrillPracticeSelection = {
	modeId: 'survival' | 'pool_coverage';
	promptType: 'meaning_to_word' | 'audio_to_word';
};

const DEFAULT_SELECTION: DrillPracticeSelection = {
	modeId: 'survival',
	promptType: 'meaning_to_word',
};

type PoolParams = {
	classId: number | null;
	assignmentId: number | null;
};

export function useDrillPracticePool({ classId, assignmentId }: PoolParams) {
	const [assignmentCtx, setAssignmentCtx] = useState<AssignmentDrillContextPayload | null>(null);
	const [selection, setSelection] = useState<DrillPracticeSelection>(DEFAULT_SELECTION);
	const [pool, setPool] = useState<VocabularyPoolPayload | null>(null);
	const [poolLoading, setPoolLoading] = useState(true);
	const [poolError, setPoolError] = useState<string | null>(null);

	const [weakWords, setWeakWords] = useState<WeakWordsPayload | null>(null);
	const [weakWordsLoading, setWeakWordsLoading] = useState(false);
	const [sessionConfig, setSessionConfig] = useState<GameSessionConfig | null>(null);
	const [authorizeContext, setAuthorizeContext] = useState<DrillStartAuthorizeContext | null>(null);
	const [sessionConfigLoading, setSessionConfigLoading] = useState(false);
	const [sessionConfigError, setSessionConfigError] = useState<string | null>(null);

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

	const resolvedSelection = useMemo((): DrillPracticeSelection => {
		if (assignmentCtx) {
			return {
				modeId: assignmentCtx.modeId,
				promptType: assignmentCtx.promptType,
			};
		}
		return selection;
	}, [assignmentCtx, selection]);

	const canStart = useMemo(() => {
		if (assignmentCtx) {
			return Boolean(assignmentCtx.canPlay && assignmentCtx.assignmentPoolSize > 0);
		}
		const access = parseLearningAccess(pool?.learningAccess);
		return Boolean(pool?.practiceEnabled && access.canRecordEvents);
	}, [assignmentCtx, pool]);

	const startBlockReason = useMemo(() => {
		if (sessionConfigError) {
			return sessionConfigError;
		}
		if (assignmentCtx) {
			if (!assignmentCtx.canPlay) {
				return (
					assignmentCtx.learningAccess?.readOnlyReason ??
					'Bạn chưa thể làm bài luyện từ này.'
				);
			}
			if (assignmentCtx.assignmentPoolSize <= 0) {
				return 'Chưa có từ vựng unlock phù hợp với phạm vi bài tập.';
			}
		}
		if (!assignmentCtx && pool) {
			const access = parseLearningAccess(pool.learningAccess);
			if (!pool.practiceEnabled) {
				return 'Luyện tập chưa được bật cho lớp này.';
			}
			if (!access.canRecordEvents) {
				return access.readOnlyReason ?? 'Bạn chưa thể ghi nhận kết quả luyện tập.';
			}
		}
		return null;
	}, [assignmentCtx, pool, sessionConfigError]);

	useEffect(() => {
		void loadPool();
	}, [loadPool]);

	useEffect(() => {
		if (!effectiveClassId || Number.isNaN(effectiveClassId)) {
			setSessionConfig(null);
			setAuthorizeContext(null);
			setSessionConfigError(null);
			return;
		}
		if (assignmentId && assignmentCtx && !assignmentCtx.canPlay) {
			setSessionConfig(null);
			setAuthorizeContext(null);
			setSessionConfigError(
				assignmentCtx.learningAccess?.readOnlyReason ??
					'Bạn chưa thể làm bài luyện từ này.',
			);
			return;
		}
		if (poolLoading) {
			return;
		}

		let cancelled = false;
		setSessionConfigLoading(true);
		setSessionConfigError(null);

		void authorizeDrillSession(effectiveClassId, {
			assignmentId: assignmentId ?? undefined,
			modeId: resolvedSelection.modeId,
			promptType: resolvedSelection.promptType,
		})
			.then((auth) => {
				if (cancelled) return;
				if (auth.allowed) {
					setSessionConfig(auth.sessionConfig);
					setAuthorizeContext({
						classId: auth.classId,
						courseId: auth.courseId,
						assignmentId: auth.assignmentId,
						sessionConfig: auth.sessionConfig,
						rules: auth.rules,
						pool: auth.pool,
					});
					setSessionConfigError(null);
				} else {
					setSessionConfig(null);
					setAuthorizeContext(null);
					setSessionConfigError(auth.reason ?? 'Không được phép luyện tập.');
				}
			})
			.catch(() => {
				if (!cancelled) {
					setSessionConfig(null);
					setAuthorizeContext(null);
					setSessionConfigError('Không thể xác thực quyền luyện tập.');
				}
			})
			.finally(() => {
				if (!cancelled) setSessionConfigLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		assignmentId,
		assignmentCtx,
		effectiveClassId,
		poolLoading,
		resolvedSelection.modeId,
		resolvedSelection.promptType,
	]);

  useEffect(() => {
    if (!classId || Number.isNaN(classId) || assignmentId) {
      setWeakWords(null);
      return;
    }

    let cancelled = false;
    setWeakWordsLoading(true);

    const loadWeakWords = () => {
      void fetchWeakWords(classId)
        .then((data) => {
          if (!cancelled) setWeakWords(data);
        })
        .catch(() => {
          if (!cancelled) setWeakWords(null);
        })
        .finally(() => {
          if (!cancelled) setWeakWordsLoading(false);
        });
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(loadWeakWords, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(loadWeakWords, 400);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
    };
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
		selection,
		setSelection,
		pool,
		poolLoading,
		poolError,
		loadPool,
		effectiveClassId,
		resolvedSelection,
		canStart,
		startBlockReason,
		sessionConfig,
		sessionConfigLoading,
		sessionConfigError,
		authorizeContext,
		weakWords,
		weakWordsLoading,
		refreshWeakWords,
		refreshAssignmentContext,
	};
}
