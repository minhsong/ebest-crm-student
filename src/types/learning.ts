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

export interface VocabularyFamilyMemberSummary {
	id: number;
	word: string;
	partOfSpeech: string;
	displayLabel: string;
	translations?: Record<string, string>;
	translationPreview?: string;
	isPrimary: boolean;
	family?: number | null;
}

export interface DictionarySuggestItem {
	assetId: number;
	word: string;
	partOfSpeech: string;
	displayLabel: string;
	translationPreview: string;
}

export interface DictionarySuggestPayload {
	items: DictionarySuggestItem[];
	meta: { query: string; count: number };
}

export interface DictionarySearchItem {
	assetId: number;
	word: string;
	partOfSpeech: string;
	partOfSpeechLabel?: string;
	displayLabel: string;
	translationPreview: string;
	hasAudio: boolean;
	hasImage: boolean;
	isPrimary: boolean;
	siblingCount: number;
}

export interface DictionarySearchPayload {
	items: DictionarySearchItem[];
	pagination: {
		total: number;
		current: number;
		pageSize: number;
		totalPages: number;
	};
	meta: { query: string };
}

export interface DictionaryDetailFamilyMember {
	assetId: number;
	word: string;
	partOfSpeech: string;
	displayLabel: string;
	translationPreview: string;
	isPrimary: boolean;
}

export interface DictionaryDetailAsset {
	id: number;
	word: string;
	partOfSpeech: string;
	partOfSpeechLabel?: string;
	displayLabel: string;
	meaningEn?: string;
	translations: Record<string, string>;
	ipaUk?: string;
	ipaUs?: string;
	audioUkUrl?: string;
	audioUsUrl?: string;
	imageUrl?: string;
	example?: string;
	exampleTranslation?: string;
	synonyms?: string[];
	antonyms?: string[];
	domainTags?: Array<{ code: string; name: string }>;
	familyMembers?: DictionaryDetailFamilyMember[];
}

export type DictionaryLookupSource = 'suggest' | 'search' | 'direct';

export interface DictionaryDetailPayload {
	asset: DictionaryDetailAsset;
	practice?: {
		canPractice: boolean;
		reason?: string;
		flashcardHref?: string;
		drillHref?: string;
	} | null;
}

export interface DictionaryProgressPayload {
	assetId: number;
	masteryState: string;
	masteryLabel: string;
	timesSeen: number;
	accuracyRate: number | null;
}

export interface LearningVocabularyItem {
	order: number;
	asset: {
		id: number;
		assetType: string;
		word: string;
		translation?: string;
		translationPreview?: string;
		meanings?: string[];
		meaningEn?: string;
		translations?: Record<string, string>;
		partOfSpeech?: string;
		partOfSpeechLabel?: string;
		displayLabel?: string;
		familyRootId?: number;
		family?: number | null;
		isPrimary?: boolean;
		siblingCount?: number;
		familyMembers?: VocabularyFamilyMemberSummary[];
		ipaUk?: string;
		ipaUs?: string;
		example?: string;
		exampleTranslation?: string;
		audioUkUrl?: string;
		audioUsUrl?: string;
		imageUrl?: string;
		synonyms?: string[];
		antonyms?: string[];
		domainTags?: Array<{ code: string; name: string }>;
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
	/** Số từ có phát âm — dùng catalog eligibility (không enrich URL). */
	audioEntryCount?: number;
	/** Số từ có ảnh — dùng catalog eligibility. */
	imageEntryCount?: number;
	/** Spelling — ảnh + nghĩa VI + headword hợp lệ. */
	spellingEligibleEntryCount?: number;
	learningAccess?: LearningVocabularyLearningAccess;
}

import type { GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';

export interface DrillQuestionClient {
	questionId: string;
	prompt: string;
	promptType: 'meaning' | 'audio' | 'image' | 'word';
	promptAudioUrl?: string;
	promptImageUrl?: string;
	options: Array<{
		id: string;
		label: string;
		assetId: number;
		partOfSpeech?: string;
		partOfSpeechLabel?: string;
		imageUrl?: string;
	}>;
	spellingTiles?: Array<{ tileId: string; letter: string }>;
	letterCount?: number;
	spellingDifficulty?: SpellingDifficulty;
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

import type {
	GameSessionConfig,
	SpellingDifficulty,
	VocabularyDrillModeId,
} from '@/features/learning/games/core/types/game-session-config.types';

export type { VocabularyDrillModeId };

export interface DrillSessionClient {
	playId: string;
	classId: number;
	assignmentId: number | null;
	modeId: VocabularyDrillModeId;
	promptType: GamePromptType;
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
	modeId: VocabularyDrillModeId;
	promptType: GamePromptType;
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
  modeId: VocabularyDrillModeId;
  promptType: GamePromptType;
  assignmentPoolSize: number;
  unlockPoolSize: number;
  bestScore: number;
  bestTotal?: number;
  assignmentComplete: boolean;
  canPlay: boolean;
  /** GV assignment — độ khó Spelling (SPELLING_GAME_SPEC §4.3). */
  spellingDifficulty?: SpellingDifficulty;
  /** Phân biệt bài tập lớp vs checklist phạt — copy học viên. */
  contextKind?: 'assignment' | 'checklist_penalty';
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
	durationMs: number | null;
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
	partOfSpeech?: string;
	partOfSpeechLabel?: string;
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
