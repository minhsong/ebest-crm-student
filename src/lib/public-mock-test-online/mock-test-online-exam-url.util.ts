/** SSOT URL `/mock-test-online/exam/run` — resume + runtime entry. */

export type MockTestOnlineExamRunParams = {
	registrationId?: number | null;
	formPublicId?: string | null;
};

export function buildMockTestOnlineExamRunPath(
	params: MockTestOnlineExamRunParams = {},
): string {
	const base = '/mock-test-online/exam/run';
	const qs = new URLSearchParams();
	const regId = params.registrationId;
	if (regId != null && Number.isFinite(regId) && regId >= 1) {
		qs.set('registrationId', String(Math.trunc(regId)));
	}
	const form = params.formPublicId?.trim();
	if (form) qs.set('form', form);
	const query = qs.toString();
	return query ? `${base}?${query}` : base;
}
