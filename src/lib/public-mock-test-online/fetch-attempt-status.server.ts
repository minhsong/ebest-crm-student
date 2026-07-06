import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

export function buildMockTestOnlineAttemptStatusUrl(
	apiBase: string,
	omniLeadId: string,
	testTypeCode: string,
	options?: { sessionId?: number; phoneNormalized?: string },
): string {
	const qs = new URLSearchParams({
		omniLeadId: omniLeadId.trim(),
		testTypeCode: testTypeCode.trim(),
	});
	if (options?.sessionId != null && Number.isFinite(options.sessionId)) {
		qs.set('sessionId', String(options.sessionId));
	}
	if (options?.phoneNormalized?.trim()) {
		qs.set('phoneNormalized', options.phoneNormalized.trim());
	}
	return `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/attempt-status?${qs}`;
}

function parseAttemptStatusPayload(data: unknown): MockTestOnlineAttemptStatus | null {
	const payload = unwrapCrmResponseBody(data) ?? data;
	if (!payload || typeof payload !== 'object') return null;
	return payload as MockTestOnlineAttemptStatus;
}

/** SSR — gọi CRM public attempt-status (server-side, có cache 60s). */
export async function fetchMockTestOnlineAttemptStatus(
	omniLeadId: string,
	testTypeCode: string,
	options?: { sessionId?: number; phoneNormalized?: string },
): Promise<MockTestOnlineAttemptStatus | null> {
	const leadId = omniLeadId.trim();
	const typeCode = testTypeCode.trim();
	if (!leadId || !typeCode) return null;

	const apiBase = getApiBaseUrl();
	if (!apiBase) return null;

	const url = buildMockTestOnlineAttemptStatusUrl(
		apiBase,
		leadId,
		typeCode,
		options,
	);
	const res = await fetch(url, {
		headers: { Accept: 'application/json' },
		next: { revalidate: 60 },
	});
	if (!res.ok) return null;

	const data = await res.json().catch(() => ({}));
	return parseAttemptStatusPayload(data);
}

/** BFF / route handler — không cache. */
export async function fetchMockTestOnlineAttemptStatusNoStore(
	omniLeadId: string,
	testTypeCode: string,
	options?: { sessionId?: number; phoneNormalized?: string },
): Promise<{ status: MockTestOnlineAttemptStatus | null; httpStatus: number }> {
	const leadId = omniLeadId.trim();
	const typeCode = testTypeCode.trim();
	if (!leadId || !typeCode) {
		return { status: null, httpStatus: 400 };
	}

	const apiBase = getApiBaseUrl();
	if (!apiBase) {
		return { status: null, httpStatus: 500 };
	}

	const url = buildMockTestOnlineAttemptStatusUrl(
		apiBase,
		leadId,
		typeCode,
		options,
	);
	const res = await fetch(url, {
		headers: { Accept: 'application/json' },
		cache: 'no-store',
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		return { status: null, httpStatus: res.status };
	}

	return {
		status: parseAttemptStatusPayload(data),
		httpStatus: res.status,
	};
}
