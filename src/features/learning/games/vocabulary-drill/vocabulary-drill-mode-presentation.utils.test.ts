import { describe, expect, it } from 'vitest';

import { resolveVocabularyDrillModePresentationFields } from './vocabulary-drill-mode-presentation.utils';

describe('resolveVocabularyDrillModePresentationFields', () => {
	it('maps survival meaning_to_word', () => {
		expect(
			resolveVocabularyDrillModePresentationFields('survival', 'meaning_to_word'),
		).toMatchObject({
			modeLayoutProfileId: 'survival_streak',
			resultProfileId: 'survival_result',
			usesStreakHud: true,
			usesPoolProgressBar: false,
			modeLabel: 'Survival',
		});
	});

	it('maps survival audio_to_word label Nghe', () => {
		expect(
			resolveVocabularyDrillModePresentationFields('survival', 'audio_to_word').modeLabel,
		).toBe('Nghe');
	});

	it('maps pool_coverage', () => {
		expect(
			resolveVocabularyDrillModePresentationFields('pool_coverage', 'meaning_to_word'),
		).toMatchObject({
			modeLayoutProfileId: 'pool_coverage_progress',
			resultProfileId: 'pool_coverage_result',
			lobbyProfileId: 'assignment_pool_coverage',
			usesPoolProgressBar: true,
		});
	});

	it('maps speed_run', () => {
		expect(
			resolveVocabularyDrillModePresentationFields('speed_run', 'meaning_to_word'),
		).toMatchObject({
			modeLayoutProfileId: 'speed_run_timer',
			resultProfileId: 'speed_run_result',
			modeLabel: 'Speed run',
		});
	});
});
