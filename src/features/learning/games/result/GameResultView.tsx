'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Skeleton, theme } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

import { PageHeader } from '@/components/layout';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { GameActionBar } from '@/features/learning/games/catalog-ui/GameActionBar';
import { getGameCatalogEntry } from '@/features/learning/games/catalog/game-catalog.registry';
import { VocabularyDrillRunResultScreen } from '@/features/learning/games/vocabulary-drill/presentation/VocabularyDrillRunResultScreen';
import { useGameRouteContext, useGameSlug } from '@/features/learning/games/session/GameSlugRouteShell';
import { buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';
import {
	getGameHubBackHref,
	getGameHubBackLabel,
} from '@/features/learning/games/session/game-hub-navigation.utils';
import { toGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import { useGameRouteQuery } from '@/features/learning/games/session/use-game-route-query';
import { getVocabularyDrillPresentation } from '@/features/learning/games/registry/game-presentation.registry';
import { vocabularyLeaderboardHref } from '@/features/learning/utils/vocabulary-session-routes';
import { fetchAssignmentDrillContext, fetchDrillSession } from '@/lib/learning-api';
import type { AssignmentDrillContextPayload, DrillSessionResumePayload } from '@/types/learning';
import '@/features/learning/components/drill/drill-survival.css';
import '@/features/learning/games/catalog-ui/games-hub.css';

export function GameResultView() {
	const { token } = theme.useToken();
	const themeVars = drillAntdCssVars(token);
	const router = useRouter();
	const routeQuery = useGameRouteQuery();
	const { reconciled, play: reconciledPlay } = useGameRouteContext();
	const gameSlug = useGameSlug();

	const { playId, classId, assignmentId, checklistId } = routeQuery;

	const catalogEntry = getGameCatalogEntry(gameSlug);

	const [play, setPlay] = useState<DrillSessionResumePayload | null>(reconciledPlay);
	const [assignmentCtx, setAssignmentCtx] = useState<AssignmentDrillContextPayload | null>(null);
	const [loading, setLoading] = useState(!reconciledPlay);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!playId || !reconciled) return;
		if (reconciledPlay) {
			setPlay(reconciledPlay);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		void fetchDrillSession(playId)
			.then((data) => {
				if (!cancelled) setPlay(data);
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Không tải được kết quả.');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [playId, reconciled, reconciledPlay]);

	useEffect(() => {
		if (!assignmentId) return;
		void fetchAssignmentDrillContext(assignmentId).then(setAssignmentCtx);
	}, [assignmentId]);

	const presentation = useMemo(
		() => getVocabularyDrillPresentation(play?.sessionConfig ?? null),
		[play?.sessionConfig],
	);

	const readyHref = buildGameReadyHref(gameSlug, {
		...toGameRouteQuery(routeQuery),
		classId: classId ?? play?.classId ?? null,
		modeId: play?.modeId,
	});

	const hubBackHref = getGameHubBackHref({ checklistId, assignmentId });
	const hubBackLabel = getGameHubBackLabel({ checklistId, assignmentId });

	const leaderboardHref =
		classId && !Number.isNaN(classId) ? vocabularyLeaderboardHref(classId) : null;

	if (!catalogEntry || !playId) {
		return null;
	}

	if (loading) {
		return (
			<div className="drill-page games-hub-page" style={themeVars}>
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (error || !play || !presentation) {
		return (
			<div className="drill-page games-hub-page" style={themeVars}>
				<Alert type="error" message={error ?? 'Không tìm thấy kết quả lượt chơi.'} showIcon />
				<GameActionBar
					actions={[
						{
							key: 'back',
							label: 'Quay lại',
							onClick: () => router.push(readyHref),
						},
					]}
				/>
			</div>
		);
	}

	const runPassed =
		play.runPassed ??
		(assignmentCtx?.minimumScore != null
			? play.scoreInRun >= assignmentCtx.minimumScore
			: null);

	return (
		<div className="drill-page games-hub-page" style={themeVars}>
			<PageHeader
				className="games-hub-page-header"
				title={catalogEntry.title}
				description="Kết quả lượt chơi"
			/>
			<VocabularyDrillRunResultScreen
				resultProfileId={presentation.resultProfileId}
				studentTone={checklistId ? 'checklist_penalty' : 'assignment'}
				score={play.scoreInRun}
				bestScore={assignmentCtx?.bestScore}
				bestTotal={assignmentCtx?.bestTotal ?? assignmentCtx?.assignmentPoolSize}
				wasWrongEnd={
					play.modeId === 'speed_run' ? false : play.lastAnswerCorrect === false
				}
				poolProgress={play.progress ?? undefined}
				minimumScore={assignmentCtx?.minimumScore}
				passed={runPassed}
				onReplay={() => router.push(readyHref)}
				leaderboardHref={leaderboardHref}
				onLeaderboard={
					leaderboardHref ? () => router.push(`${leaderboardHref}&refresh=${Date.now()}`) : undefined
				}
				onGamesHub={() => router.push('/learning/games')}
			/>
			<GameActionBar
				layout="row"
				actions={[
					{
						key: 'games',
						label: 'Game khác',
						icon: <AppstoreOutlined />,
						onClick: () => router.push('/learning/games'),
					},
					{
						key: 'hub',
						label: hubBackLabel,
						onClick: () => router.push(hubBackHref),
					},
				]}
			/>
		</div>
	);
}
