/**
 * Điểm kỳ vọng theo lần làm bài (MTO) — không gắn TOEIC-only trên form đăng ký.
 * Scale suy từ type/tag đề khi có; fallback khoảng rộng đa dạng bài test.
 */

export type ExamExpectedScoreScale = {
	min: number;
	max: number;
	step: number;
	hint: string;
};

export function resolveExamExpectedScoreScale(input: {
	formType?: string | null;
	tagKeys?: string[];
}): ExamExpectedScoreScale {
	const type = (input.formType ?? '').toLowerCase();
	const tags = (input.tagKeys ?? []).map((t) => t.toLowerCase());
	const hay = `${type} ${tags.join(' ')}`;

	if (
		hay.includes('toeic') &&
		(hay.includes('lr') || hay.includes('l/r') || hay.includes('listening'))
	) {
		return {
			min: 10,
			max: 990,
			step: 5,
			hint: 'Thang điểm TOEIC Listening & Reading (10–990).',
		};
	}
	if (hay.includes('toeic') && hay.includes('sw')) {
		return {
			min: 0,
			max: 400,
			step: 10,
			hint: 'Thang điểm TOEIC Speaking & Writing (0–400).',
		};
	}
	if (hay.includes('ielts')) {
		return {
			min: 0,
			max: 9,
			step: 0.5,
			hint: 'Thang điểm IELTS (0–9).',
		};
	}
	if (hay.includes('percent') || hay.includes('%') || type === 'practice') {
		return {
			min: 0,
			max: 100,
			step: 1,
			hint: 'Điểm theo phần trăm (0–100).',
		};
	}

	return {
		min: 0,
		max: 9999,
		step: 1,
		hint: 'Nhập điểm bạn muốn đạt trong lần làm bài này (tùy loại đề).',
	};
}

export function normalizeExamExpectedScore(
	raw: unknown,
	scale: ExamExpectedScoreScale,
): number | null {
	if (raw == null || raw === '') return null;
	const n = Number(raw);
	if (!Number.isFinite(n)) return null;
	const rounded =
		scale.step >= 1 ? Math.round(n) : Math.round(n * 2) / 2;
	if (rounded < scale.min || rounded > scale.max) return null;
	return rounded;
}

const SESSION_KEY = 'mto:exam_expected_score:v1';

export function persistMockTestOnlineExpectedScore(input: {
	registrationId: number;
	expectedScore: number;
}): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(
			SESSION_KEY,
			JSON.stringify({
				registrationId: input.registrationId,
				expectedScore: input.expectedScore,
				at: new Date().toISOString(),
			}),
		);
	} catch {
		// ignore
	}
}

export function readMockTestOnlineExpectedScore(
	registrationId?: number | null,
): number | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as {
			registrationId?: number;
			expectedScore?: number;
		};
		if (
			registrationId != null &&
			parsed.registrationId != null &&
			parsed.registrationId !== registrationId
		) {
			return null;
		}
		const n = Number(parsed.expectedScore);
		return Number.isFinite(n) ? n : null;
	} catch {
		return null;
	}
}
