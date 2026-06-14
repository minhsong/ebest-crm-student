'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Skeleton, theme } from 'antd';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import { PageHeader } from '@/components/layout';
import { VocabularyDrillRunResultScreen } from '@/features/learning/games/vocabulary-drill/presentation/VocabularyDrillRunResultScreen';
import { DrillGameLayout } from '@/features/learning/components/drill/DrillGameLayout';
import { DrillPracticeLobby } from '@/features/learning/components/drill/DrillPracticeLobby';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import {
	vocabularyGameAssignmentsHref,
	vocabularyLeaderboardHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { getVocabularyDrillPresentation } from '@/features/learning/games/registry/game-presentation.registry';
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
		sessionConfig: authorizedSessionConfig,
		sessionConfigLoading,
		sessionConfigError,
		authorizeContext,
		weakWords,
		weakWordsLoading,
		refreshWeakWords,
		refreshAssignmentContext,
	} = useDrillPracticePool({ classId, assignmentId });

	const [runtimeSessionConfig, setRuntimeSessionConfig] =
		useState<GameSessionConfig | null>(null);
	const activeSessionConfig = runtimeSessionConfig ?? authorizedSessionConfig;

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
		poolProgress,
		runPassed,
		gradebookSyncFailed,
	} = useDrillPracticeSession({
		effectiveClassId,
		assignmentId,
		resolvedSelection,
		sessionConfig: activeSessionConfig,
		onSessionConfigChange: setRuntimeSessionConfig,
		authorizeContext,
		assignmentMinimumScore: assignmentCtx?.minimumScore,
		assignmentPoolSize: assignmentCtx?.assignmentPoolSize,
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

	const presentation = useMemo(
		() => getVocabularyDrillPresentation(activeSessionConfig),
		[activeSessionConfig],
	);

	const backHref = useMemo(() => {
		if (assignmentId) return vocabularyGameAssignmentsHref();
		if (classId) return '/learning/games';
		return '/learning/games';
	}, [assignmentId, classId]);

	const leaderboardHref =
		classId && !Number.isNaN(classId) ? vocabularyLeaderboardHref(classId) : null;

	const pageTitle = assignmentCtx
		? assignmentCtx.title
		: 'Game luyện từ';

	const isPlaying = Boolean(question && !finished);
	const showLobby = !isPlaying && !finished;

	if (poolLoading || resuming || sessionConfigLoading) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Game luyện từ" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (poolError || sessionConfigError) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Game luyện từ" />
				<Alert
					type="error"
					message={poolError ?? sessionConfigError}
					showIcon
				/>
				<Link href={backHref} className="mt-4 inline-block">
					<Button>Quay lại</Button>
				</Link>
			</div>
		);
	}

	if (!presentation) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Game luyện từ" />
				<Alert
					type="warning"
					message="Không tải được cấu hình luyện tập. Vui lòng thử lại."
					showIcon
				/>
				<Link href={backHref} className="mt-4 inline-block">
					<Button onClick={() => void loadPool()}>Thử lại</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="drill-page" style={themeVars}>
			{!isPlaying && !finished ? (
				<PageHeader
					title={pageTitle}
					description={
						assignmentCtx
							? 'Bài tập game'
							: 'Chọn mode và bắt đầu — quay lại trang Game nếu muốn đổi lớp.'
					}
					extra={
						!assignmentId ? (
							<Link href="/learning/games">
								<Button>Về trang Game</Button>
							</Link>
						) : undefined
					}
				/>
			) : null}

			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{gradebookSyncFailed ? (
				<Alert
					className="mb-4"
					type="warning"
					showIcon
					message="Điểm lượt chơi chưa đồng bộ với sổ điểm"
					description="Kết quả vẫn được lưu trên hệ thống game. Nếu điểm bài tập chưa cập nhật, hãy liên hệ giáo viên hoặc thử làm lại sau."
				/>
			) : null}

			{finished ? (
				<VocabularyDrillRunResultScreen
					resultProfileId={presentation.resultProfileId}
					score={scoreInRun}
					bestScore={assignmentCtx?.bestScore}
					bestTotal={assignmentCtx?.bestTotal ?? assignmentCtx?.assignmentPoolSize}
					wasWrongEnd={lastCorrect === false}
					poolProgress={poolProgress}
					minimumScore={assignmentCtx?.minimumScore}
					passed={runPassed}
					onReplay={() => void handleStart()}
					leaderboardHref={leaderboardHref}
				/>
			) : null}

			{isPlaying && question ? (
				<DrillGameLayout
					presentation={presentation}
					assignmentTitle={assignmentCtx?.title}
					backHref={backHref}
					score={scoreInRun}
					streak={streak}
					poolProgress={poolProgress}
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
					selection={selection}
					resolvedSelection={resolvedSelection}
					onSelectionChange={setSelection}
					pool={pool}
					assignmentCtx={assignmentCtx}
					sessionConfig={activeSessionConfig}
					canStart={canStart}
					startBlockReason={startBlockReason}
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
