import type {
	MockTestOnlineCampaign,
	MockTestTypePresentationPublic,
} from '@/lib/public-mock-test-online/types';
import { mockTestOnlineTypeLabel } from '@/lib/public-mock-test-online/exam-flow.util';

export type MockTestSelectExamTypeRow = {
	testTypeCode: string;
	displayNameVi: string;
	sortOrder: number;
	descriptionHtmlVi: string;
	highlightsVi: string[] | null;
	defaultDurationMinutes: number | null;
	campaigns: MockTestOnlineCampaign[];
	/** Meta tổng hợp từ campaigns (SX-07). */
	questionCountMin: number | null;
	questionCountMax: number | null;
	/** Mini khi có campaign `user_choice` (SX-07). */
	questionCountMiniMin: number | null;
	questionCountMiniMax: number | null;
	durationMinutes: number | null;
};

function aggregateQuestionCount(
	campaigns: MockTestOnlineCampaign[],
	field: 'questionCount' | 'questionCountMini',
): {
	min: number | null;
	max: number | null;
} {
	const nums = campaigns
		.map((c) => c[field])
		.filter((n): n is number => typeof n === 'number' && n > 0);
	if (!nums.length) return { min: null, max: null };
	return { min: Math.min(...nums), max: Math.max(...nums) };
}

function pickDuration(
	campaigns: MockTestOnlineCampaign[],
	fallback: number | null,
): number | null {
	for (const c of campaigns) {
		const d = c.estimatedDurationMinutes ?? c.examDurationMinutes;
		if (typeof d === 'number' && d > 0) return d;
	}
	return fallback;
}

/**
 * Build master list theo type — presentation settings + campaigns đang mở.
 *
 * Policy `isListedOnSelectExam`:
 * - Có presentation trong payload và `isListedOnSelectExam === false` → ẩn.
 * - Payload `typePresentations` có phần tử nhưng type không nằm trong map
 *   (API đã filter unlisted) → ẩn.
 * - Payload trống / undefined (GW cũ) → hiện tất cả campaign với fallback label.
 */
export function buildSelectExamTypeRows(
	campaigns: MockTestOnlineCampaign[],
	presentations?: MockTestTypePresentationPublic[] | null,
): MockTestSelectExamTypeRow[] {
	const byType = new Map<string, MockTestOnlineCampaign[]>();
	for (const c of campaigns) {
		const key = c.testTypeCode?.trim() || 'other';
		const list = byType.get(key) ?? [];
		list.push(c);
		byType.set(key, list);
	}

	const presentationByCode = new Map(
		(presentations ?? []).map((p) => [p.testTypeCode, p] as const),
	);
	const hasListedPayload = (presentations?.length ?? 0) > 0;

	const rows: MockTestSelectExamTypeRow[] = [];
	for (const [testTypeCode, items] of byType) {
		const pres = presentationByCode.get(testTypeCode) ?? null;
		if (pres && !pres.isListedOnSelectExam) continue;
		if (hasListedPayload && !pres) continue;

		const qc = aggregateQuestionCount(items, 'questionCount');
		const qcMini = aggregateQuestionCount(items, 'questionCountMini');
		rows.push({
			testTypeCode,
			displayNameVi:
				pres?.displayNameVi?.trim() ||
				mockTestOnlineTypeLabel(testTypeCode),
			sortOrder: pres?.sortOrder ?? 100,
			descriptionHtmlVi: pres?.descriptionHtmlVi ?? '',
			highlightsVi: pres?.highlightsVi ?? null,
			defaultDurationMinutes: pres?.defaultDurationMinutes ?? null,
			campaigns: items,
			questionCountMin: qc.min,
			questionCountMax: qc.max,
			questionCountMiniMin: qcMini.min,
			questionCountMiniMax: qcMini.max,
			durationMinutes: pickDuration(
				items,
				pres?.defaultDurationMinutes ?? null,
			),
		});
	}

	return rows.sort(
		(a, b) =>
			a.sortOrder - b.sortOrder ||
			a.displayNameVi.localeCompare(b.displayNameVi, 'vi'),
	);
}

export function formatQuestionCountMeta(
	min: number | null,
	max: number | null,
	opts?: { miniMin?: number | null; miniMax?: number | null },
): string | null {
	if (min == null) return null;
	const full =
		max == null || max === min ? `${min} câu` : `${min}–${max} câu`;
	const miniMin = opts?.miniMin ?? null;
	const miniMax = opts?.miniMax ?? null;
	if (miniMin == null) return full;
	const mini =
		miniMax == null || miniMax === miniMin
			? `${miniMin} câu (mini)`
			: `${miniMin}–${miniMax} câu (mini)`;
	return `${full} · ${mini}`;
}

export function formatDurationMinutes(
	minutes: number | null | undefined,
): string | null {
	if (!minutes || minutes < 1) return null;
	return `~${minutes} phút`;
}
