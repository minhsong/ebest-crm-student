import { applyMockTestOnlineAuthorizeResponse } from '@/lib/public-mock-test-online/mock-test-online-authorize-persist.client';
import type { MockTestOnlineAuthorizeResponse } from '@/lib/public-mock-test-online/types';

import { mtoClientDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import {
	rememberMockTestOnlineAuthRefresh,
	runMockTestOnlineAuthRefreshDeduped,
} from '@/lib/public-mock-test-online/exam-auth-refresh-dedupe';

import { readAnyActiveExamSessionToken } from '@/lib/public-mock-test-online/select-exam-cache';
import {
	isMockTestOnlineExamSessionReady,
	loadMockTestOnlineExamAuth,
	type MockTestOnlineExamAuth,
} from '@/lib/public-mock-test-online/exam-session';



function resolveExamSessionToken(
	prev: MockTestOnlineExamAuth | null,
): string | undefined {
	// Chỉ dùng token còn hạn trong sessionStorage — không lấy từ auth cũ (T2 có thể hết).
	void prev;
	return readAnyActiveExamSessionToken() || undefined;
}

async function fetchAuthorizeResume(
	registrationId: number,
	examSessionToken?: string,
): Promise<{ ok: boolean; status: number; data: MockTestOnlineAuthorizeResponse & { message?: string } }> {
	const payload: Record<string, unknown> = { registrationId };
	if (examSessionToken) {
		payload.examSessionToken = examSessionToken;
	}
	const res = await fetch('/api/public/mock-test-online/authorize-resume', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		credentials: 'include',
		body: JSON.stringify(payload),
	});
	const data = (await res.json().catch(() => ({}))) as MockTestOnlineAuthorizeResponse & {
		message?: string;
	};
	return { ok: res.ok, status: res.status, data };
}



export async function refreshMockTestOnlineExamAuth(

	registrationId: number,

): Promise<MockTestOnlineExamAuth | null> {

	return runMockTestOnlineAuthRefreshDeduped(registrationId, async () => {

	const prev = loadMockTestOnlineExamAuth({ allowExpiredToken: true });

	const examSessionToken = resolveExamSessionToken(prev);

	let attempt = await fetchAuthorizeResume(registrationId, examSessionToken);

	// Token T2 hết hạn — thử lại qua lead cookie (BFF inject omniLeadId).
	if ((!attempt.ok || !attempt.data.allowed) && examSessionToken) {
		attempt = await fetchAuthorizeResume(registrationId);
	}

	const { ok, status, data } = attempt;

	if (!ok || !data.allowed) {

		mtoClientDebug('auth.refresh.failed', {
			registrationId,
			status,
			message: data.message ?? null,
		});
		return null;

	}

	const prevForm = prev?.formPublicId?.trim();

	const nextForm = data.formPublicId?.trim() ?? '';

	const auth = applyMockTestOnlineAuthorizeResponse(prev, data, {
		examSessionToken,
	});

	mtoClientDebug('auth.refresh', {
		registrationId: auth.registrationId,
		sessionId: auth.sessionId,
		prevFormPublicId: prevForm ?? null,
		nextFormPublicId: nextForm,
		formChanged: Boolean(prevForm && nextForm && prevForm !== nextForm),
	});

	rememberMockTestOnlineAuthRefresh(auth);

	return auth;

	});

}



export async function ensureMockTestOnlineExamAuth(
	preferredRegistrationId?: number,
): Promise<MockTestOnlineExamAuth | null> {
	const valid = loadMockTestOnlineExamAuth();
	if (
		valid &&
		isMockTestOnlineExamSessionReady(valid) &&
		(preferredRegistrationId == null ||
			preferredRegistrationId === valid.registrationId)
	) {
		// Token T3 còn hạn — không bắt buộc refresh (guest sau T2 vẫn vào lại phòng thi).
		return valid;
	}

	const hint =
		valid ?? loadMockTestOnlineExamAuth({ allowExpiredToken: true });
	const registrationId = preferredRegistrationId ?? hint?.registrationId;
	if (!registrationId) return null;
	return refreshMockTestOnlineExamAuth(registrationId);
}

