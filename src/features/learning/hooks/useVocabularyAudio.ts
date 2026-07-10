'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createVocabularyPlaybackAudio } from '@/features/learning/utils/vocabulary-audio.util';

export type VocabularyAudioLocale = 'uk' | 'us';
export type VocabularyPlayingLocale = VocabularyAudioLocale | null;

type Options = {
	/** Khi false — dừng audio đang phát (vd. đóng modal, bật Auto Play). */
	active?: boolean;
};

export function useVocabularyAudio({ active = true }: Options = {}) {
	const [playingLocale, setPlayingLocale] = useState<VocabularyPlayingLocale>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const finishPlayRef = useRef<(() => void) | null>(null);

	const stopAudio = useCallback(() => {
		if (finishPlayRef.current) {
			const finish = finishPlayRef.current;
			finishPlayRef.current = null;
			finish();
		}
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.onended = null;
			audioRef.current.onerror = null;
			audioRef.current = null;
		}
		setPlayingLocale(null);
		setIsPlaying(false);
	}, []);

	const playAudio = useCallback(
		(locale: VocabularyAudioLocale, url?: string) => {
			if (!url) {
				return;
			}

			stopAudio();
			const audio = createVocabularyPlaybackAudio(url);
			audioRef.current = audio;
			setPlayingLocale(locale);
			setIsPlaying(true);

			const finish = () => {
				setPlayingLocale(null);
				setIsPlaying(false);
				audioRef.current = null;
			};

			audio.onended = finish;
			audio.onerror = finish;
			void audio.play().catch(finish);
		},
		[stopAudio],
	);

	const playAndWait = useCallback(
		async (url: string, locale: VocabularyAudioLocale = 'us'): Promise<void> => {
			if (!url) {
				return;
			}

			stopAudio();
			const audio = createVocabularyPlaybackAudio(url);
			audioRef.current = audio;
			setPlayingLocale(locale);
			setIsPlaying(true);

			await new Promise<void>((resolve) => {
				const finish = () => {
					if (finishPlayRef.current === finish) {
						finishPlayRef.current = null;
					}
					setPlayingLocale(null);
					setIsPlaying(false);
					if (audioRef.current === audio) {
						audioRef.current = null;
					}
					resolve();
				};

				finishPlayRef.current = finish;
				audio.onended = finish;
				audio.onerror = finish;
				void audio.play().catch(finish);
			});
		},
		[stopAudio],
	);

	useEffect(() => {
		if (!active) {
			stopAudio();
		}
	}, [active, stopAudio]);

	useEffect(() => {
		return () => {
			stopAudio();
		};
	}, [stopAudio]);

	return { playingLocale, isPlaying, playAudio, playAndWait, stopAudio };
}
