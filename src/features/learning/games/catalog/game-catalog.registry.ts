import type { GameCatalogEntry, GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';

export const DEFAULT_GAME_SLUG = 'meaning-to-word';

export const GAME_CATALOG_ENTRIES: GameCatalogEntry[] = [
	{
		slug: 'meaning-to-word',
		promptType: 'meaning_to_word',
		title: 'Nghĩa → chọn từ',
		description: 'Đọc nghĩa tiếng Việt, chọn đúng từ tiếng Anh.',
		shipped: true,
	},
	{
		slug: 'audio-to-word',
		promptType: 'audio_to_word',
		title: 'Nghe → chọn từ',
		description: 'Nghe phát âm, chọn đúng từ tiếng Anh.',
		shipped: true,
	},
	{
		slug: 'image-to-word',
		promptType: 'image_to_word',
		title: 'Ảnh → chọn từ',
		description: 'Nhìn hình minh họa, chọn đúng từ tiếng Anh.',
		shipped: true,
	},
	{
		slug: 'word-to-image',
		promptType: 'word_to_image',
		title: 'Từ → chọn ảnh',
		description: 'Đọc từ tiếng Anh, chọn đúng hình minh họa.',
		shipped: true,
	},
	{
		slug: 'spelling',
		promptType: 'spelling',
		title: 'Spelling',
		description: 'Nhìn ảnh, đọc nghĩa tiếng Việt, sắp chữ cái thành từ tiếng Anh.',
		shipped: true,
	},
];

const SLUG_TO_ENTRY = new Map(GAME_CATALOG_ENTRIES.map((e) => [e.slug, e]));
const PROMPT_TO_SLUG = new Map(GAME_CATALOG_ENTRIES.map((e) => [e.promptType, e.slug]));

export function getGameCatalogEntry(slug: string): GameCatalogEntry | null {
	return SLUG_TO_ENTRY.get(slug) ?? null;
}

export function isValidGameSlug(slug: string): boolean {
	return SLUG_TO_ENTRY.has(slug);
}

export function slugToPromptType(slug: string): GamePromptType | null {
	return SLUG_TO_ENTRY.get(slug)?.promptType ?? null;
}

export function promptTypeToSlug(promptType: string): string | null {
	return PROMPT_TO_SLUG.get(promptType as GamePromptType) ?? null;
}

export function resolveGameSlugFromPromptType(promptType: string): string {
	return promptTypeToSlug(promptType) ?? DEFAULT_GAME_SLUG;
}
