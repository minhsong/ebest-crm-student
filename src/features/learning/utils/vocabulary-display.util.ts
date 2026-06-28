import type { LearningVocabularyItem } from '@/types/learning';

type VocabularyAsset = LearningVocabularyItem['asset'];

export function resolveVocabularyTranslation(
	asset: Partial<
		Pick<
			VocabularyAsset,
			'translations' | 'translation' | 'translationPreview' | 'meaningEn' | 'meanings'
		>
	>,
	locale = 'vi',
): string {
	const preview = asset.translationPreview?.trim();
	if (preview) return preview;

	const key = locale.split('-')[0].toLowerCase();
	const fromMap = asset.translations?.[key]?.trim();
	if (fromMap) return fromMap;
	if (key !== 'vi') {
		const vi = asset.translations?.vi?.trim();
		if (vi) return vi;
	}
	const legacy = asset.translation?.trim();
	if (legacy) return legacy;
	if (asset.meaningEn?.trim()) return asset.meaningEn.trim();
	return asset.meanings?.[0]?.trim() ?? '—';
}

export function getVariantDisplayLabel(asset: VocabularyAsset): string {
	if (asset.displayLabel?.trim()) return asset.displayLabel.trim();
	const word = asset.word?.trim() || '—';
	const pos = asset.partOfSpeech?.trim();
	if (!pos) return word;
	return `${word} (${pos})`;
}

/** Headword thuần — dùng game/flashcard thay vì displayLabel. */
export function getVocabularyHeadword(asset: VocabularyAsset): string {
	return asset.word?.trim() || '—';
}

export function getPrimaryMeaning(asset: VocabularyAsset): string {
	return resolveVocabularyTranslation(asset);
}

export function getPreviewTranslation(
	asset: VocabularyAsset,
	fallback = 'Chạm để xem chi tiết',
): string {
	const resolved = resolveVocabularyTranslation(asset);
	return resolved === '—' ? fallback : resolved;
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

export function filterSessionVocabularyItems(
	items: LearningVocabularyItem[],
	query: string,
): LearningVocabularyItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;

	return items.filter(({ asset }) => {
		const haystack = [
			asset.word,
			asset.displayLabel,
			asset.partOfSpeech,
			asset.translation,
			asset.translationPreview,
			asset.translations?.vi,
			asset.meaningEn,
			...(asset.meanings ?? []),
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

export function sortSessionVocabularyItems(
	items: LearningVocabularyItem[],
): LearningVocabularyItem[] {
	return [...items].sort((a, b) => {
		const wordCmp = (a.asset.word ?? '').localeCompare(b.asset.word ?? '', 'vi');
		if (wordCmp !== 0) return wordCmp;
		if (a.asset.isPrimary && !b.asset.isPrimary) return -1;
		if (!a.asset.isPrimary && b.asset.isPrimary) return 1;
		return (a.asset.partOfSpeech ?? '').localeCompare(b.asset.partOfSpeech ?? '');
	});
}
