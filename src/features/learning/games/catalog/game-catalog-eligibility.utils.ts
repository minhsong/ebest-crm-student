import type { GameCatalogEntry } from '@/features/learning/games/catalog/game-catalog.types';
import {
	MIN_SPELLING_ELIGIBLE_ENTRIES,
	MIN_VOCABULARY_DRILL_MEDIA_ENTRIES,
	SPELLING_POOL_ELIGIBILITY_MESSAGE,
} from '@ebest/game-vocabulary-drill';
import type { VocabularyPoolPayload } from '@/types/learning';

const MIN_MEDIA_ENTRIES = MIN_VOCABULARY_DRILL_MEDIA_ENTRIES;

export type GameCatalogEligibility = {
	eligible: boolean;
	reason?: string;
};

export type GameCatalogPoolMeta = Pick<
	VocabularyPoolPayload,
	'practiceEnabled' | 'audioEntryCount' | 'imageEntryCount' | 'spellingEligibleEntryCount'
>;

/** Catalog card — disable + tooltip theo pool meta (spec §4.1). */
export function resolveGameCatalogEligibility(
	entry: GameCatalogEntry,
	pool: GameCatalogPoolMeta | null,
): GameCatalogEligibility {
	if (!entry.shipped) {
		return { eligible: false, reason: 'Sắp ra mắt' };
	}

	if (!pool) {
		return { eligible: false, reason: 'Chọn lớp để bắt đầu' };
	}

	if (!pool.practiceEnabled) {
		return {
			eligible: false,
			reason: `Cần ít nhất ${MIN_MEDIA_ENTRIES} từ đã mở khóa trong lớp`,
		};
	}

	if (entry.promptType === 'audio_to_word') {
		const audioCount = pool.audioEntryCount ?? 0;
		if (audioCount < MIN_MEDIA_ENTRIES) {
			return {
				eligible: false,
				reason: 'Cần ít nhất 4 từ có file phát âm trong pool',
			};
		}
	}

	if (
		entry.promptType === 'image_to_word' ||
		entry.promptType === 'word_to_image'
	) {
		const imageCount = pool.imageEntryCount ?? 0;
		if (imageCount < MIN_MEDIA_ENTRIES) {
			return {
				eligible: false,
				reason: 'Cần ít nhất 4 từ có ảnh minh họa trong pool',
			};
		}
	}

	if (entry.promptType === 'spelling') {
		const spellingCount = pool.spellingEligibleEntryCount;
		if (spellingCount == null || spellingCount < MIN_SPELLING_ELIGIBLE_ENTRIES) {
			return {
				eligible: false,
				reason: SPELLING_POOL_ELIGIBILITY_MESSAGE,
			};
		}
	}

	return { eligible: true };
}
