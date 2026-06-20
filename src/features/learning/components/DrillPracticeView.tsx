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
import { DrillGameSplashScreen } from '@/features/learning/components/drill/DrillGameSplashScreen';
import { drillAntdCssVars } from '@/features/learning/components/drill/drill-antd-theme';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import {
	vocabularyGameAssignmentsHref,
	vocabularyLeaderboardHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import type { AssignmentDrillContextPayload } from '@/types/learning';
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
	const checklistIdParam = searchParams.get('checklistId');
	const playIdParam = searchParams.get('playId');
	const classId = classIdParam ? Number(classIdParam) : null;
	const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : null;
	const checklistId = checklistIdParam ? Number(checklistIdParam) : null;

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
	} = useDrillPracticePool({ classId, assignmentId, checklistId });

	const checklistLobbyCtx = useMemo((): AssignmentDrillContextPayload | null => {
		if (!checklistId || !authorizeContext?.rules) return null;
		const rawMinimum = authorizeContext.rules.minimumScore;
		if (rawMinimum == null || !Number.isFinite(rawMinimum)) return null;
		const minimumScore = Math.floor(rawMinimum);
		const poolSize =
			authorizeContext.pool?.batchSize ??
			authorizeContext.pool?.totalAssetIds?.length ??
			0;
		const progress = authorizeContext.progress;
		return {
			assignmentId: 0,
			classId: authorizeContext.classId,
			title: 'Nhiệm vụ phạt chơi game',
			minimumScore,
			modeId: 'pool_coverage',
			promptType: resolvedSelection.promptType,
			assignmentPoolSize: poolSize,
			unlockPoolSize: poolSize,
			bestScore: progress?.bestScore ?? 0,
			bestTotal: poolSize,
			assignmentComplete: progress?.checked ?? false,
			canPlay: poolSize > 0,
			contextKind: 'checklist_penalty',
		};
	}, [authorizeContext, checklistId, resolvedSelection.promptType]);

	const lobbyAssignmentCtx = assignmentCtx ?? checklistLobbyCtx;
	const checklistMinimumScore =
		authorizeContext?.rules?.minimumScore != null &&
		Number.isFinite(authorizeContext.rules.minimumScore)
			? Math.floor(authorizeContext.rules.minimumScore)
			: undefined;
	const checklistPoolSize =
		authorizeContext?.pool?.batchSize ??
		authorizeContext?.pool?.totalAssetIds?.length;

	const [runtimeSessionConfig, setRuntimeSessionConfig] =
		useState<GameSessionConfig | null>(null);
	const activeSessionConfig = runtimeSessionConfig ?? authorizedSessionConfig;

	const {
		question,
		scoreInRun,
		streak,
		resuming,
		starting,
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
		assignmentMinimumScore: assignmentCtx?.minimumScore ?? checklistMinimumScore,
		assignmentPoolSize: assignmentCtx?.assignmentPoolSize ?? checklistPoolSize,
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

	const pageTitle = checklistId
		? 'Nhiệm vụ luyện từ'
		: (lobbyAssignmentCtx?.title ?? 'Game luyện từ');

	const isPlaying = Boolean(question && !finished);
	const showLobby = !isPlaying && !finished && !starting;

	if (resuming) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Game luyện từ" />
				<DrillGameSplashScreen
					title="Đang khôi phục lượt chơi"
					description="Đang tải tiến độ phiên chơi của bạn…"
				/>
			</div>
		);
	}

	if (poolError && !pool && !checklistId) {
		return (
			<div className="drill-page" style={themeVars}>
				<PageHeader title="Game luyện từ" />
				<Alert type="error" message={poolError} showIcon />
				<Link href={backHref} className="mt-4 inline-block">
					<Button>Quay lại</Button>
				</Link>
			</div>
		);
	}

	if (starting) {
		return (
			<div className="drill-page" style={themeVars}>
				<DrillGameSplashScreen />
			</div>
		);
	}

	return (
		<div className="drill-page" style={themeVars}>
			{!isPlaying && !finished ? (
				<PageHeader
					title={pageTitle}
					description={
						checklistId
							? 'Cô đã giao nhiệm vụ — đọc hướng dẫn bên dưới và bắt đầu nhé.'
							: lobbyAssignmentCtx
								? 'Bài tập game'
								: 'Chọn mode và bắt đầu — quay lại trang Game nếu muốn đổi lớp.'
					}
					extra={
						!assignmentId ? (
							<Link href={checklistId ? '/classes' : '/learning/games'}>
								<Button>{checklistId ? 'Về checklist' : 'Về trang Game'}</Button>
							</Link>
						) : undefined
					}
				/>
			) : null}

			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{sessionConfigError && !sessionConfigLoading ? (
				<Alert className="mb-4" type="warning" message={sessionConfigError} showIcon />
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

			{finished && presentation ? (
				<VocabularyDrillRunResultScreen
					resultProfileId={presentation.resultProfileId}
					studentTone={checklistId ? 'checklist_penalty' : 'assignment'}
					score={scoreInRun}
					bestScore={lobbyAssignmentCtx?.bestScore}
					bestTotal={lobbyAssignmentCtx?.bestTotal ?? lobbyAssignmentCtx?.assignmentPoolSize}
					wasWrongEnd={lastCorrect === false}
					poolProgress={poolProgress}
					minimumScore={lobbyAssignmentCtx?.minimumScore}
					passed={runPassed}
					onReplay={() => void handleStart()}
					leaderboardHref={leaderboardHref}
				/>
			) : null}

			{isPlaying && question && presentation ? (
				<DrillGameLayout
					presentation={presentation}
					assignmentTitle={lobbyAssignmentCtx?.title}
					backHref={backHref}
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
				/>
			) : null}

			{showLobby ? (
				(checklistId ? sessionConfigLoading : poolLoading && !pool) ? (
					<div className="drill-lobby">
						<Skeleton active paragraph={{ rows: 5 }} />
					</div>
				) : (
					<DrillPracticeLobby
						selection={selection}
						resolvedSelection={resolvedSelection}
						onSelectionChange={setSelection}
						pool={pool}
						assignmentCtx={lobbyAssignmentCtx}
						sessionConfig={activeSessionConfig}
						sessionConfigLoading={sessionConfigLoading}
						canStart={canStart && !sessionConfigLoading && Boolean(activeSessionConfig)}
						startBlockReason={
							sessionConfigLoading
								? checklistId
									? 'Đang chuẩn bị nhiệm vụ…'
									: 'Đang chuẩn bị cấu hình lượt chơi…'
								: startBlockReason
						}
						weakWords={weakWords}
						weakWordsLoading={weakWordsLoading}
						classId={classId}
						onStart={() => void handleStart()}
						onRefresh={() => void loadPool()}
					/>
				)
			) : null}
		</div>
	);
}
