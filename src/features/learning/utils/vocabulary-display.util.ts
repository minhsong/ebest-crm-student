import type { LearningVocabularyItem } from '@/types/learning';

type VocabularyAsset = LearningVocabularyItem['asset'];

export function getPrimaryMeaning(asset: VocabularyAsset): string {
	return asset.translation || asset.meanings?.[0] || '—';
}

export function getPreviewTranslation(
	asset: VocabularyAsset,
	fallback = 'Chạm để xem chi tiết',
): string {
	return asset.translation || asset.meanings?.[0] || fallback;
}

export function getExtraMeanings(asset: VocabularyAsset): string[] {
	const primary = getPrimaryMeaning(asset);
	return asset.meanings?.filter((meaning) => meaning && meaning !== primary) ?? [];
}

export function hasVocabularyPronunciation(asset: VocabularyAsset): boolean {
	return Boolean(
		asset.ipaUk ||
			asset.ipaUs ||
			asset.audioUkUrl ||
			asset.audioUsUrl,
	);
}

/** API trả `accuracyRate` dạng phần trăm 0–100 (không phải ratio 0–1). */
export function formatAccuracyPercent(value: number | null): string {
	if (value == null || Number.isNaN(value)) {
		return '—';
	}
	return `${Math.round(value)}%`;
}
