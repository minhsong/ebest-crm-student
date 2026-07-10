'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	flashcardReviewRuntimeAdapter,
	mapFlashcardCardToVocabularyItem,
	remapCardOrder,
	resolveFlashcardProgressPercent,
} from '@/features/learning/games/flashcard-review/runtime';
import { FLASHCARD_FRONT_AUTO_PLAY_DELAY_MS } from '@/features/learning/games/flashcard-review/flashcard-auto-play.config';
import { resolveFlashcardAutoPlayAudioUrl } from '@/features/learning/games/flashcard-review/flashcard-auto-play.util';
import { useFlashcardAutoPlaySequence } from '@/features/learning/games/flashcard-review/hooks/use-flashcard-auto-play-sequence';
import type { FlashcardReviewSessionConfigLike } from '@/features/learning/games/flashcard-review/flashcard-review-presentation.mapper';
import { getFlashcardReviewPresentation } from '@/features/learning/games/registry/game-presentation.registry';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import {
	flashcardBackHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { resolvePreferredVocabularyAudio } from '@/features/learning/utils/vocabulary-display.util';
import { shuffleArray } from '@/features/learning/utils/shuffle-array';
import { primeGameAudio } from '@/features/learning/utils/game-sfx';
import { playFlashcardFlipSound } from '@/features/learning/utils/flashcard-flip-sound';
import { unlockHtmlAudioSession } from '@/lib/html-audio-session';
import type { LearningVocabularyItem } from '@/types/learning';

type Phase = 'loading' | 'card' | 'done' | 'error';

type SubmitRatingOptions = {
	bypassCanRate?: boolean;
};

export function useFlashcardSession(classId: number, classSessionId: number) {
	const [phase, setPhase] = useState<Phase>('loading');
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [items, setItems] = useState<LearningVocabularyItem[]>([]);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [canRate, setCanRate] = useState(false);
	const [knownCount, setKnownCount] = useState(0);
	const [unknownCount, setUnknownCount] = useState(0);
	const [sessionTitle, setSessionTitle] = useState('');
	const [sessionConfig, setSessionConfig] = useState<FlashcardReviewSessionConfigLike | null>(
		null,
	);
	const [autoPlayActive, setAutoPlayActive] = useState(false);

	const startRequestedRef = useRef(false);

	const { playingLocale, isPlaying, playAudio, playAndWait, stopAudio } = useVocabularyAudio({
		active: phase === 'card' && !autoPlayActive,
	});

	const backHref = useMemo(
		() => flashcardBackHref(classId, classSessionId),
		[classId, classSessionId],
	);

	const practiceHref = useMemo(
		() => (Number.isFinite(classId) ? vocabularyPracticeHref(classId) : '/learning/games'),
		[classId],
	);

	const presentation = useMemo(
		() => getFlashcardReviewPresentation(sessionConfig),
		[sessionConfig],
	);

	const current = items[index];
	const remainingCount = items.length - index;
	const canReshuffleRemaining = remainingCount > 1;
	const progressPercent = resolveFlashcardProgressPercent(index, items.length, phase);
	const autoPlayAudioUrl = resolveFlashcardAutoPlayAudioUrl(current);

	const summary = useMemo(
		() => ({ known: knownCount, unknown: unknownCount, total: items.length }),
		[knownCount, unknownCount, items.length],
	);

	const finishSession = useCallback(
		async (known: number, unknown: number) => {
			if (sessionId) {
				try {
					await flashcardReviewRuntimeAdapter.completeSession(sessionId);
				} catch {
					// Summary local vẫn hiển thị nếu complete retry sau.
				}
			}
			setKnownCount(known);
			setUnknownCount(unknown);
			setPhase('done');
		},
		[sessionId],
	);

	const submitRating = useCallback(
		async (selfRating: 'known' | 'unknown', options?: SubmitRatingOptions) => {
			if (!current || !sessionId) {
				return;
			}
			if (!options?.bypassCanRate && !canRate) {
				return;
			}

			try {
				await flashcardReviewRuntimeAdapter.reviewCard(
					sessionId,
					current.asset.id,
					selfRating,
				);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Không ghi được đánh giá thẻ.');
				setPhase('error');
				return;
			}

			const nextKnown = knownCount + (selfRating === 'known' ? 1 : 0);
			const nextUnknown = unknownCount + (selfRating === 'unknown' ? 1 : 0);
			setKnownCount(nextKnown);
			setUnknownCount(nextUnknown);

			if (index + 1 >= items.length) {
				setAutoPlayActive(false);
				await finishSession(nextKnown, nextUnknown);
				return;
			}
			setIndex((i) => i + 1);
		},
		[
			canRate,
			current,
			finishSession,
			index,
			items.length,
			knownCount,
			sessionId,
			unknownCount,
		],
	);

	const { repeatIndex: autoPlayRepeatIndex } = useFlashcardAutoPlaySequence({
		active: autoPlayActive && phase === 'card',
		cardAssetId: current?.asset.id,
		audioUrl: autoPlayAudioUrl,
		playOnce: playAndWait,
		stopPlayback: stopAudio,
		onAdvanceKnown: () => submitRating('known', { bypassCanRate: true }),
	});

	useEffect(() => {
		if (!Number.isFinite(classId) || classId < 1 || !Number.isFinite(classSessionId) || classSessionId < 1) {
			setError('Thiếu tham số lớp hoặc buổi học.');
			setPhase('error');
			return;
		}
		if (startRequestedRef.current) {
			return;
		}
		startRequestedRef.current = true;

		void (async () => {
			try {
				const auth = await flashcardReviewRuntimeAdapter.authorizeSession(
					classId,
					classSessionId,
				);
				if (!auth.allowed) {
					setError(auth.reason ?? 'Không được phép luyện flashcard.');
					setPhase('error');
					return;
				}

				const startContext = {
					classId: auth.classId,
					classSessionId: auth.classSessionId,
					courseSessionId: auth.courseSessionId,
					sessionConfig: auth.sessionConfig,
					cards: auth.cards,
				};

				const session = await flashcardReviewRuntimeAdapter.startSession(
					classId,
					classSessionId,
					{ context: startContext },
				);
				setSessionId(session.sessionId);
				setSessionConfig(session.sessionConfig ?? null);
				setItems(
					session.cards.map((card, i) => mapFlashcardCardToVocabularyItem(card, i + 1)),
				);
				setSessionTitle(auth.sessionTitle?.trim() || 'Buổi học');
				setPhase('card');
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Không bắt đầu được phiên flashcard.');
				setPhase('error');
			}
		})();
	}, [classId, classSessionId]);

	useEffect(() => {
		stopAudio();
	}, [index, flipped, autoPlayActive, stopAudio]);

	useEffect(() => {
		setFlipped(false);
		setCanRate(false);
	}, [index]);

	const handlePlayAudio = useCallback(
		(locale: 'uk' | 'us', url?: string) => {
			if (!current || !url || autoPlayActive) {
				return;
			}
			void unlockHtmlAudioSession();
			playAudio(locale, url);
		},
		[autoPlayActive, current, playAudio],
	);

	const handleFlip = useCallback(() => {
		if (autoPlayActive) {
			return;
		}
		primeGameAudio();
		setCanRate(true);
		setFlipped((prev) => {
			playFlashcardFlipSound();
			return !prev;
		});
	}, [autoPlayActive]);

	useEffect(() => {
		if (autoPlayActive || phase !== 'card' || !current || flipped) {
			return;
		}

		const preferred = resolvePreferredVocabularyAudio(current.asset);
		if (!preferred) {
			return;
		}

		const timer = window.setTimeout(() => {
			handlePlayAudio(preferred.locale, preferred.url);
		}, FLASHCARD_FRONT_AUTO_PLAY_DELAY_MS);

		return () => window.clearTimeout(timer);
	}, [autoPlayActive, current, flipped, handlePlayAudio, index, phase]);

	const handleReshuffleRemaining = useCallback(() => {
		if (!canReshuffleRemaining || autoPlayActive) {
			return;
		}
		stopAudio();
		setItems((prev) => {
			const head = prev.slice(0, index);
			const tail = shuffleArray(prev.slice(index));
			return remapCardOrder([...head, ...tail]);
		});
		setFlipped(false);
		setCanRate(false);
	}, [autoPlayActive, canReshuffleRemaining, index, stopAudio]);

	const handleRating = useCallback(
		(selfRating: 'known' | 'unknown') => {
			if (autoPlayActive) {
				return;
			}
			void submitRating(selfRating);
		},
		[autoPlayActive, submitRating],
	);

	const handleStartAutoPlay = useCallback(() => {
		primeGameAudio();
		void unlockHtmlAudioSession();
		stopAudio();
		setFlipped(false);
		setCanRate(false);
		setAutoPlayActive(true);
	}, [stopAudio]);

	const handleStopAutoPlay = useCallback(() => {
		setAutoPlayActive(false);
		stopAudio();
	}, [stopAudio]);

	const cardPlayingLocale =
		autoPlayActive && isPlaying ? 'us' : playingLocale;

	return {
		phase,
		error,
		backHref,
		practiceHref,
		presentation,
		sessionTitle,
		summary,
		current,
		index,
		totalCards: items.length,
		progressPercent,
		flipped,
		canRate,
		autoPlayActive,
		autoPlayRepeatIndex,
		cardPlayingLocale,
		canReshuffleRemaining,
		handleFlip,
		handlePlayAudio,
		handleReshuffleRemaining,
		handleRating,
		handleStartAutoPlay,
		handleStopAutoPlay,
	};
}
