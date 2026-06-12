'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type VocabularyAudioLocale = 'uk' | 'us';
export type VocabularyPlayingLocale = VocabularyAudioLocale | null;

type Options = {
	/** Khi false — dừng audio đang phát (vd. đóng modal). */
	active?: boolean;
};

export function useVocabularyAudio({ active = true }: Options = {}) {
	const [playingLocale, setPlayingLocale] = useState<VocabularyPlayingLocale>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const stopAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.onended = null;
			audioRef.current.onerror = null;
			audioRef.current = null;
		}
		setPlayingLocale(null);
	}, []);

	const playAudio = useCallback(
		(locale: VocabularyAudioLocale, url?: string) => {
			if (!url) {
				return;
			}

			stopAudio();
			const audio = new Audio(url);
			audioRef.current = audio;
			setPlayingLocale(locale);
			audio.onended = () => {
				setPlayingLocale(null);
				audioRef.current = null;
			};
			audio.onerror = () => {
				setPlayingLocale(null);
				audioRef.current = null;
			};
			void audio.play().catch(() => {
				setPlayingLocale(null);
				audioRef.current = null;
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

	return { playingLocale, playAudio, stopAudio };
}
