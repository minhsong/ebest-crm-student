'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Skeleton, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { PageHeader } from '@/components/layout';
import { DrillPracticeLobby } from '@/features/learning/components/drill/DrillPracticeLobby';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { getGameCatalogEntry, slugToPromptType } from '@/features/learning/games/catalog/game-catalog.registry';
import { buildChecklistLobbyContext } from '@/features/learning/games/ready/build-checklist-lobby-context';
import { GameBestOfPoolScopePicker } from '@/features/learning/games/ready/GameBestOfPoolScopePicker';
import { GameModePicker } from '@/features/learning/games/ready/GameModePicker';
import { GameSessionDurationPicker } from '@/features/learning/games/ready/GameSessionDurationPicker';
import { GameHubLeaderboardPanel } from '@/features/learning/games/ready/GameHubLeaderboardPanel';
import { useActiveDrillPlay } from '@/features/learning/games/ready/use-active-drill-play';
import { useGameRouteContext, useGameSlug } from '@/features/learning/games/session/GameSlugRouteShell';
import { useGameSlugRedirect } from '@/features/learning/games/session/use-game-slug-redirect';
import { buildGamePlayingHref } from '@/features/learning/games/session/game-route.utils';
import { modeIdFromUrlParam, modeIdToUrlParam } from '@/features/learning/games/session/game-mode.utils';
import {
	getGameHubBackHref,
	getGameHubBackLabel,
} from '@/features/learning/games/session/game-hub-navigation.utils';
import { toGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import { useGameRouteQuery } from '@/features/learning/games/session/use-game-route-query';
import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import '@/features/learning/components/drill/drill-survival.css';
import '@/features/learning/games/catalog-ui/games-hub.css';

export function GameReadyView() {
	const { token } = theme.useToken();
	const themeVars = drillAntdCssVars(token);
	const router = useRouter();
	const routeQuery = useGameRouteQuery();
	const { reconciled } = useGameRouteContext();
	const gameSlug = useGameSlug();

	const catalogEntry = getGameCatalogEntry(gameSlug);
	const promptType = slugToPromptType(gameSlug);

	const { classId, assignmentId, checklistId, modeIdParam, classSessionId } = routeQuery;

	const [bestOfScopeKind, setBestOfScopeKind] = useState<'class' | 'session'>(
		classSessionId ? 'session' : 'class',
	);

	useEffect(() => {
		setBestOfScopeKind(classSessionId ? 'session' : 'class');
	}, [classSessionId]);

	const {
		assignmentCtx,
		selection,
		setSelection,
		pool,
		poolLoading,
		poolError,
		loadPool,
		effectiveClassId,
		canStart,
		startBlockReason,
		sessionConfig: authorizedSessionConfig,
		sessionConfigError,
		authorizeContext,
		authorizeForStart,
		weakWords,
		weakWordsLoading,
		resolvedSelection,
	} = useDrillPracticePool({
		classId,
		assignmentId,
		checklistId,
		classSessionId,
		promptTypeFromSlug: promptType ?? undefined,
	});

	useEffect(() => {
		if (!classSessionId) return;
		setSelection((prev) =>
			prev.modeId === 'pool_coverage'
				? prev
				: { ...prev, modeId: 'pool_coverage' },
		);
	}, [classSessionId, setSelection]);

	const { activePlay, activeLoading, abandonActive } = useActiveDrillPlay(
		effectiveClassId,
		promptType,
	);

	// Luôn đồng bộ promptType từ slug (fix audio-to-word dùng DEFAULT_SELECTION cũ).
	useEffect(() => {
		if (!promptType) return;
		setSelection((prev) =>
			prev.promptType === promptType ? prev : { ...prev, promptType },
		);
	}, [promptType, setSelection]);

	useEffect(() => {
		if (!promptType) return;
		const parsedMode = modeIdFromUrlParam(modeIdParam);
		if (!parsedMode) return;
		setSelection((prev) => ({ ...prev, modeId: parsedMode, promptType }));
	}, [modeIdParam, promptType, setSelection]);

	const handleSelectionChange = useCallback(
		(next: DrillPracticeSelection) => {
			if (!promptType) return;
			const merged: DrillPracticeSelection = { ...next, promptType };
			setSelection(merged);
			const sp = new URLSearchParams(window.location.search);
			const urlMode = modeIdToUrlParam(merged.modeId);
			if (urlMode) sp.set('modeId', urlMode);
			else sp.delete('modeId');
			if (merged.modeId !== 'pool_coverage') {
				sp.delete('classSessionId');
			}
			router.replace(`?${sp.toString()}`, { scroll: false });
		},
		[promptType, router, setSelection],
	);

	const updateClassSessionId = useCallback(
		(nextSessionId: number | null) => {
			const sp = new URLSearchParams(window.location.search);
			if (nextSessionId != null && Number.isFinite(nextSessionId)) {
				sp.set('classSessionId', String(nextSessionId));
				const urlMode = modeIdToUrlParam('pool_coverage');
				if (urlMode) sp.set('modeId', urlMode);
			} else {
				sp.delete('classSessionId');
			}
			router.replace(`?${sp.toString()}`, { scroll: false });
		},
		[router],
	);

	const [runtimeSessionConfig, setRuntimeSessionConfig] =
		useState<GameSessionConfig | null>(null);

	const checklistLobbyCtx = buildChecklistLobbyContext(
		checklistId,
		classId,
		authorizeContext,
		resolvedSelection.promptType,
	);

	const mergedStartBlockReason =
		resolvedSelection.modeId === 'pool_coverage' &&
		!assignmentId &&
		!checklistId &&
		bestOfScopeKind === 'session' &&
		!classSessionId
			? 'Chọn buổi học để chơi Best of buổi.'
			: startBlockReason;

	const lobbyAssignmentCtx = assignmentCtx ?? checklistLobbyCtx;
	const activeSessionConfig = runtimeSessionConfig ?? authorizedSessionConfig;

	useGameSlugRedirect({
		urlSegment: 'ready',
		promptType: assignmentCtx?.promptType,
		enabled: reconciled && Boolean(assignmentCtx),
	});

	const navigateToPlaying = useCallback(
		(playId: string) => {
			router.replace(
				buildGamePlayingHref(gameSlug, {
					...toGameRouteQuery(routeQuery),
					playId,
					classId: effectiveClassId,
					modeId: resolvedSelection.modeId,
				}),
			);
		},
		[effectiveClassId, gameSlug, resolvedSelection.modeId, routeQuery, router],
	);

	const { starting, actionError, handleStart } = useDrillPracticeSession({
		effectiveClassId,
		assignmentId,
		resolvedSelection,
		sessionConfig: activeSessionConfig,
		onSessionConfigChange: setRuntimeSessionConfig,
		authorizeContext,
		authorizeForStart,
		assignmentMinimumScore: assignmentCtx?.minimumScore,
		assignmentPoolSize: assignmentCtx?.assignmentPoolSize,
		playIdFromUrl: null,
		onPlayIdChange: () => {},
		onSessionStarted: (started) => navigateToPlaying(started.playId),
	});

	const onStartClick = useCallback(async () => {
		if (activePlay) {
			navigateToPlaying(activePlay.playId);
			return;
		}
		await handleStart();
	}, [activePlay, handleStart, navigateToPlaying]);

	if (!catalogEntry || !promptType || !reconciled) {
		return <Skeleton active className="p-4" />;
	}

	const pageTitle = checklistId
		? 'Nhiệm vụ luyện từ'
		: (lobbyAssignmentCtx?.title ?? catalogEntry.title);

	const backHref = getGameHubBackHref({ checklistId, assignmentId });
	const backLabel = getGameHubBackLabel({ checklistId, assignmentId });

	return (
		<div className="drill-page games-hub-page" style={themeVars}>
			<PageHeader
				className="games-hub-page-header"
				title={pageTitle}
				description={catalogEntry.description}
				leading={
					<Button
						type="text"
						icon={<ArrowLeftOutlined />}
						aria-label={backLabel}
						onClick={() => router.push(backHref)}
					/>
				}
			/>

			{activePlay && !activeLoading ? (
				<Alert
					className="mb-4"
					type="info"
					showIcon
					message="Bạn có lượt chơi đang dở"
					description={`Điểm hiện tại: ${activePlay.scoreInRun}. Tiếp tục hoặc kết thúc lượt trước khi bắt đầu lượt mới.`}
					action={
						<div className="flex flex-col gap-2 sm:flex-row">
							<Button type="primary" onClick={() => navigateToPlaying(activePlay.playId)}>
								Tiếp tục
							</Button>
							<Button danger onClick={() => void abandonActive()}>
								Kết thúc lượt
							</Button>
						</div>
					}
				/>
			) : null}

			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{sessionConfigError ? (
				<Alert className="mb-4" type="warning" message={sessionConfigError} showIcon />
			) : null}

			{poolError && !pool && !checklistId ? (
				<Alert className="mb-4" type="error" message={poolError} showIcon />
			) : null}

			{!assignmentId && !checklistId ? (
				<>
					<GameModePicker selection={selection} onSelectionChange={handleSelectionChange} />
					<GameSessionDurationPicker
						selection={selection}
						onDurationChange={(sec) =>
							handleSelectionChange({ ...selection, sessionDurationSec: sec })
						}
					/>
					{resolvedSelection.modeId === 'pool_coverage' && effectiveClassId ? (
						<GameBestOfPoolScopePicker
							classId={effectiveClassId}
							classSessionId={classSessionId}
							onScopeChange={({ classSessionId: nextId }) =>
								updateClassSessionId(nextId)
							}
							onScopeKindChange={setBestOfScopeKind}
						/>
					) : null}
				</>
			) : null}

			{poolLoading && !pool && !checklistId ? (
				<Skeleton active paragraph={{ rows: 5 }} />
			) : (
				<DrillPracticeLobby
					pool={pool}
					assignmentCtx={lobbyAssignmentCtx}
					sessionConfig={activeSessionConfig}
					canStart={canStart && !mergedStartBlockReason && !activePlay}
					startBlockReason={
						activePlay
							? 'Hãy tiếp tục hoặc kết thúc lượt đang dở trước.'
							: mergedStartBlockReason
					}
					weakWords={weakWords}
					weakWordsLoading={weakWordsLoading}
					classId={classId}
					onStart={() => void onStartClick()}
					onRefresh={() => void loadPool()}
				/>
			)}

			{starting ? (
				<Alert className="mt-4" type="info" message="Đang bắt đầu lượt chơi…" showIcon />
			) : null}

			{effectiveClassId && promptType && !assignmentId && !checklistId ? (
				<GameHubLeaderboardPanel
					classId={effectiveClassId}
					gameTitle={catalogEntry.title}
					promptType={promptType}
					modeId={resolvedSelection.modeId}
				/>
			) : null}
		</div>
	);
}
