'use client';

import { useEffect, useRef, useState } from 'react';

import {
	FLASHCARD_AUTO_PLAY_ADVANCE_GAP_MS,
	FLASHCARD_AUTO_PLAY_GAP_MS,
	FLASHCARD_AUTO_PLAY_REPEATS,
} from '@/features/learning/games/flashcard-review/flashcard-auto-play.config';
import { sleep } from '@/features/learning/games/flashcard-review/flashcard-auto-play.util';

type Options = {
	active: boolean;
	cardAssetId: number | undefined;
	audioUrl: string | undefined;
	playOnce: (url: string, locale: 'us') => Promise<void>;
	stopPlayback: () => void;
	onAdvanceKnown: () => void | Promise<void>;
};

/**
 * Chuỗi Auto Play tuần tự: phát US ×N, nghỉ giữa các lần, nghỉ trước khi chuyển thẻ.
 */
export function useFlashcardAutoPlaySequence({
	active,
	cardAssetId,
	audioUrl,
	playOnce,
	stopPlayback,
	onAdvanceKnown,
}: Options) {
	const [repeatIndex, setRepeatIndex] = useState(0);
	const runRef = useRef(0);
	const onAdvanceRef = useRef(onAdvanceKnown);
	const playOnceRef = useRef(playOnce);
	const stopRef = useRef(stopPlayback);

	onAdvanceRef.current = onAdvanceKnown;
	playOnceRef.current = playOnce;
	stopRef.current = stopPlayback;

	useEffect(() => {
		if (!active || cardAssetId == null) {
			setRepeatIndex(0);
			return;
		}

		const runId = ++runRef.current;
		setRepeatIndex(0);

		void (async () => {
			for (let i = 0; i < FLASHCARD_AUTO_PLAY_REPEATS; i++) {
				if (runId !== runRef.current) {
					return;
				}

				setRepeatIndex(i + 1);

				if (audioUrl) {
					await playOnceRef.current(audioUrl, 'us');
				}

				if (runId !== runRef.current) {
					return;
				}

				if (i < FLASHCARD_AUTO_PLAY_REPEATS - 1) {
					await sleep(FLASHCARD_AUTO_PLAY_GAP_MS);
				}
			}

			if (runId !== runRef.current) {
				return;
			}

			await sleep(FLASHCARD_AUTO_PLAY_ADVANCE_GAP_MS);

			if (runId !== runRef.current) {
				return;
			}

			setRepeatIndex(0);
			await onAdvanceRef.current();
		})();

		return () => {
			runRef.current += 1;
			stopRef.current();
		};
	}, [active, audioUrl, cardAssetId]);

	return { repeatIndex };
}
