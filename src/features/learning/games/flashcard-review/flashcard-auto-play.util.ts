import type { LearningVocabularyItem } from '@/types/learning';

/** Auto Play chỉ phát US. */
export function resolveFlashcardAutoPlayAudioUrl(
	item: Pick<LearningVocabularyItem, 'asset'> | undefined,
): string | undefined {
	const url = item?.asset.audioUsUrl?.trim();
	return url || undefined;
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}
