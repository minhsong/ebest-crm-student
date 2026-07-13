'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, theme } from 'antd';

import { DrillGameLayout } from '@/features/learning/components/drill/DrillGameLayout';
import { DrillGameSplashScreen } from '@/features/learning/components/drill/DrillGameSplashScreen';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { slugToPromptType } from '@/features/learning/games/catalog/game-catalog.registry';
import { useGameRouteContext, useGameSlug } from '@/features/learning/games/session/GameSlugRouteShell';
import {
	buildGameReadyHref,
	buildGameResultHref,
} from '@/features/learning/games/session/game-route.utils';
import { useGameExitGuard } from '@/features/learning/games/session/use-game-exit-guard';
import { getVocabularyDrillPresentation } from '@/features/learning/games/registry/game-presentation.registry';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import type { AssignmentDrillContextPayload } from '@/types/learning';
import { getGameHubBackHref } from '@/features/learning/games/session/game-hub-navigation.utils';
import { toGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import { useGameRouteQuery } from '@/features/learning/games/session/use-game-route-query';
import '@/features/learning/components/drill/drill-survival.css';
import '@/features/learning/games/catalog-ui/games-hub.css';

export function GamePlayingView() {
	const { token } = theme.useToken();
	const themeVars = drillAntdCssVars(token);
	const router = useRouter();
	const routeQuery = useGameRouteQuery();
	const { reconciled, play: reconciledPlay } = useGameRouteContext();
	const gameSlug = useGameSlug();

	const { playId: playIdParam, classId, assignmentId, checklistId } = routeQuery;
	const promptType = slugToPromptType(gameSlug);

	const [runtimeSessionConfig, setRuntimeSessionConfig] =
		useState<GameSessionConfig | null>(null);

	const {
		assignmentCtx,
		resolvedSelection,
		effectiveClassId,
		sessionConfig: authorizedSessionConfig,
		authorizeContext,
		authorizeForStart,
		refreshAssignmentContext,
		refreshWeakWords,
	} = useDrillPracticePool({
		classId,
		assignmentId,
		checklistId,
		promptTypeFromSlug: promptType ?? undefined,
		runtimeOnly: true,
	});

	const activeSessionConfig = runtimeSessionConfig ?? authorizedSessionConfig;

	const readyHref = useMemo(
		() =>
			buildGameReadyHref(gameSlug, {
				...toGameRouteQuery(routeQuery),
				classId: effectiveClassId,
				modeId: resolvedSelection.modeId,
			}),
		[effectiveClassId, gameSlug, resolvedSelection.modeId, routeQuery],
	);

	const navigateToResult = useCallback(
		(playId: string) => {
			router.replace(
				buildGameResultHref(gameSlug, {
					...toGameRouteQuery(routeQuery),
					playId,
					classId: effectiveClassId,
				}),
			);
		},
		[effectiveClassId, gameSlug, routeQuery, router],
	);

	const {
		question,
		scoreInRun,
		streak,
		resuming,
		starting,
		finished,
		feedback,
		selectedOptionId,
		optionsLocked,
		actionError,
		secondsLeft,
		totalSeconds,
		handleAnswer,
		handleSpellingSubmit,
		registerSpellingGetAnswerTiles,
		poolProgress,
		gradebookSyncFailed,
		abandonSession,
		session,
	} = useDrillPracticeSession({
		effectiveClassId,
		assignmentId,
		resolvedSelection,
		sessionConfig: activeSessionConfig,
		onSessionConfigChange: setRuntimeSessionConfig,
		authorizeContext,
		authorizeForStart,
		assignmentMinimumScore: assignmentCtx?.minimumScore,
		assignmentPoolSize: assignmentCtx?.assignmentPoolSize,
		playIdFromUrl: playIdParam,
		prefetchedPlayPayload:
			reconciledPlay?.playId === playIdParam ? reconciledPlay : null,
		onPlayIdChange: () => {},
		onRunFinished: navigateToResult,
		onSessionCompleted: () => {
			if (assignmentId) {
				void refreshAssignmentContext();
			} else if (classId) {
				void refreshWeakWords();
			}
		},
	});

	const isPlaying = Boolean(question && !finished && session?.status === 'in_progress');

	const { confirmExit } = useGameExitGuard({
		enabled: isPlaying && reconciled,
		onAbandon: abandonSession,
		onPopExitNavigate: () => router.replace(readyHref),
	});

	const presentation = useMemo(
		() => getVocabularyDrillPresentation(activeSessionConfig),
		[activeSessionConfig],
	);

	const lobbyAssignmentCtx = assignmentCtx as AssignmentDrillContextPayload | null;
	const exitTargetHref = getGameHubBackHref({ checklistId, assignmentId }) || readyHref;
	const backHref = checklistId || assignmentId ? exitTargetHref : readyHref;

	if (!promptType || !reconciled || !playIdParam) {
		return null;
	}

	if (resuming || starting) {
		return (
			<div className="drill-page games-hub-page" style={themeVars}>
				<DrillGameSplashScreen
					title={resuming ? 'Đang khôi phục lượt chơi' : undefined}
					description={resuming ? 'Đang tải tiến độ phiên chơi của bạn…' : undefined}
				/>
			</div>
		);
	}

	if (finished) {
		return null;
	}

	return (
		<div className="drill-page games-hub-page" style={themeVars}>
			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{gradebookSyncFailed ? (
				<Alert
					className="mb-4"
					type="warning"
					showIcon
					message="Điểm lượt chơi chưa đồng bộ với sổ điểm"
				/>
			) : null}

			{isPlaying && question && presentation ? (
				<DrillGameLayout
					presentation={presentation}
					assignmentTitle={lobbyAssignmentCtx?.title}
					backHref={backHref}
					onExitClick={() => confirmExit(() => router.push(exitTargetHref))}
					score={scoreInRun}
					streak={streak}
					poolProgress={poolProgress}
					assignmentCtx={lobbyAssignmentCtx}
					question={question}
					selectedOptionId={selectedOptionId}
					feedback={feedback}
					optionsLocked={optionsLocked}
					secondsLeft={secondsLeft}
					totalSeconds={totalSeconds}
					onSelect={(id) => void handleAnswer(id)}
					onSpellingSubmit={(tileIds) => void handleSpellingSubmit(tileIds)}
					onRegisterSpellingGetAnswerTiles={registerSpellingGetAnswerTiles}
				/>
			) : (
				<DrillGameSplashScreen title="Đang tải câu hỏi…" />
			)}
		</div>
	);
}
