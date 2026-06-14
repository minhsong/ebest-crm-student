export type LearningMasteryState = 'new' | 'exposed' | 'learning';

export interface LearningHubClass {
	classId: number;
	className: string;
	courseId: number;
	interactionMode?: 'interactive' | 'read_only';
	/** Có thể luyện flashcard / ghi tiến độ (lớp COMPLETED vẫn true nếu enrollment ACTIVE). */
	canRecordEvents?: boolean;
	readOnlyReason?: string | null;
}

export interface LearningHubNearestSession {
	classSessionId: number;
	classId: number;
	className: string;
	title: string;
	assetCount: number;
	scheduledDate: string;
	isToday: boolean;
}

/** @deprecated — dùng LearningHubNearestSession */
export type LearningHubTodaySession = LearningHubNearestSession;

export interface LearningHubWeekStats {
	weekStart: string;
	weekEventCount: number;
	weekUniqueAssetsSeen: number;
	weekQuizAttempts: number;
	weekDrillScore?: number;
	weekDrillPlays?: number;
}

export interface LearningAssignmentDueItem {
	assignmentId: number;
	classId: number;
	title: string;
	deadline: string;
	className: string;
	sessionTitle: string;
	resultStatus: number | null;
	exerciseType: string | null;
}

export type LearningRecommendationType =
	| 'assignment_due'
	| 'flashcard_session'
	| 'review_assets'
	| 'vocabulary_drill_practice'
	| 'resume_attempt';

export type LearningRecommendationAction =
	| { type: 'assignment_due'; route: '/assignments'; assignmentId: number }
	| {
			type: 'flashcard_session';
			route: '/learning/flashcard';
			classId: number;
			classSessionId: number;
	  }
	| {
			type: 'review_assets';
			route: string;
			assetIds: number[];
			classId?: number;
			classSessionId?: number;
	  }
	| {
			type: 'vocabulary_drill_practice';
			route: string;
			classId: number;
	  }
	| { type: 'resume_attempt'; route: string; attemptPublicId: string };

export interface LearningRecommendationItem {
	type: LearningRecommendationType;
	priority: number;
	title: string;
	reason: string;
	action: LearningRecommendationAction;
}

export interface LearningHubPayload {
	recommendations: LearningRecommendationItem[];
	assignmentsDue: LearningAssignmentDueItem[];
	nearestSession: LearningHubNearestSession | null;
	/** @deprecated — alias nearestSession */
	todaySession?: LearningHubNearestSession | null;
	weekStats: LearningHubWeekStats;
	classes: LearningHubClass[];
	context?: {
		hasActiveEnrollment: boolean;
		hasViewableClasses?: boolean;
		messageCode: 'NO_ACTIVE_ENROLLMENT' | 'NO_ENROLLMENT' | null;
	};
}

export interface LearningVocabularyLearningAccess {
	mode: 'interactive' | 'read_only';
	canRecordEvents: boolean;
	readOnlyReason: string | null;
}

export interface LearningVocabularySessionListItem {
	classSessionId: number;
	title: string;
	scheduledDate: string;
	assetCount: number;
}

export interface LearningVocabularySessionsPayload {
	classId: number;
	learningAccess: LearningVocabularyLearningAccess;
	sessions: LearningVocabularySessionListItem[];
}

export interface LearningProgressSummary {
	assetId: number;
	masteryState: LearningMasteryState;
	masteryLabel: string;
	firstSeenAt: string | null;
	lastSeenAt: string | null;
	timesSeen: number;
	knownCount: number;
	unknownCount: number;
	accuracyRate: number | null;
	lastQuizAt: string | null;
}

export interface LearningVocabularyItem {
	order: number;
	asset: {
		id: number;
		assetType: string;
		word: string;
		translation?: string;
		meanings?: string[];
		ipaUk?: string;
		ipaUs?: string;
		example?: string;
		exampleTranslation?: string;
		audioUkUrl?: string;
		audioUsUrl?: string;
		imageUrl?: string;
		status: string;
	};
	progress: LearningProgressSummary;
}

export interface LearningVocabularyPayload {
	source: string;
	classSessionId: number;
	classId: number;
	courseSessionId: number | null;
	sessionTitle?: string;
	learningAccess?: LearningVocabularyLearningAccess;
	items: LearningVocabularyItem[];
}

export type LearningEventType =
	| 'asset.viewed'
	| 'asset.audio_played'
	| 'asset.reviewed'
	| 'activity.started'
	| 'activity.completed';

export type LearningEventSource = 'self_study' | 'practice' | 'assignment';

export type SelfRating = 'known' | 'unknown';

export interface LearningEventItem {
	eventType: LearningEventType;
	source: LearningEventSource;
	occurredAt?: string;
	clientOccurredAt?: string;
	studySessionId?: string;
	classId?: number;
	courseSessionId?: number;
	classSessionId?: number;
	assetId?: number;
	payload?: Record<string, unknown>;
}

