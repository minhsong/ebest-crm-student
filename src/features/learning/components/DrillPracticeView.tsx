'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Skeleton, theme } from 'antd';
import { PageHeader } from '@/components/layout';
import { DrillGameLayout } from '@/features/learning/components/drill/DrillGameLayout';
import { DrillPracticeLobby } from '@/features/learning/components/drill/DrillPracticeLobby';
import { DrillRunResultScreen } from '@/features/learning/components/drill/DrillRunResultScreen';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import './drill/drill-survival.css';

export function DrillPracticeView() {
	const { token } = theme.useToken();
	const themeVars = drillAntdCssVars(token);
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const classIdParam = searchParams.get('classId');
	const assignmentIdParam = searchParams.get('assignmentId');
	const playIdParam = searchParams.get('playId');
	const classId = classIdParam ? Number(classIdParam) : null;
	const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : null;

	const setPlayIdInUrl = useCallback(
		(playId: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (playId) {
				params.set('playId', playId);
			} else {
				params.delete('playId');
			}
			const qs = params.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	const {
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
	} = useDrillPracticePool({ classId, assignmentId });

	const {
		question,
		scoreInRun,
		streak,
		resuming,
		finished,
		lastCorrect,
		feedback,
		selectedOptionId,
		optionsLocked,
		actionError,
		secondsLeft,
		totalSeconds,
		handleStart,
		handleAnswer,
	} = useDrillPracticeSession({
		effectiveClassId,
		assignmentId,
		resolvedGameMode,
		playIdFromUrl: playIdParam,
		onPlayIdChange: setPlayIdInUrl,
		onSessionCompleted: () => {
			if (assignmentId && !Number.isNaN(assignmentId)) {
				void refreshAssignmentContext();
			} else if (classId && !Number.isNaN(classId)) {
				void refreshWeakWords();
			}
		},
	});

	const backHref = useMemo(() => {
		if (assignmentId) return '/assignments';
		if (classId) return `/learning/vocabulary?classId=${classId}`;
		return '/learning';
	}, [assignmentId, classId]);

	const leaderboardHref =
		classId && !Number.isNaN(classId) ? `/learning/leaderboard?classId=${classId}` : null;

	const pageTitle = assignmentCtx
		? assignmentCtx.title
		: 'Luyện từ vựng';

	const isPlaying = Boolean(question && !finished);
	const showLobby = !isPlaying && !finished;

	if (poolLoading || resuming) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Luyện từ vựng" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (poolError) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Luyện từ vựng" />
				<Alert type="error" message={poolError} showIcon />
				<Link href="/learning" className="mt-4 inline-block">
					<Button>Quay lại Học tập</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="drill-page" style={themeVars}>
			{!isPlaying && !finished ? (
				<PageHeader title={pageTitle} description={assignmentCtx ? 'Bài tập game' : undefined} />
			) : null}

			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{finished ? (
				<DrillRunResultScreen
					score={scoreInRun}
					bestScore={assignmentCtx?.bestScore}
					wasWrongEnd={lastCorrect === false}
					onReplay={() => void handleStart()}
					leaderboardHref={leaderboardHref}
				/>
			) : null}

			{isPlaying && question ? (
				<DrillGameLayout
					mode={resolvedGameMode}
					assignmentTitle={assignmentCtx?.title}
					backHref={backHref}
					score={scoreInRun}
					streak={streak}
					assignmentCtx={assignmentCtx}
					question={question}
					selectedOptionId={selectedOptionId}
					feedback={feedback}
					optionsLocked={optionsLocked}
					secondsLeft={secondsLeft}
					totalSeconds={totalSeconds}
					onSelect={(id) => void handleAnswer(id)}
				/>
			) : null}

			{showLobby ? (
				<DrillPracticeLobby
					mode={gameMode}
					onModeChange={setGameMode}
					pool={pool}
					assignmentCtx={assignmentCtx}
					canStart={canStart}
					weakWords={weakWords}
					weakWordsLoading={weakWordsLoading}
					classId={classId}
					onStart={() => void handleStart()}
					onRefresh={() => void loadPool()}
				/>
			) : null}
		</div>
	);
}
