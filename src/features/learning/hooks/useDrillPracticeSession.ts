import { useCallback, useMemo, useState } from 'react';

import {
	fetchDrillSession,
	startDrillSession,
	submitDrillAnswer,
} from '@/lib/learning-api';

import { DRILL_ANSWER_TIMEOUT_SEC } from '@/features/learning/constants/drill-timing';
import {
	DRILL_WS,
	connectDrillRuntimeSocket,
	fetchDrillWsAccessToken,
} from '@/features/learning/lib/drill-runtime-ws-client';

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { DrillPracticeSelection, DrillStartAuthorizeContext } from '@/features/learning/hooks/useDrillPracticePool';

import {
	useGameSession,
	type GameAnswerFeedback,
	type GameSessionAnswerResultContext,
} from '@/features/learning/games/core/use-game-session';
import {
	playDrillCorrectSound,
	playDrillWrongSound,
} from '@/features/learning/utils/game-sfx';

import type { DrillQuestionClient, DrillSessionClient, DrillAnswerResult } from '@/types/learning';

const FEEDBACK_CORRECT_MS = 480;
const FEEDBACK_WRONG_MS = 650;

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
	onPlayIdChange: (playId: string | null) => void;
	onSessionCompleted?: () => void;
};

function toSessionClient(
	started: Awaited<ReturnType<typeof startDrillSession>>,
): DrillSessionClient {
	return {
		playId: started.playId,
		classId: started.classId,
		assignmentId: started.assignmentId,
		modeId: started.modeId,
		promptType: started.promptType,
		scoreInRun: started.scoreInRun,
		streak: started.streak,
		status: started.status,
		sessionConfig: started.sessionConfig ?? null,
		question: started.question,
	};
}

