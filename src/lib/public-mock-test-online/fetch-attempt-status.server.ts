import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import {
	buildPublicMockTestCrmUrl,
	buildPublicMockTestCrmHeaders,
	fetchPublicMockTestCrmJson,
} from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';

export function buildMockTestOnlineAttemptStatusPath(
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
	return `attempt-status?${qs}`;
}

/** @deprecated Prefer buildMockTestOnlineAttemptStatusPath + proxy. */
export function buildMockTestOnlineAttemptStatusUrl(
	apiBase: string,
	omniLeadId: string,
	testTypeCode: string,
	options?: { sessionId?: number; phoneNormalized?: string },
): string {
	const path = buildMockTestOnlineAttemptStatusPath(
		omniLeadId,
		testTypeCode,
		options,
	);
	return `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/${path}`;
}

function parseAttemptStatusPayload(data: unknown): MockTestOnlineAttemptStatus | null {
	const payload = unwrapCrmResponseBody(data) ?? data;
	if (!payload || typeof payload !== 'object') return null;
	return payload as MockTestOnlineAttemptStatus;
}

/** SSR — gọi CRM public attempt-status qua proxy SSOT. */
export async function fetchMockTestOnlineAttemptStatus(
	omniLeadId: string,
	testTypeCode: string,
	options?: { sessionId?: number; phoneNormalized?: string },
): Promise<MockTestOnlineAttemptStatus | null> {
	const leadId = omniLeadId.trim();
	const typeCode = testTypeCode.trim();
	if (!leadId || !typeCode) return null;

	const path = buildMockTestOnlineAttemptStatusPath(leadId, typeCode, options);
	const url = buildPublicMockTestCrmUrl(path);
	if (!url) return null;

	const res = await fetch(url, {
		headers: buildPublicMockTestCrmHeaders(),
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

	const path = buildMockTestOnlineAttemptStatusPath(leadId, typeCode, options);
	const result = await fetchPublicMockTestCrmJson({
		path,
		logContext: 'mto.attempt-status',
	});
	if (result.configMissing) {
		return { status: null, httpStatus: 500 };
	}
	if (!result.ok) {
		return { status: null, httpStatus: result.status };
	}

	return {
		status: parseAttemptStatusPayload(result.data ?? result.raw),
		httpStatus: result.status,
	};
}
