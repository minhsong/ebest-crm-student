import { describe, expect, it } from 'vitest';

import { GAME_CATALOG_ENTRIES } from '@/features/learning/games/catalog/game-catalog.registry';
import { resolveGameCatalogEligibility } from '@/features/learning/games/catalog/game-catalog-eligibility.utils';

describe('game-catalog-eligibility.utils', () => {
	const meaning = GAME_CATALOG_ENTRIES.find((e) => e.slug === 'meaning-to-word')!;
	const audio = GAME_CATALOG_ENTRIES.find((e) => e.slug === 'audio-to-word')!;
	const image = GAME_CATALOG_ENTRIES.find((e) => e.slug === 'image-to-word')!;

	const poolOk = {
		practiceEnabled: true,
		audioEntryCount: 4,
		imageEntryCount: 4,
	};

	it('blocks when no class pool', () => {
		expect(resolveGameCatalogEligibility(meaning, null).eligible).toBe(false);
	});

	it('allows meaning when practice enabled', () => {
		expect(resolveGameCatalogEligibility(meaning, poolOk).eligible).toBe(true);
	});

	it('blocks audio when fewer than 4 audio entries', () => {
		const result = resolveGameCatalogEligibility(audio, {
			...poolOk,
			audioEntryCount: 3,
		});
		expect(result.eligible).toBe(false);
		expect(result.reason).toMatch(/phát âm/);
	});

	it('blocks image when fewer than 4 image entries', () => {
		const result = resolveGameCatalogEligibility(image, {
			...poolOk,
			imageEntryCount: 2,
		});
		expect(result.eligible).toBe(false);
		expect(result.reason).toMatch(/ảnh/);
	});

	it('blocks spelling when fewer than 4 spelling-eligible entries (AC-SP-01)', () => {
		const spelling = GAME_CATALOG_ENTRIES.find((e) => e.slug === 'spelling')!;
		expect(spelling.shipped).toBe(true);
		const blocked = resolveGameCatalogEligibility(spelling, {
			...poolOk,
			spellingEligibleEntryCount: 3,
			imageEntryCount: 10,
		});
		expect(blocked.eligible).toBe(false);
		const allowed = resolveGameCatalogEligibility(spelling, {
			...poolOk,
			spellingEligibleEntryCount: 4,
		});
		expect(allowed.eligible).toBe(true);
	});

	it('blocks spelling when spellingEligibleEntryCount is missing', () => {
		const spelling = GAME_CATALOG_ENTRIES.find((e) => e.slug === 'spelling')!;
		const result = resolveGameCatalogEligibility(spelling, {
			...poolOk,
			imageEntryCount: 10,
		});
		expect(result.eligible).toBe(false);
	});
});
