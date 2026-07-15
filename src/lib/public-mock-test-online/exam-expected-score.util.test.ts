import { describe, expect, it } from 'vitest';
import {
	normalizeExamExpectedScore,
	resolveExamExpectedScoreScale,
} from './exam-expected-score.util';

describe('exam-expected-score.util', () => {
	it('detects toeic lr scale', () => {
		const scale = resolveExamExpectedScoreScale({
			formType: 'toeic_lr',
			tagKeys: ['toeic'],
		});
		expect(scale.max).toBe(990);
		expect(normalizeExamExpectedScore(655, scale)).toBe(655);
		expect(normalizeExamExpectedScore(5, scale)).toBeNull();
	});

	it('falls back to wide scale for generic forms', () => {
		const scale = resolveExamExpectedScoreScale({ formType: 'custom_quiz' });
		expect(scale.max).toBe(9999);
		expect(normalizeExamExpectedScore(80, scale)).toBe(80);
	});
});
