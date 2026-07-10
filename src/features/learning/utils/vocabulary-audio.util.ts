import type { VocabularyAudioLocale } from '@/features/learning/hooks/useVocabularyAudio';

export function createVocabularyPlaybackAudio(url: string): HTMLAudioElement {
	const audio = new Audio(url);
	audio.volume = 1;
	audio.preload = 'auto';
	audio.setAttribute('playsinline', '');
	return audio;
}

export type PreferredVocabularyAudio = {
	locale: VocabularyAudioLocale;
	url: string;
};
