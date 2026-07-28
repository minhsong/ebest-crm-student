/**
 * Server-only: proxy CRM `/api/v1/public/mock-test-online/*`.
 * SSOT theo NEXTJS_PORTAL_STANDARDS §2.1 — không raw getApiBaseUrl rải route.
 */
import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy.shared';
import { resolveCrmServiceKey } from '@/lib/service-keys';
import { logMtoLayerError, mtoOutboundRequestHeaders } from '@/lib/public-mock-test-online/mto-layer-error';
import { logPortalUpstream } from '@/lib/portal-ssr-debug';

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
	/** URL tuyệt đối đã gọi (để debug). */
	url: string | null;
	configMissing?: boolean;
};

function bodyPreviewFromRaw(raw: Record<string, unknown>): string {
	try {
		return JSON.stringify(raw).slice(0, 800);
	} catch {
		return '[unserializable]';
	}
}

/**
 * Fetch CRM public MTO path (GET/POST/…).
 * Không throw — caller map sang NextResponse / soft null.
 * Mọi HTTP/network fail → stdout `portal.upstream.*` + CRM khi network.
 */
export async function fetchPublicMockTestCrmJson<T = unknown>(options: {
	path: string;
	method?: 'GET' | 'POST' | 'PATCH';
	body?: unknown;
	logContext?: string;
}): Promise<PublicMockTestCrmFetchResult<T>> {
	const method = options.method ?? 'GET';
	const operation = options.logContext ?? options.path;
	const url = buildPublicMockTestCrmUrl(options.path);
	if (!url) {
		logPortalUpstream('crm_config_missing', {
			method,
			path: options.path,
			ok: false,
			status: 500,
			errorMessage: 'CRM_API_URL missing',
		});
		logMtoLayerError(new Error('CRM_API_URL missing'), {
			module: 'mto-bff',
			operation,
			layer: 'proxy-crm',
			path: options.path,
			method,
			errorType: 'CRM_CONFIG_MISSING',
		});
		return {
			ok: false,
			status: 500,
			data: null,
			raw: {},
			url: null,
			errorMessage: 'Cấu hình hệ thống chưa đúng.',
			configMissing: true,
		};
	}

	const started = Date.now();
	try {
		const res = await fetch(url, {
			method,
			headers: buildPublicMockTestCrmHeaders(),
			body:
				method !== 'GET' && options.body !== undefined
					? JSON.stringify(options.body)
					: undefined,
			cache: 'no-store',
		});
		const raw = (await res.json().catch(() => ({}))) as Record<
			string,
			unknown
		>;
		const durationMs = Date.now() - started;
		if (!res.ok) {
			const msg = raw.message;
			const errorMessage =
				typeof msg === 'string' && msg.trim()
					? msg
					: 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
			const preview = bodyPreviewFromRaw(raw);
			logPortalUpstream('crm_http_error', {
				method,
				url,
				path: options.path,
				status: res.status,
				ok: false,
				durationMs,
				errorMessage,
				bodyPreview: preview,
			});
			logMtoLayerError(
				new Error(`CRM ${method} ${options.path} → HTTP ${res.status}: ${errorMessage}`),
				{
					module: 'mto-bff',
					operation,
					layer: 'proxy-crm',
					path: options.path,
					method,
					errorType: 'CRM_UPSTREAM_HTTP',
					extra: {
						url,
						status: res.status,
						bodyPreview: preview,
					},
				},
			);
			return {
				ok: false,
				status: res.status,
				data: null,
				raw,
				url,
				errorMessage,
			};
		}
		logPortalUpstream('crm_ok', {
			method,
			url,
			path: options.path,
			status: res.status,
			ok: true,
			durationMs,
		});
		return {
			ok: true,
			status: res.status,
			data: (unwrapCrmResponseBody(raw) ?? raw) as T,
			raw,
			url,
			errorMessage: null,
		};
	} catch (error) {
		const durationMs = Date.now() - started;
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logPortalUpstream('crm_network_error', {
			method,
			url,
			path: options.path,
			status: 502,
			ok: false,
			durationMs,
			errorMessage,
			bodyPreview:
				error instanceof Error ? error.stack?.slice(0, 800) ?? null : null,
		});
		logMtoLayerError(error, {
			module: 'mto-bff',
			operation,
			layer: 'proxy-crm',
			path: options.path,
			method,
			errorType: 'CRM_UPSTREAM_NETWORK',
			extra: { url, durationMs },
		});
		return {
			ok: false,
			status: 502,
			data: null,
			raw: {},
			url,
			errorMessage: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
		};
	}
}
