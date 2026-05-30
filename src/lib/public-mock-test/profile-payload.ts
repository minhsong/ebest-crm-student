import type { PublicMockTestFormValues } from '@/lib/public-mock-test/types';

function normalizeTagSelection(
	value: number | number[] | undefined,
): number[] {
	if (value == null) return [];
	if (Array.isArray(value)) {
		return value.map((x) => Number(x)).filter((x) => Number.isFinite(x));
	}
	const n = Number(value);
	return Number.isFinite(n) ? [n] : [];
}

/** Gom tag theo nhóm form → payload CRM public registration. */
export function collectPublicProfilePayload(values: PublicMockTestFormValues) {
	const tagsByCategory = values.tagsByCategory ?? {};
	const tagIds: number[] = [];
	let universityTagId: number | undefined;

	for (const [category, raw] of Object.entries(tagsByCategory)) {
		const ids = normalizeTagSelection(raw);
		if (category === 'education_institution' && ids[0]) {
			universityTagId = ids[0];
		}
		tagIds.push(...ids);
	}

	return {
		tagIds: [...new Set(tagIds)],
		universityTagId,
		universityOther: values.universityOther?.trim() || undefined,
		consultationNote: values.consultationNote?.trim() || undefined,
		expectedScore:
			values.expectedScore != null && Number.isFinite(Number(values.expectedScore))
				? Math.round(Number(values.expectedScore))
				: undefined,
	};
}
