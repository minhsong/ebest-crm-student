/**
 * Server-only: proxy CRM `/api/v1/public/mock-test-online/*`.
 * SSOT theo NEXTJS_PORTAL_STANDARDS §2.1 — không raw getApiBaseUrl rải route.
 */
import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy.shared';
import { resolveCrmServiceKey } from '@/lib/service-keys';
import { logMtoLayerError, mtoOutboundRequestHeaders } from '@/lib/public-mock-test-online/mto-layer-error';

function resolvePortalOrigin(): string {
	const configured = process.env.STUDENT_PORTAL_ORIGIN?.trim();
	if (configured) return configured.replace(/\/$/, '');
	const site =
		process.env.SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		'';
	if (site) return site.replace(/\/$/, '');
	return 'http://localhost:3000';
}

export function buildPublicMockTestCrmHeaders(
	extra?: HeadersInit,
): Record<string, string> {
	const origin = resolvePortalOrigin();
	const headers: Record<string, string> = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Origin: origin,
		Referer: `${origin}/mock-test-online/register`,
		...mtoOutboundRequestHeaders(),
	};
	const crmKey = resolveCrmServiceKey();
	if (crmKey) {
		headers.Authorization = `Bearer ${crmKey}`;
		headers['X-Public-Reg-Server-Token'] = crmKey;
	}
	if (extra) {
		const h = new Headers(extra);
		h.forEach((v, k) => {
			headers[k] = v;
		});
	}
	return headers;
}

export function buildPublicMockTestCrmUrl(path: string): string | null {
	const apiBase = getApiBaseUrl();
	if (!apiBase) return null;
	const clean = path.replace(/^\//, '');
	return `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/${clean}`;
}

export type PublicMockTestCrmFetchResult<T> = {
	ok: boolean;
	status: number;
	data: T | null;
	raw: Record<string, unknown>;
	errorMessage: string | null;
	configMissing?: boolean;
};

/**
 * Fetch CRM public MTO path (GET/POST/…).
 * Không throw — caller map sang NextResponse / soft null.
 */
export async function fetchPublicMockTestCrmJson<T = unknown>(options: {
	path: string;
	method?: 'GET' | 'POST' | 'PATCH';
	body?: unknown;
	logContext?: string;
}): Promise<PublicMockTestCrmFetchResult<T>> {
	const url = buildPublicMockTestCrmUrl(options.path);
	if (!url) {
		logMtoLayerError(new Error('CRM_API_URL missing'), {
			module: 'mto-bff',
			operation: options.logContext ?? options.path,
			layer: 'proxy-crm',
			path: options.path,
			method: options.method ?? 'GET',
			errorType: 'CRM_CONFIG_MISSING',
		});
		return {
			ok: false,
			status: 500,
			data: null,
			raw: {},
			errorMessage: 'Cấu hình hệ thống chưa đúng.',
			configMissing: true,
		};
	}

	try {
		const res = await fetch(url, {
			method: options.method ?? 'GET',
			headers: buildPublicMockTestCrmHeaders(),
			body:
				options.method && options.method !== 'GET' && options.body !== undefined
					? JSON.stringify(options.body)
					: undefined,
			cache: 'no-store',
		});
		const raw = (await res.json().catch(() => ({}))) as Record<
			string,
			unknown
		>;
		if (!res.ok) {
			const msg = raw.message;
			return {
				ok: false,
				status: res.status,
				data: null,
				raw,
				errorMessage:
					typeof msg === 'string' && msg.trim()
						? msg
						: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
			};
		}
		return {
			ok: true,
			status: res.status,
			data: (unwrapCrmResponseBody(raw) ?? raw) as T,
			raw,
			errorMessage: null,
		};
	} catch (error) {
		// Log layer proxy-crm; soft-return — caller BFF terminal map hoặc rethrow nếu cần.
		logMtoLayerError(error, {
			module: 'mto-bff',
			operation: options.logContext ?? options.path,
			layer: 'proxy-crm',
			path: options.path,
			method: options.method ?? 'GET',
			errorType: 'CRM_UPSTREAM_NETWORK',
		});
		return {
			ok: false,
			status: 502,
			data: null,
			raw: {},
			errorMessage: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
		};
	}
}
