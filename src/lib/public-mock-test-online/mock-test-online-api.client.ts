import type {
	MockTestOnlineAuthorizeResponse,
	MockTestOnlinePollStatus,
	MockTestOnlineSelectExamResponse,
	MockTestOnlineVerifyUnlockResponse,
} from '@/lib/public-mock-test-online/types';
import {
	MockTestOnlineApiError,
	extractMockTestOnlineApiError,
} from '@/lib/public-mock-test-online/mock-test-online-api-error';

async function parseJson<T>(res: Response): Promise<T & { message?: string; errorCode?: string }> {
	return (await res.json()) as T & { message?: string; errorCode?: string };
}

function throwApiError(res: Response, data: unknown): never {
	const { message, errorCode, action } = extractMockTestOnlineApiError(data);
	if (res.status === 429) {
		throw new MockTestOnlineApiError(
			message,
			errorCode ?? 'RATE_LIMITED',
			action ?? 'retry',
		);
	}
	throw new MockTestOnlineApiError(message, errorCode, action);
}

export async function fetchMockTestOnlinePendingStatus(
	pendingRegistrationId: string,
): Promise<MockTestOnlinePollStatus> {
	const res = await fetch(
		`/api/public/mock-test-online/pending/${encodeURIComponent(pendingRegistrationId)}/status`,
		{ cache: 'no-store' },
	);
	const data = await parseJson<MockTestOnlinePollStatus>(res);
	if (!res.ok) {
		throwApiError(res, data);
	}
	return data;
}

/** Khôi phục select-exam response khi refresh confirm-exam (không cần lead Redis). */
export async function fetchMockTestOnlineConfirmSession(
	pendingRegistrationId: string,
): Promise<MockTestOnlineSelectExamResponse> {
	const res = await fetch(
		`/api/public/mock-test-online/pending/${encodeURIComponent(pendingRegistrationId)}/confirm-session`,
		{ cache: 'no-store' },
	);
	const data = await parseJson<MockTestOnlineSelectExamResponse>(res);
	if (!res.ok) {
		throwApiError(res, data);
	}
	return data;
}

export async function postMockTestOnlineSelectExam(body: {
	pendingLeadId: string;
	sessionId: number;
	testVariantChoice?: 'full' | 'mini';
}): Promise<MockTestOnlineSelectExamResponse> {
	const res = await fetch('/api/public/mock-test-online/select-exam', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = await parseJson<MockTestOnlineSelectExamResponse>(res);
	if (!res.ok) {
		throw new Error(data.message ?? 'Không khởi tạo được phiên bài thi.');
	}
	return data;
}

export async function postMockTestOnlineAuthorize(
	body: Record<string, unknown>,
): Promise<MockTestOnlineAuthorizeResponse> {
	const res = await fetch('/api/public/mock-test-online/authorize', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(body),
	});
	const data = await parseJson<MockTestOnlineAuthorizeResponse>(res);
	if (!res.ok || !data.allowed) {
		throwApiError(res, data);
	}
	return data;
}

export async function postMockTestOnlineVerifyUnlockCode(
	body: Record<string, unknown>,
): Promise<MockTestOnlineVerifyUnlockResponse> {
	const res = await fetch('/api/public/mock-test-online/verify-unlock-code', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = await parseJson<MockTestOnlineVerifyUnlockResponse>(res);
	if (!res.ok) {
		throwApiError(res, data);
	}
	return data;
}

export async function postMockTestOnlineDevSimulateZalo(pendingRegistrationId: string): Promise<{
	examUnlockCode: string;
	registrationId: number | null;
}> {
	const res = await fetch('/api/public/mock-test-online/dev/simulate-zalo-verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pendingRegistrationId }),
	});
	const data = await parseJson<{
		examUnlockCode?: string;
		registrationId?: number | null;
	}>(res);
	if (!res.ok || !data.examUnlockCode) {
		throw new Error(data.message ?? 'Không lấy được mã dev.');
	}
	return {
		examUnlockCode: data.examUnlockCode,
		registrationId: data.registrationId ?? null,
	};
}

/** PI-D13 — phiên lead ngay sau Zalo verify (idempotent). Bắt buộc pending UUID. */
export async function provisionLeadPortalSession(input: {
	pendingRegistrationId: string;
	registrationId?: number;
}): Promise<{ provisioned: boolean; sessionReady: boolean }> {
	const pendingRegistrationId = input.pendingRegistrationId.trim();
	if (!pendingRegistrationId) {
		throw new MockTestOnlineApiError('Thiếu phiên xác minh.');
	}
	const res = await fetch('/api/public/mock-test-online/provision-lead-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			pendingRegistrationId,
			...(input.registrationId != null && input.registrationId >= 1
				? { registrationId: input.registrationId }
				: {}),
		}),
	});
	const data = await parseJson<{
		provisioned?: boolean;
		sessionReady?: boolean;
		message?: string;
	}>(res);
	if (!res.ok) {
		throw new MockTestOnlineApiError(
			data.message ?? 'Không tạo được phiên đăng nhập.',
		);
	}
	return {
		provisioned: Boolean(data.provisioned),
		sessionReady: data.sessionReady === true,
	};
}

export type MockTestPostExamDestination = {
	actor: 'guest' | 'lead' | 'customer';
	nextPath: string;
};

/** Đích sau thi do BFF quyết định từ portal session đã verify. */
export async function fetchMockTestPostExamDestination(): Promise<MockTestPostExamDestination> {
	const res = await fetch(
		'/api/public/mock-test-online/post-exam-destination',
		{ cache: 'no-store', credentials: 'same-origin' },
	);
	const data = await parseJson<Partial<MockTestPostExamDestination>>(res);
	if (!res.ok) {
		throwApiError(res, data);
	}
	if (
		(data.actor !== 'guest' &&
			data.actor !== 'lead' &&
			data.actor !== 'customer') ||
		typeof data.nextPath !== 'string' ||
		!data.nextPath.startsWith('/') ||
		data.nextPath.startsWith('//')
	) {
		throw new MockTestOnlineApiError(
			'Không xác định được bước tiếp theo. Vui lòng tải lại trang.',
		);
	}
	return {
		actor: data.actor,
		nextPath: data.nextPath,
	};
}
