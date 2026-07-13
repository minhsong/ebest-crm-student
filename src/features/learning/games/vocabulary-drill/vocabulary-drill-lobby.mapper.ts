import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { AssignmentDrillContextPayload } from '@/types/learning';
import { checklistPenaltyLobbyCopy } from '@/features/learning/copy/checklist-penalty-game.copy';
import {
	resolveVocabularyDrillPresentationFromSessionConfig,
	type VocabularyDrillLobbyProfileId,
	type VocabularyDrillPresentationProfile,
} from './vocabulary-drill-presentation.mapper';
import { inferVocabularyDrillSessionConfigFromAssignment } from './vocabulary-drill-session-config.utils';
import {
	formatGamePromptTypeLabel,
	formatSpellingDifficultyLabel,
} from './game-config-labels';

export type VocabularyDrillLobbyStat = {
	label: string;
	value: string;
};

export type VocabularyDrillLobbyViewModel = {
	profileId: VocabularyDrillLobbyProfileId;
	presentation: VocabularyDrillPresentationProfile;
	eyebrow: string;
	title: string;
	description: string;
	stats: VocabularyDrillLobbyStat[];
	footerHint?: string;
	showModePicker: boolean;
	ctaLabel: string;
};

function fillLobbyTemplate(
	template: string,
	vars: Record<string, string | number>,
): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		vars[key] != null ? String(vars[key]) : '',
	);
}

function buildConfiguredGameStats(
	assignmentCtx: AssignmentDrillContextPayload,
): VocabularyDrillLobbyStat[] {
	const stats: VocabularyDrillLobbyStat[] = [
		{
			label: 'Loại game',
			value: formatGamePromptTypeLabel(assignmentCtx.promptType),
		},
	];
	const difficultyLabel = formatSpellingDifficultyLabel(
		assignmentCtx.spellingDifficulty,
	);
	if (assignmentCtx.promptType === 'spelling' && difficultyLabel) {
		stats.push({ label: 'Độ khó', value: difficultyLabel });
	}
	return stats;
}

function resolveFreePracticeSurvivalPresentation(): VocabularyDrillPresentationProfile {
	return {
		modeLayoutProfileId: 'survival_streak',
		resultProfileId: 'survival_result',
		lobbyProfileId: 'free_practice',
		detailWidgetId: 'meaning_mcq',
		modeLabel: 'Survival',
		usesStreakHud: true,
		usesPoolProgressBar: false,
	};
}

/** Presentation lobby từ assignment context — không cần authorize sớm. */
function inferSessionConfigFromAssignment(
	ctx: AssignmentDrillContextPayload,
): GameSessionConfig {
	return inferVocabularyDrillSessionConfigFromAssignment(ctx);
}

function buildChecklistPenaltyLobbyPlaceholder(
	presentation: VocabularyDrillPresentationProfile,
): VocabularyDrillLobbyViewModel {
	return {
		profileId: 'assignment_pool_coverage',
		presentation,
		eyebrow: 'Thông báo từ lớp',
		title: 'Bạn đã bị Cô phạt chơi game',
		description:
			'Hãy hoàn thành nhiệm vụ — bấm Bắt đầu để xem chi tiết và vào lượt chơi.',
		stats: [],
		footerHint: 'Chúc bạn may mắn — cố lên, bạn làm được!',
		showModePicker: false,
		ctaLabel: 'Bắt đầu làm bài',
	};
}

function buildChecklistPenaltyLobby(
	presentation: VocabularyDrillPresentationProfile,
	assignmentCtx: AssignmentDrillContextPayload,
): VocabularyDrillLobbyViewModel {
	const bestTotal = assignmentCtx.bestTotal ?? assignmentCtx.assignmentPoolSize;
	const copy = checklistPenaltyLobbyCopy({
		minimumScore: assignmentCtx.minimumScore,
		poolSize: assignmentCtx.assignmentPoolSize,
		bestScore: assignmentCtx.bestScore,
		bestTotal,
		complete: assignmentCtx.assignmentComplete,
	});

	return {
		profileId: 'assignment_pool_coverage',
		presentation,
		eyebrow: copy.eyebrow,
		title: copy.title,
		description: copy.description,
		stats: [
			...buildConfiguredGameStats(assignmentCtx),
			{ label: copy.statMinimumLabel, value: String(assignmentCtx.minimumScore) },
			{
				label: copy.statBestLabel,
				value: `${assignmentCtx.bestScore}/${bestTotal}`,
			},
			{ label: copy.statPoolLabel, value: String(assignmentCtx.assignmentPoolSize) },
		],
		footerHint: copy.footerHint,
		showModePicker: false,
		ctaLabel: copy.ctaLabel,
	};
}

