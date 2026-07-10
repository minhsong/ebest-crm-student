import { describe, expect, it } from 'vitest';

import { inferVocabularyDrillSessionConfigFromAssignment } from './vocabulary-drill-session-config.utils';

describe('inferVocabularyDrillSessionConfigFromAssignment', () => {
	it('builds survival config', () => {
		const cfg = inferVocabularyDrillSessionConfigFromAssignment({
			modeId: 'survival',
			promptType: 'meaning_to_word',
		});
		expect(cfg.scoring.strategyId).toBe('streak_correct');
		expect(cfg.completion.sessionPolicyId).toBe('end_on_wrong');
		expect(cfg.presentation.modeLayoutProfileId).toBe('survival_streak');
	});

	it('builds speed_run config with session duration', () => {
		const cfg = inferVocabularyDrillSessionConfigFromAssignment({
			modeId: 'speed_run',
			promptType: 'audio_to_word',
		});
		expect(cfg.rules.sessionDurationSec).toBe(90);
		expect(cfg.presentation.detailWidgetId).toBe('audio_mcq');
	});
});