export interface VocabularyPoolEntry {
	assetId: number;
	word: string;
	translation?: string;
	effectiveTier: 'required' | 'extended';
}

export interface VocabularyPoolPayload {
	classId: number;
	courseId: number | null;
	practiceEnabled: boolean;
	poolSize: number;
	requiredCount: number;
	extendedCount: number;
	minPoolSize: number;
	entries: VocabularyPoolEntry[];
	learningAccess?: LearningVocabularyLearningAccess;
}

export interface DrillQuestionClient {
	questionId: string;
	prompt: string;
	promptType: 'meaning' | 'audio';
	promptAudioUrl?: string;
	options: Array<{ id: string; label: string; assetId: number }>;
}

export interface WeakWordRow {
	assetId: number;
	word: string;
	wrongCount: number;
	attemptCount: number;
}

export interface WeakWordsPayload {
	classId: number;
	rows: WeakWordRow[];
}

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

export interface DrillSessionClient {
	playId: string;
	classId: number;
	assignmentId: number | null;
	modeId: 'survival' | 'pool_coverage';
	promptType: 'meaning_to_word' | 'audio_to_word';
	scoreInRun: number;
	streak: number;
	status: string;
	sessionConfig: GameSessionConfig | null;
	question: DrillQuestionClient;
}

export interface DrillSessionResumePayload {
	playId: string;
	classId: number;
	assignmentId: number | null;
	modeId: 'survival' | 'pool_coverage';
	promptType: 'meaning_to_word' | 'audio_to_word';
	scoreInRun: number;
	streak: number;
	status: string;
	sessionConfig: GameSessionConfig | null;
	question?: DrillQuestionClient;
	progress?: {
		answered: number;
		total: number;
		correct: number;
		wrong: number;
	} | null;
	lastAnswerCorrect?: boolean | null;
	runPassed?: boolean | null;
	gradebookSyncFailed?: boolean;
}

export interface DrillAnswerResult {
	playId: string;
	correct: boolean;
	scoreInRun: number;
	status: string;
	completed: boolean;
	nextQuestion?: DrillQuestionClient;
	progress?: {
		answered: number;
		total: number;
		correct: number;
		wrong: number;
	};
}

export interface AssignmentDrillContextPayload {
  assignmentId: number;
  classId: number;
  title: string;
  minimumScore: number;
  modeId: 'survival' | 'pool_coverage';
  promptType: 'meaning_to_word' | 'audio_to_word';
  assignmentPoolSize: number;
  unlockPoolSize: number;
  bestScore: number;
  bestTotal?: number;
  assignmentComplete: boolean;
  canPlay: boolean;
  learningAccess?: LearningVocabularyLearningAccess;
  config?: {
    wordScopeMode: 'class_pool' | 'custom_selection';
  };
}

export type DrillLeaderboardBoardKind =
	| 'per_play_score'
	| 'total_plays'
	| 'total_correct';

export interface DrillLeaderboardRow {
	rank: number;
	customerId: number;
	displayName: string;
	score: number;
	playCount: number;
}

export interface DrillLeaderboardPerPlayRow extends DrillLeaderboardRow {
	playId: string;
	classId: number;
	className: string;
	correctCount: number;
	completedAt: string;
	modeId: string;
}

export interface DrillLeaderboardPayload {
	boardKind: DrillLeaderboardBoardKind;
	classId: number;
	courseId: number | null;
	scope: 'class' | 'course';
	period: 'week' | 'month' | 'all';
	periodLabel: string;
	page: number;
	pageSize: number;
	total: number;
	rows: DrillLeaderboardRow[] | DrillLeaderboardPerPlayRow[];
	self: {
		rank: number | null;
		score: number;
		playCount: number;
		playId?: string;
		pageHint?: number;
	} | null;
	hidden?: boolean;
	hiddenReason?: string;
}

export interface FlashcardSessionCard {
	assetId: number;
	word: string;
	meaning?: string;
	promptAudioUrl?: string;
	audioUkUrl?: string;
	audioUsUrl?: string;
	imageUrl?: string;
	ipaUk?: string;
	ipaUs?: string;
	example?: string;
	exampleTranslation?: string;
	selfRating?: 'known' | 'unknown';
}

export interface FlashcardSessionPayload {
	sessionId: string;
	classId: number;
	classSessionId: number;
	courseSessionId: number | null;
	status: string;
	sessionConfig?: {
		gameFamily: 'flashcard_review';
		modeId: 'session_review';
		presentation: {
			coreLayoutProfileId: string;
			detailWidgetId: string;
			resultProfileId: string;
		};
	} | null;
	cards: FlashcardSessionCard[];
	summary: { knownCount: number; unknownCount: number; total: number };
}