export function buildVocabularyDrillLobbyViewModel(input: {
	sessionConfig?: GameSessionConfig | null;
	assignmentCtx: AssignmentDrillContextPayload | null;
}): VocabularyDrillLobbyViewModel {
	const { sessionConfig, assignmentCtx } = input;

	if (assignmentCtx?.contextKind === 'checklist_penalty') {
		const config =
			sessionConfig ?? inferSessionConfigFromAssignment(assignmentCtx);
		const presentation = resolveVocabularyDrillPresentationFromSessionConfig(config);
		if (assignmentCtx.assignmentPoolSize <= 0 || assignmentCtx.minimumScore <= 0) {
			return buildChecklistPenaltyLobbyPlaceholder(presentation);
		}
		return buildChecklistPenaltyLobby(presentation, assignmentCtx);
	}

	if (assignmentCtx) {
		const config =
			sessionConfig ?? inferSessionConfigFromAssignment(assignmentCtx);
		const presentation = resolveVocabularyDrillPresentationFromSessionConfig(config);
		const lobby = config.presentation.lobby;
		const bestTotal = assignmentCtx.bestTotal ?? assignmentCtx.assignmentPoolSize;
		const isPool = presentation.usesPoolProgressBar;
		const profileId: VocabularyDrillLobbyProfileId = isPool
			? 'assignment_pool_coverage'
			: 'assignment_survival';

		const assignmentCopy = lobby?.assignment;
		const templateVars = {
			minimumScore: assignmentCtx.minimumScore,
			bestScore: assignmentCtx.bestScore,
			bestTotal,
			poolSize: assignmentCtx.assignmentPoolSize,
		};

		const description = assignmentCtx.assignmentComplete
			? fillLobbyTemplate(
					assignmentCopy?.descriptionComplete ??
						(isPool
							? 'Bạn đã hoàn thành bài tập. Kết quả tốt nhất: {{bestScore}}/{{bestTotal}} từ đúng.'
							: 'Bạn đã đạt yêu cầu. Điểm cao nhất: {{bestScore}}/{{minimumScore}}.'),
					templateVars,
				)
			: fillLobbyTemplate(
					assignmentCopy?.descriptionActive ??
						(isPool
							? 'Làm hết {{poolSize}} câu và trả lời đúng ít nhất {{minimumScore}} từ để hoàn thành bài tập nhé!'
							: 'Đạt {{minimumScore}} điểm trong một lượt để hoàn thành bài tập. Cố lên!'),
					templateVars,
				);

		return {
			profileId,
			presentation,
			eyebrow: assignmentCopy?.eyebrow ?? 'Bài tập luyện từ',
			title: assignmentCtx.title,
			description,
			stats: [
				...buildConfiguredGameStats(assignmentCtx),
				{
					label: assignmentCopy?.statMinimumLabel ?? (isPool ? 'Cần đạt' : 'Mục tiêu'),
					value: String(assignmentCtx.minimumScore),
				},
				{
					label: assignmentCopy?.statBestLabel ?? 'Kết quả tốt nhất',
					value:
						isPool && bestTotal
							? `${assignmentCtx.bestScore}/${bestTotal}`
							: String(assignmentCtx.bestScore),
				},
				{
					label: assignmentCopy?.statPoolLabel ?? 'Số từ',
					value: String(assignmentCtx.assignmentPoolSize),
				},
			],
			footerHint: isPool
				? (assignmentCopy?.footerHint ??
					'Trả lời hết danh sách từ trong một lượt — bạn làm được!')
				: undefined,
			showModePicker: false,
			ctaLabel: assignmentCopy?.ctaLabel ?? 'Bắt đầu làm bài',
		};
	}

	const presentation = sessionConfig
		? resolveVocabularyDrillPresentationFromSessionConfig(sessionConfig)
		: resolveFreePracticeSurvivalPresentation();
	const lobby = sessionConfig?.presentation.lobby;
	const free = lobby?.freePractice;

	return {
		profileId: 'free_practice',
		presentation,
		eyebrow: free?.eyebrow ?? 'Luyện từ vựng',
		title: free?.title ?? 'Survival Challenge',
		description:
			free?.description ??
			'Trả lời đúng liên tiếp để ghi điểm. Một câu sai — lượt kết thúc.',
		stats: [],
		showModePicker: true,
		ctaLabel: free?.ctaLabel ?? 'Bắt đầu lượt chơi',
	};
}
