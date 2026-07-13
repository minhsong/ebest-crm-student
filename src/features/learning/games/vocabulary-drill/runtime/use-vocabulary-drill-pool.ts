import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	fetchAssignmentDrillContext,
	fetchVocabularyPool,
	fetchWeakWords,
} from '@/lib/learning-api';
import {
	authorizeDrillSession,
	type DrillAuthorizeResult,
	type DrillStartAuthorizeContext,
} from '@/lib/drill-authorize-client';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import {
	defaultVocabularyDrillSelection,
	resolveVocabularyDrillCanStart,
	resolveVocabularyDrillSelection,
	resolveVocabularyDrillStartBlockReason,
	selectionFromVocabularyDrillSessionConfig,
} from '@/features/learning/games/vocabulary-drill/runtime/vocabulary-drill-pool.service';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
	WeakWordsPayload,
} from '@/types/learning';

export type { DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';
export type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';

const DEFAULT_SELECTION = defaultVocabularyDrillSelection();

function toAuthorizeContext(
	auth: Extract<DrillAuthorizeResult, { allowed: true }>,
): DrillStartAuthorizeContext {
	return {
		classId: auth.classId,
		courseId: auth.courseId,
		assignmentId: auth.assignmentId,
		checklistId: auth.checklistId ?? null,
		sessionConfig: auth.sessionConfig,
		rules: auth.rules,
		pool: auth.pool,
		progress: auth.progress,
	};
}

type PoolParams = {
	classId: number | null;
	assignmentId: number | null;
	checklistId?: number | null;
	classSessionId?: number | null;
	/** Từ `gameSlug` — SSOT promptType khi free practice / checklist. */
	promptTypeFromSlug?: DrillPracticeSelection['promptType'] | null;
	/** Runtime `/playing` — chỉ assignment context, không prefetch pool / weak words. */
	runtimeOnly?: boolean;
};

export function useVocabularyDrillPool({
	classId,
	assignmentId,
	checklistId,
	classSessionId,
	promptTypeFromSlug,
	runtimeOnly = false,
}: PoolParams) {
	const [assignmentCtx, setAssignmentCtx] = useState<AssignmentDrillContextPayload | null>(null);
	const [selection, setSelection] = useState<DrillPracticeSelection>(DEFAULT_SELECTION);
	const [pool, setPool] = useState<VocabularyPoolPayload | null>(null);
	const [poolLoading, setPoolLoading] = useState(!runtimeOnly);
	const [poolError, setPoolError] = useState<string | null>(null);

	const [weakWords, setWeakWords] = useState<WeakWordsPayload | null>(null);
	const [weakWordsLoading, setWeakWordsLoading] = useState(false);
	const [sessionConfig, setSessionConfig] = useState<GameSessionConfig | null>(null);
	const [authorizeContext, setAuthorizeContext] = useState<DrillStartAuthorizeContext | null>(
		null,
	);
	const [sessionConfigError, setSessionConfigError] = useState<string | null>(null);

	const loadPool = useCallback(async () => {
		if (checklistId && !Number.isNaN(checklistId)) {
			setPool(null);
			setPoolLoading(false);
			setPoolError(null);
			return;
		}

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
	}, [classId, assignmentId, checklistId]);

	const loadAssignmentOnly = useCallback(async () => {
		if (!assignmentId || Number.isNaN(assignmentId)) return;
		try {
			setAssignmentCtx(await fetchAssignmentDrillContext(assignmentId));
		} catch {
			// Giữ trạng thái cũ nếu không tải được context bài tập.
		}
	}, [assignmentId]);

	const effectiveClassId = assignmentCtx?.classId ?? classId;

	const resolvedSelection = useMemo(
		(): DrillPracticeSelection =>
			resolveVocabularyDrillSelection({
				selection,
				assignmentCtx,
				checklistId,
				promptTypeFromSlug,
			}),
		[assignmentCtx, checklistId, promptTypeFromSlug, selection],
	);

	const canStart = useMemo(
		() =>
			resolveVocabularyDrillCanStart({
				classId,
				checklistId,
				assignmentCtx,
				pool,
			}),
		[assignmentCtx, pool, checklistId, classId],
	);

	const startBlockReason = useMemo(
		() =>
			resolveVocabularyDrillStartBlockReason({
				assignmentCtx,
				pool,
				checklistId,
			}),
		[assignmentCtx, pool, checklistId],
	);

	/** Authorize + batch đầu — chỉ gọi khi HV bấm Bắt đầu lượt chơi. */
	const authorizeForStart = useCallback(
		async (selectionForStart: DrillPracticeSelection): Promise<DrillStartAuthorizeContext> => {
			const authorizeClassId = checklistId ? classId : effectiveClassId;
			if (!authorizeClassId || Number.isNaN(authorizeClassId)) {
				throw new Error('Thiếu lớp học.');
			}
			if (checklistId && (!classId || Number.isNaN(classId))) {
				throw new Error('Thiếu classId cho checklist game.');
			}

			setSessionConfigError(null);

			const auth = await authorizeDrillSession(authorizeClassId, {
				assignmentId: assignmentId ?? undefined,
				checklistId: checklistId ?? undefined,
				classSessionId: classSessionId ?? undefined,
				modeId: selectionForStart.modeId,
				promptType: selectionForStart.promptType,
				sessionDurationSec:
					selectionForStart.modeId === 'speed_run'
						? selectionForStart.sessionDurationSec
						: undefined,
				spellingDifficulty:
					selectionForStart.promptType === 'spelling'
						? (selectionForStart.spellingDifficulty ?? 'easy')
						: undefined,
			});

			if (!auth.allowed) {
				const reason = auth.reason ?? 'Không được phép luyện tập.';
				setSessionConfigError(reason);
				throw new Error(reason);
			}

			const ctx = toAuthorizeContext(auth);
			setSessionConfig(auth.sessionConfig);
			setAuthorizeContext(ctx);
			setSelection(selectionFromVocabularyDrillSessionConfig(auth.sessionConfig));
			return ctx;
		},
		[assignmentId, checklistId, classId, classSessionId, effectiveClassId],
	);

	useEffect(() => {
		if (runtimeOnly) {
			void loadAssignmentOnly();
			return;
		}
		void loadPool();
	}, [runtimeOnly, loadPool, loadAssignmentOnly]);

	/** Checklist: prefetch authorize để hiển thị lobby đầy đủ trước khi bấm Bắt đầu. */
	useEffect(() => {
		if (runtimeOnly || !checklistId || !classId || Number.isNaN(classId)) {
			return;
		}

		let cancelled = false;
		setSessionConfigError(null);

		void authorizeDrillSession(classId, {
			checklistId,
			modeId: 'pool_coverage',
			promptType: promptTypeFromSlug ?? 'meaning_to_word',
		}).then((auth) => {
			if (cancelled) return;
			if (!auth.allowed) {
				setSessionConfigError(auth.reason ?? 'Không được phép làm nhiệm vụ game.');
				return;
			}
			const ctx = toAuthorizeContext(auth);
			setSessionConfig(auth.sessionConfig);
			setAuthorizeContext(ctx);
			setSelection(selectionFromVocabularyDrillSessionConfig(auth.sessionConfig));
		});

		return () => {
			cancelled = true;
		};
	}, [checklistId, classId, promptTypeFromSlug, runtimeOnly]);

	useEffect(() => {
		if (runtimeOnly) {
			return;
		}
		if (!classId || Number.isNaN(classId) || assignmentId || checklistId) {
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
	}, [classId, assignmentId, checklistId, runtimeOnly]);

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
		sessionConfigError,
		authorizeContext,
		authorizeForStart,
		weakWords,
		weakWordsLoading,
		refreshWeakWords,
		refreshAssignmentContext,
	};
}
