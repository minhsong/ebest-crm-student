import { useCallback, useMemo, useState } from 'react';

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import {
	useGameSession,
	type GameAnswerFeedback,
	type GameSessionAnswerResultContext,
} from '@/features/learning/games/core/use-game-session';
import { scheduleDrillAnswerFeedback } from '@/features/learning/games/vocabulary-drill/drill-feedback.utils';
import {
	planVocabularyDrillAnswerHandling,
	resolvePoolCoverageRunPassed,
	resolveRunPassedFromResume,
	resolveSurvivalRunPassed,
	type PoolCoverageProgress,
} from '@/features/learning/games/vocabulary-drill/runtime/vocabulary-drill-answer.service';
import {
	resolveVocabularyDrillTimerConfig,
	startVocabularyDrillPlay,
	toDrillSessionFromResume,
	vocabularyDrillRuntimeAdapter,
} from '@/features/learning/games/vocabulary-drill/runtime/vocabulary-drill-runtime.adapter';
import type { DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';
import {
	isPoolCoverageMode,
	isSpeedRunMode,
} from '@ebest/game-engine-core';
import type { VocabularyDrillModeId } from '@ebest/game-vocabulary-drill';
import type { DrillQuestionClient, DrillSessionClient, DrillAnswerResult } from '@/types/learning';

export type DrillAnswerFeedback = GameAnswerFeedback;

type Options = {
	effectiveClassId: number | null;
	assignmentId: number | null;
	resolvedSelection: DrillPracticeSelection;
	sessionConfig: GameSessionConfig | null;
	onSessionConfigChange: (config: GameSessionConfig | null) => void;
	authorizeContext: DrillStartAuthorizeContext | null;
	authorizeForStart: (
		selection: DrillPracticeSelection,
	) => Promise<DrillStartAuthorizeContext>;
	assignmentMinimumScore?: number;
	assignmentPoolSize?: number;
	playIdFromUrl: string | null;
	prefetchedPlayPayload?: Parameters<typeof toDrillSessionFromResume>[0] | null;
	onPlayIdChange: (playId: string | null) => void;
	onSessionCompleted?: () => void;
	onSessionStarted?: (payload: { playId: string }) => void;
	onRunFinished?: (playId: string) => void;
};

function applyContinuePlan(
	plan: Extract<
		ReturnType<typeof planVocabularyDrillAnswerHandling>,
		{ kind: 'feedback_then_continue' }
	>,
	ctx: Pick<
		GameSessionAnswerResultContext<
			DrillSessionClient,
			DrillQuestionClient,
			DrillAnswerResult
		>,
		| 'setQuestion'
		| 'setStreak'
		| 'setFeedback'
		| 'setSelectedOptionId'
		| 'setLastCorrect'
		| 'scheduleFeedback'
	>,
	setPoolProgress: (p: PoolCoverageProgress) => void,
) {
	if (plan.progress) {
		setPoolProgress(plan.progress);
	}
	if (plan.resetStreak) {
		ctx.setStreak(() => 0);
	}
	if (plan.incrementStreak) {
		ctx.setStreak((s) => s + 1);
	}
	scheduleDrillAnswerFeedback({
		correct: plan.correct,
		setFeedback: ctx.setFeedback,
		scheduleFeedback: ctx.scheduleFeedback,
		onDone: () => {
			if (plan.nextQuestion) {
				ctx.setQuestion(plan.nextQuestion);
			}
			ctx.setFeedback(null);
			ctx.setSelectedOptionId(null);
			ctx.setLastCorrect(null);
		},
	});
}

export function useVocabularyDrillSession({
	effectiveClassId,
	assignmentId,
	resolvedSelection,
	sessionConfig,
	onSessionConfigChange,
	authorizeContext,
	authorizeForStart,
	assignmentMinimumScore,
	assignmentPoolSize,
	playIdFromUrl,
	prefetchedPlayPayload,
	onPlayIdChange,
	onSessionCompleted,
	onSessionStarted: onSessionStartedExternal,
	onRunFinished,
}: Options) {
	const activeModeId = (sessionConfig?.modeId ??
		resolvedSelection.modeId) as VocabularyDrillModeId;
	const isPoolCoverage = isPoolCoverageMode(activeModeId);
	const isSpeedRun = isSpeedRunMode(activeModeId);

	const [poolProgress, setPoolProgress] = useState<PoolCoverageProgress | null>(null);
	const [runPassed, setRunPassed] = useState<boolean | null>(null);
	const [gradebookSyncFailed, setGradebookSyncFailed] = useState(false);

	const timerConfig = useMemo(
		() =>
			resolveVocabularyDrillTimerConfig({
				sessionConfig,
				selection: resolvedSelection,
				modeId: activeModeId,
			}),
		[activeModeId, resolvedSelection, sessionConfig],
	);

	const onAnswerResult = useCallback(
		(ctx: GameSessionAnswerResultContext<
			DrillSessionClient,
			DrillQuestionClient,
			DrillAnswerResult
		>) => {
			const { result } = ctx;
			ctx.setScoreInRun(result.scoreInRun);
			ctx.setLastCorrect(result.correct);
			ctx.setSubmitting(false);

			const plan = planVocabularyDrillAnswerHandling(activeModeId, result);

			switch (plan.kind) {
				case 'feedback_then_finish_pool':
					scheduleDrillAnswerFeedback({
						correct: plan.correct,
						setFeedback: ctx.setFeedback,
						scheduleFeedback: ctx.scheduleFeedback,
						onDone: () => {
							setPoolProgress(plan.progress);
							const passed = resolvePoolCoverageRunPassed(
								plan.progress,
								assignmentMinimumScore,
							);
							setRunPassed(passed);
							ctx.finishRun(passed);
							onSessionCompleted?.();
						},
					});
					return;

				case 'feedback_then_finish_speed':
					scheduleDrillAnswerFeedback({
						correct: plan.correct,
						setFeedback: ctx.setFeedback,
						scheduleFeedback: ctx.scheduleFeedback,
						onDone: () => {
							ctx.finishRun(plan.correct);
							onSessionCompleted?.();
						},
					});
					return;

				case 'feedback_then_finish_survival_pass':
					scheduleDrillAnswerFeedback({
						correct: true,
						setFeedback: ctx.setFeedback,
						scheduleFeedback: ctx.scheduleFeedback,
						onDone: () => {
							const passed = resolveSurvivalRunPassed(
								plan.result.scoreInRun,
								assignmentMinimumScore,
							);
							setRunPassed(passed);
							ctx.finishRun(true);
							onSessionCompleted?.();
						},
					});
					return;

				case 'feedback_then_finish_survival_fail':
					ctx.setStreak(() => 0);
					scheduleDrillAnswerFeedback({
						correct: false,
						setFeedback: ctx.setFeedback,
						scheduleFeedback: ctx.scheduleFeedback,
						onDone: () => {
							setRunPassed(false);
							ctx.finishRun(false);
							onSessionCompleted?.();
						},
					});
					return;

				case 'feedback_then_continue':
					applyContinuePlan(plan, ctx, setPoolProgress);
					return;

				default:
					return;
			}
		},
		[activeModeId, assignmentMinimumScore, onSessionCompleted],
	);

	const startSession = useCallback(async () => {
		if (!effectiveClassId) {
			throw new Error('Thiếu lớp học.');
		}

		const started = await startVocabularyDrillPlay({
			effectiveClassId,
			assignmentId,
			selection: resolvedSelection,
			authorizeContext,
			authorizeForStart,
		});

		if (started.sessionConfig) {
			onSessionConfigChange(started.sessionConfig);
		}

		return {
			playId: started.playId,
			session: started.session,
			question: started.question,
			scoreInRun: started.scoreInRun,
			streak: started.streak,
		};
	}, [
		assignmentId,
		authorizeContext,
		authorizeForStart,
		effectiveClassId,
		onSessionConfigChange,
		resolvedSelection,
	]);

	const activePromptType =
		sessionConfig?.promptType ?? resolvedSelection.promptType;

	const gameSession = useGameSession<
		DrillSessionClient,
		DrillQuestionClient,
		DrillAnswerResult
	>({
		playIdFromUrl,
		prefetchedPlayPayload,
		onPlayIdChange,
		answerTimeoutSec: timerConfig.timerSeconds,
		getTimerAnchorId: (activeSession) =>
			timerConfig.isSpeedRun ? (activeSession?.playId ?? null) : null,
		wsEvents: vocabularyDrillRuntimeAdapter.wsEvents,
		fetchWsAccessToken: vocabularyDrillRuntimeAdapter.fetchWsAccessToken,
		connectSocket: vocabularyDrillRuntimeAdapter.connectSocket,
		startSession,
		fetchSession: vocabularyDrillRuntimeAdapter.fetchSession,
		toSessionFromStart: (started) => started.session,
		toSessionFromResume: (resumed) => {
			if (resumed.sessionConfig) {
				onSessionConfigChange(resumed.sessionConfig);
			}
			return toDrillSessionFromResume(resumed);
		},
		submitAnswerHttp: vocabularyDrillRuntimeAdapter.submitAnswer,
		getQuestionId: (q) => q.questionId,
		spellingAnswerMode: activePromptType === 'spelling',
		perQuestionTimer: activePromptType === 'spelling' && !isSpeedRun,
		onAnswerResult,
		onSessionStarted: (started) => {
			if (isPoolCoverage && assignmentPoolSize) {
				setPoolProgress({
					answered: 0,
					total: assignmentPoolSize,
					correct: 0,
					wrong: 0,
				});
			}
			onSessionStartedExternal?.({ playId: started.playId });
		},
		onRunFinished,
		abandonSessionHttp: async (playId) => {
			const result = await vocabularyDrillRuntimeAdapter.abandonSession(playId);
			return { completed: result.completed, scoreInRun: result.scoreInRun };
		},
		onSessionResumed: (_session, _question, resumeCtx) => {
			setGradebookSyncFailed(resumeCtx.gradebookSyncFailed ?? false);
			if (resumeCtx.progress) {
				setPoolProgress(resumeCtx.progress);
			} else if (isPoolCoverage && assignmentPoolSize) {
				setPoolProgress({
					answered: 0,
					total: assignmentPoolSize,
					correct: 0,
					wrong: 0,
				});
			}
		},
		onSessionCompletedFromResume: (_session, resumeCtx) => {
			setGradebookSyncFailed(resumeCtx.gradebookSyncFailed ?? false);
			if (resumeCtx.progress) {
				setPoolProgress(resumeCtx.progress);
			}
			const passed = resolveRunPassedFromResume({
				modeId: activeModeId,
				lastAnswerCorrect: resumeCtx.lastAnswerCorrect,
				runPassed: resumeCtx.runPassed,
				progress: resumeCtx.progress,
				assignmentMinimumScore,
			});
			if (passed != null) {
				setRunPassed(passed);
			}
			onSessionCompleted?.();
		},
		resetSessionExtras: () => {
			setPoolProgress(null);
			setRunPassed(null);
			setGradebookSyncFailed(false);
		},
	});

	const handleStart = useCallback(async () => {
		if (!effectiveClassId) return;
		await gameSession.handleStart();
	}, [effectiveClassId, gameSession]);

	return {
		...gameSession,
		handleStart,
		poolProgress,
		runPassed,
		gradebookSyncFailed,
		isPoolCoverage,
		isSpeedRun,
		answerTimeoutSec: timerConfig.timerSeconds,
	};
}
