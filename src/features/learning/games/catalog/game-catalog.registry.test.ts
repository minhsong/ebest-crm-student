import { describe, expect, it } from 'vitest';

import {
	GAME_CATALOG_ENTRIES,
	promptTypeToSlug,
	resolveGameSlugFromPromptType,
	slugToPromptType,
} from '@/features/learning/games/catalog/game-catalog.registry';

describe('game-catalog.registry', () => {
	it('maps slug ↔ promptType for shipped games', () => {
		for (const entry of GAME_CATALOG_ENTRIES) {
			expect(slugToPromptType(entry.slug)).toBe(entry.promptType);
			expect(promptTypeToSlug(entry.promptType)).toBe(entry.slug);
		}
	});

	it('falls back unknown promptType to default slug', () => {
		expect(resolveGameSlugFromPromptType('unknown_prompt')).toBe('meaning-to-word');
	});
});