export function useDrillPracticeSession({
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
	onPlayIdChange,
	onSessionCompleted,
}: Options) {
	const isPoolCoverage =
		(sessionConfig?.modeId ?? resolvedSelection.modeId) === 'pool_coverage';

	const [poolProgress, setPoolProgress] = useState<{
		answered: number;
		total: number;
		correct: number;
		wrong: number;
	} | null>(null);
	const [runPassed, setRunPassed] = useState<boolean | null>(null);
	const [gradebookSyncFailed, setGradebookSyncFailed] = useState(false);

	const finishPoolCoverageRun = useCallback(
		(
			progress: NonNullable<DrillAnswerResult['progress']>,
			finishRun: (lastCorrect: boolean | null) => void,
		) => {
			setPoolProgress(progress);
			const passed =
				assignmentMinimumScore == null
					? progress.correct > 0
					: progress.correct >= assignmentMinimumScore;
			setRunPassed(passed);
			finishRun(passed);
			onSessionCompleted?.();
		},
		[assignmentMinimumScore, onSessionCompleted],
	);

	const showWrongFeedbackThenFinish = useCallback(
		(
			finishRun: (lastCorrect: boolean | null) => void,
			scheduleFeedback: (delayMs: number, fn: () => void) => void,
			setFeedback: (v: DrillAnswerFeedback) => void,
			setStreak: (updater: (s: number) => number) => void,
		) => {
			playDrillWrongSound();
			setFeedback('wrong');
			setStreak(() => 0);
			scheduleFeedback(FEEDBACK_WRONG_MS, () => {
				setRunPassed(false);
				finishRun(false);
				onSessionCompleted?.();
			});
		},
		[onSessionCompleted],
	);

	const showCorrectFeedbackThenFinish = useCallback(
		(
			result: DrillAnswerResult,
			finishRun: (lastCorrect: boolean | null) => void,
			scheduleFeedback: (delayMs: number, fn: () => void) => void,
			setFeedback: (v: DrillAnswerFeedback) => void,
		) => {
			playDrillCorrectSound();
			setFeedback('correct');
			scheduleFeedback(FEEDBACK_CORRECT_MS, () => {
				const passed =
					assignmentMinimumScore == null
						? true
						: result.scoreInRun >= assignmentMinimumScore;
				setRunPassed(passed);
				finishRun(true);
				onSessionCompleted?.();
			});
		},
		[assignmentMinimumScore, onSessionCompleted],
	);

	const onAnswerResult = useCallback(
		({
			result,
			setQuestion,
			setScoreInRun,
			setStreak,
			setLastCorrect,
			setFeedback,
			setSelectedOptionId,
			setSubmitting,
			finishRun,
			scheduleFeedback,
		}: GameSessionAnswerResultContext<
			DrillSessionClient,
			DrillQuestionClient,
			DrillAnswerResult
		>) => {
			setScoreInRun(result.scoreInRun);
			setLastCorrect(result.correct);
			setSubmitting(false);

			if (result.completed) {
				if (isPoolCoverage && result.progress) {
					if (result.correct) {
						playDrillCorrectSound();
					} else {
						playDrillWrongSound();
					}
					setFeedback(result.correct ? 'correct' : 'wrong');
					scheduleFeedback(
						result.correct ? FEEDBACK_CORRECT_MS : FEEDBACK_WRONG_MS,
						() => finishPoolCoverageRun(result.progress!, finishRun),
					);
				} else if (result.correct) {
					showCorrectFeedbackThenFinish(
						result,
						finishRun,
						scheduleFeedback,
						setFeedback,
					);
				} else {
					showWrongFeedbackThenFinish(
						finishRun,
						scheduleFeedback,
						setFeedback,
						setStreak,
					);
				}
				return;
			}

			if (!result.correct && isPoolCoverage) {
				if (result.progress) {
					setPoolProgress(result.progress);
				}
				setStreak(() => 0);
				playDrillWrongSound();
				setFeedback('wrong');
				scheduleFeedback(FEEDBACK_WRONG_MS, () => {
					if (result.nextQuestion) {
						setQuestion(result.nextQuestion);
					}
					setFeedback(null);
					setSelectedOptionId(null);
					setLastCorrect(null);
				});
				return;
			}

			if (result.correct) {
				setStreak((s) => s + 1);
				if (result.progress) {
					setPoolProgress(result.progress);
				}
				playDrillCorrectSound();
				setFeedback('correct');
				scheduleFeedback(FEEDBACK_CORRECT_MS, () => {
					if (result.nextQuestion) {
						setQuestion(result.nextQuestion);
					}
					setFeedback(null);
					setSelectedOptionId(null);
					setLastCorrect(null);
				});
			}
		},
		[finishPoolCoverageRun, isPoolCoverage, showCorrectFeedbackThenFinish, showWrongFeedbackThenFinish],
	);

	const startSession = useCallback(async () => {
		if (!effectiveClassId) {
			throw new Error('Thiếu lớp học.');
		}

		const context =
			authorizeContext ?? (await authorizeForStart(resolvedSelection));

		const started = await startDrillSession(effectiveClassId, {
			assignmentId: assignmentId ?? undefined,
			modeId: resolvedSelection.modeId,
			promptType: resolvedSelection.promptType,
			context,
		});
		if (started.sessionConfig) {
			onSessionConfigChange(started.sessionConfig);
		}
		return {
			playId: started.playId,
			session: toSessionClient(started),
			question: started.question,
			scoreInRun: started.scoreInRun,
			streak: started.streak ?? 0,
		};
	}, [
		assignmentId,
		authorizeContext,
		authorizeForStart,
		effectiveClassId,
		onSessionConfigChange,
		resolvedSelection,
	]);

	const wsEvents = useMemo(
		() => ({
			JOIN: DRILL_WS.JOIN,
			JOINED: DRILL_WS.JOINED,
			TIMER_SYNC: DRILL_WS.TIMER_SYNC,
			STATE_SYNC: DRILL_WS.STATE_SYNC,
			PLAY_CLOSED: DRILL_WS.PLAY_CLOSED,
			ANSWER: DRILL_WS.ANSWER,
			ANSWER_ACK: DRILL_WS.ANSWER_ACK,
			ERROR: DRILL_WS.ERROR,
		}),
		[],
	);

	const answerTimeoutSec =
		sessionConfig?.rules.answerTimeoutSec ?? DRILL_ANSWER_TIMEOUT_SEC;

	const gameSession = useGameSession<
		DrillSessionClient,
		DrillQuestionClient,
		DrillAnswerResult
	>({
		playIdFromUrl,
		onPlayIdChange,
		answerTimeoutSec,
		wsEvents,
		fetchWsAccessToken: fetchDrillWsAccessToken,
		connectSocket: connectDrillRuntimeSocket,
		startSession,
		fetchSession: fetchDrillSession,
		toSessionFromStart: (started) => started.session,
		toSessionFromResume: (resumed) => {
			if (resumed.sessionConfig) {
				onSessionConfigChange(resumed.sessionConfig);
			}
			return {
			playId: resumed.playId,
			classId: resumed.classId,
			assignmentId: resumed.assignmentId,
			modeId: resumed.modeId as DrillSessionClient['modeId'],
			promptType: resumed.promptType as DrillSessionClient['promptType'],
			scoreInRun: resumed.scoreInRun,
			streak: resumed.streak,
			status: resumed.status,
			sessionConfig: resumed.sessionConfig ?? null,
			question:
				resumed.question ??
				({
					questionId: '',
					prompt: '',
					promptType: 'meaning',
					options: [],
				} as DrillQuestionClient),
		};
		},
		submitAnswerHttp: (playId, questionId, opts) =>
			submitDrillAnswer(playId, questionId, opts),
		getQuestionId: (q) => q.questionId,
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
			if (resumeCtx.runPassed != null) {
				setRunPassed(resumeCtx.runPassed);
			} else if (isPoolCoverage && resumeCtx.progress) {
				const passed =
					assignmentMinimumScore == null
						? resumeCtx.progress.correct > 0
						: resumeCtx.progress.correct >= assignmentMinimumScore;
				setRunPassed(passed);
			} else if (!isPoolCoverage && resumeCtx.lastAnswerCorrect === false) {
				setRunPassed(false);
			}
			onSessionCompleted?.();
		},
		resetSessionExtras: () => {
			setPoolProgress(null);
			setRunPassed(null);
			setGradebookSyncFailed(false);
		},
	});

	// handleStart guard — skip when no class
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
	};
}
