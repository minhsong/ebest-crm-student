/**
 * Server-only: gọi CRM public mock-test — không expose GET qua Route Handler client.
 */
import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';
import type {
	PublicLocationGroup,
	PublicRegistrationOptions,
	PublicSessionsResponse,
} from '@/lib/public-mock-test/types';

export type PublicMockTestRegisterPageData = {
	locations: PublicLocationGroup[];
	profileOptions: PublicRegistrationOptions | null;
	sessionsError: string | null;
	profileOptionsError: string | null;
	initialContact: {
		displayName?: string;
		primaryPhone?: string;
		primaryEmail?: string;
	} | null;
};

function resolvePortalOrigin(): string {
	const configured = process.env.STUDENT_PORTAL_ORIGIN?.trim();
	if (configured) {
		return configured.replace(/\/$/, '');
	}
	const site =
		process.env.SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		'';
	if (site) {
		return site.replace(/\/$/, '');
	}
	return 'http://localhost:3000';
}

function crmPublicMockTestHeaders(): HeadersInit {
	const origin = resolvePortalOrigin();
	const headers: Record<string, string> = {
		Accept: 'application/json',
		Origin: origin,
		Referer: `${origin}/mock-test-register`,
	};
	// Chỉ cần khi CRM bật PUBLIC_REG_ORIGIN_CHECK_ENABLED=true
	const serverToken = process.env.PUBLIC_REG_SERVER_TOKEN?.trim();
	if (serverToken) {
		headers['X-Public-Reg-Server-Token'] = serverToken;
	}
	return headers;
}

async function fetchCrmPublicMockTest<T>(
	path: string,
	fallbackError: string,
): Promise<{ data: T | null; error: string | null }> {
	const apiBase = getApiBaseUrl();
	if (!apiBase) {
		return { data: null, error: 'Cấu hình hệ thống chưa đúng.' };
	}
	const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test/${path}`;
	try {
		const res = await fetch(url, {
			headers: crmPublicMockTestHeaders(),
			cache: 'no-store',
		});
		const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok) {
			const msg = raw.message;
			return {
				data: null,
				error:
					typeof msg === 'string' && msg.trim()
						? msg
						: fallbackError,
			};
		}
		return {
			data: (unwrapCrmResponseBody(raw) ?? raw) as T,
			error: null,
		};
	} catch {
		return { data: null, error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
	}
}

async function loadLoggedInStudentContact(): Promise<{
	displayName?: string;
	primaryPhone?: string;
	primaryEmail?: string;
} | null> {
	try {
		const payload = await fetchStudentMeForSsr();
		if (!payload) return null;
		const parsed = parseStudentMeCustomerBrief(payload?.customer ?? payload);
		if (!parsed) return null;
		return {
			displayName: parsed.fullName || undefined,
			primaryPhone: parsed.primaryPhone?.trim() || undefined,
			primaryEmail: parsed.primaryEmail?.trim() || undefined,
		};
	} catch {
		return null;
	}
}

/** SSR: buổi thi + tag options cho trang đăng ký công khai. */
export async function loadPublicMockTestRegisterPageData(): Promise<PublicMockTestRegisterPageData> {
	const [sessionsRes, optionsRes, initialContact] = await Promise.all([
		fetchCrmPublicMockTest<PublicSessionsResponse>(
			'sessions',
			'Không tải được lịch thi.',
		),
		fetchCrmPublicMockTest<PublicRegistrationOptions>(
			'registration-options',
			'Không tải được danh mục mô tả.',
		),
		loadLoggedInStudentContact(),
	]);

	return {
		locations: sessionsRes.data?.locations ?? [],
		profileOptions: optionsRes.data ?? null,
		sessionsError: sessionsRes.error,
		profileOptionsError: optionsRes.error,
		initialContact,
	};
}
