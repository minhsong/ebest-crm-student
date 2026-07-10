import {
	abandonDrillSession,
	fetchDrillSession,
	startDrillSession,
	submitDrillAnswer,
} from '@/lib/learning-api';
import {
	DRILL_WS,
	connectDrillRuntimeSocket,
	fetchDrillWsAccessToken,
} from '@/features/learning/lib/drill-runtime-ws-client';
import { DRILL_ANSWER_TIMEOUT_SEC } from '@/features/learning/constants/drill-timing';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import type { DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';
import {
	assertDrillSessionModeKey,
	isSpeedRunMode,
} from '@ebest/game-engine-core';
import type { DrillQuestionClient, DrillSessionClient } from '@/types/learning';

/** HTTP + WS adapter — cô lập I/O khỏi hook session. */
export const vocabularyDrillRuntimeAdapter = {
	wsEvents: {
		JOIN: DRILL_WS.JOIN,
		JOINED: DRILL_WS.JOINED,
		TIMER_SYNC: DRILL_WS.TIMER_SYNC,
		STATE_SYNC: DRILL_WS.STATE_SYNC,
		PLAY_CLOSED: DRILL_WS.PLAY_CLOSED,
		ANSWER: DRILL_WS.ANSWER,
		ANSWER_ACK: DRILL_WS.ANSWER_ACK,
		ERROR: DRILL_WS.ERROR,
	},
	fetchWsAccessToken: fetchDrillWsAccessToken,
	connectSocket: connectDrillRuntimeSocket,
	fetchSession: fetchDrillSession,
	submitAnswer: submitDrillAnswer,
	abandonSession: (playId: string) =>
		abandonDrillSession(playId, { treatNotFoundAsSuccess: true }),
} as const;

export function resolveVocabularyDrillTimerConfig(input: {
	sessionConfig: GameSessionConfig | null;
	selection: DrillPracticeSelection;
	modeId: string;
}): { timerSeconds: number; isSpeedRun: boolean } {
	const modeKey = assertDrillSessionModeKey(input.modeId);
	const isSpeedRun = isSpeedRunMode(modeKey);
	const answerTimeoutSec =
		input.sessionConfig?.rules?.answerTimeoutSec ?? DRILL_ANSWER_TIMEOUT_SEC;
	const sessionDurationSec =
		input.sessionConfig?.rules?.sessionDurationSec ??
		input.selection.sessionDurationSec ??
		90;

	return {
		timerSeconds: isSpeedRun ? sessionDurationSec : answerTimeoutSec,
		isSpeedRun,
	};
}

export async function startVocabularyDrillPlay(input: {
	effectiveClassId: number;
	assignmentId: number | null;
	selection: DrillPracticeSelection;
	authorizeContext: DrillStartAuthorizeContext | null;
	authorizeForStart: (
		selection: DrillPracticeSelection,
	) => Promise<DrillStartAuthorizeContext>;
}): Promise<{
	playId: string;
	session: DrillSessionClient;
	question: DrillQuestionClient;
	scoreInRun: number;
	streak: number;
	sessionConfig: GameSessionConfig | null;
}> {
	const context =
		input.authorizeContext ?? (await input.authorizeForStart(input.selection));

	const started = await startDrillSession(input.effectiveClassId, {
		assignmentId: input.assignmentId ?? undefined,
		modeId: input.selection.modeId,
		promptType: input.selection.promptType,
		context,
	});

	return {
		playId: started.playId,
		session: {
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
		},
		question: started.question,
		scoreInRun: started.scoreInRun,
		streak: started.streak ?? 0,
		sessionConfig: started.sessionConfig ?? null,
	};
}

export function toDrillSessionFromResume(
	resumed: Awaited<ReturnType<typeof fetchDrillSession>>,
): DrillSessionClient {
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
}
