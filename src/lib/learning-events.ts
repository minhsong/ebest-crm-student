import type { LearningEventItem, SelfRating } from '@/types/learning';
import { postLearningEvents } from '@/lib/learning-api';

export function createStudySessionId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `study-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildFlashcardContext(input: {
	classId: number;
	classSessionId: number;
	courseSessionId?: number | null;
	studySessionId: string;
}) {
	return {
		source: 'self_study' as const,
		studySessionId: input.studySessionId,
		classId: input.classId,
		classSessionId: input.classSessionId,
		courseSessionId: input.courseSessionId ?? undefined,
	};
}

export function buildActivityStartedEvent(
	ctx: ReturnType<typeof buildFlashcardContext>,
): LearningEventItem {
	return {
		eventType: 'activity.started',
		source: ctx.source,
		studySessionId: ctx.studySessionId,
		classId: ctx.classId,
		classSessionId: ctx.classSessionId,
		courseSessionId: ctx.courseSessionId,
		payload: { activityType: 'flashcard' },
	};
}

export function buildAssetViewedEvent(
	ctx: ReturnType<typeof buildFlashcardContext>,
	assetId: number,
): LearningEventItem {
	return {
		eventType: 'asset.viewed',
		source: ctx.source,
		studySessionId: ctx.studySessionId,
		classId: ctx.classId,
		classSessionId: ctx.classSessionId,
		courseSessionId: ctx.courseSessionId,
		assetId,
	};
}

export function buildAssetReviewedEvent(
	ctx: ReturnType<typeof buildFlashcardContext>,
	assetId: number,
	selfRating: SelfRating,
): LearningEventItem {
	return {
		eventType: 'asset.reviewed',
		source: ctx.source,
		studySessionId: ctx.studySessionId,
		classId: ctx.classId,
		classSessionId: ctx.classSessionId,
		courseSessionId: ctx.courseSessionId,
		assetId,
		payload: { selfRating },
	};
}

export function buildAssetAudioPlayedEvent(
	ctx: ReturnType<typeof buildFlashcardContext>,
	assetId: number,
	audioLocale: 'uk' | 'us',
): LearningEventItem {
	return {
		eventType: 'asset.audio_played',
		source: ctx.source,
		studySessionId: ctx.studySessionId,
		classId: ctx.classId,
		classSessionId: ctx.classSessionId,
		courseSessionId: ctx.courseSessionId,
		assetId,
		payload: { audioLocale },
	};
}

export function buildActivityCompletedEvent(
	ctx: ReturnType<typeof buildFlashcardContext>,
	summary: { known: number; unknown: number; total: number },
): LearningEventItem {
	return {
		eventType: 'activity.completed',
		source: ctx.source,
		studySessionId: ctx.studySessionId,
		classId: ctx.classId,
		classSessionId: ctx.classSessionId,
		courseSessionId: ctx.courseSessionId,
		payload: {
			activityType: 'flashcard',
			knownCount: summary.known,
			unknownCount: summary.unknown,
			totalCards: summary.total,
		},
	};
}

export async function flushLearningEvents(events: LearningEventItem[]): Promise<void> {
	if (!events.length) return;
	await postLearningEvents(events);
}
