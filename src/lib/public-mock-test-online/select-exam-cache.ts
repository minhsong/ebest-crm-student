import { MOCK_TEST_ONLINE_LOCAL_RETENTION_MS } from './mock-test-online-intake-draft';



const SELECT_EXAM_CACHE_KEY = 'mock-test-online:select-exam-cache:v3';

const SELECT_EXAM_CACHE_LEGACY_SESSION_KEY =

	'mock-test-online:select-exam-cache:v2';

/** examSessionToken — chỉ tab hiện tại (P1), không lưu localStorage 7 ngày. */

const EXAM_SESSION_TOKEN_KEY = 'mock-test-online:exam-session-token:v1';



export type CachedSelectExamResult = {

	pendingLeadId: string;

	sessionId: number;

	testVariantChoice?: string;

	pendingRegistrationId: string;

	/** PG id sau email grant / sau Zalo unlock — dùng auto-authorize. */
	registrationId?: number | null;

	zaloDeepLink: string;

	zaloOaChatUrl: string;

	zaloOaId?: string;

	zaloConfirmMessage?: string;

	zaloConfirmExpiresAt: string;

	examSessionToken?: string;

	examSessionExpiresAt?: string;

	campaignTitle?: string;

	verificationChannel?: 'zalo' | 'email';

	nextStep?: 'zalo_verify' | 'proceed_to_ready';

};



type SelectExamCacheEnvelope = {

	savedAt: string;

	data: CachedSelectExamResult;

};



type ExamSessionTokenStore = {

	pendingRegistrationId: string;

	examSessionToken: string;

	examSessionExpiresAt: string;

};



function isBrowserStorage(): boolean {

	return typeof localStorage !== 'undefined';

}



function readExamSessionTokenStore(): ExamSessionTokenStore | null {

	if (typeof sessionStorage === 'undefined') return null;

	try {

		const raw = sessionStorage.getItem(EXAM_SESSION_TOKEN_KEY);

		if (!raw) return null;

		const parsed = JSON.parse(raw) as ExamSessionTokenStore;

		if (

			!parsed?.pendingRegistrationId?.trim() ||

			!parsed.examSessionToken?.trim()

		) {

			return null;

		}

		const exp = parsed.examSessionExpiresAt?.trim();

		if (exp && Date.parse(exp) <= Date.now()) return null;

		return parsed;

	} catch {

		return null;

	}

}



function writeExamSessionTokenStore(input: ExamSessionTokenStore): void {

	if (typeof sessionStorage === 'undefined') return;

	try {

		sessionStorage.setItem(EXAM_SESSION_TOKEN_KEY, JSON.stringify(input));

	} catch {

		// ignore quota

	}

}



function clearExamSessionTokenStore(): void {

	if (typeof sessionStorage === 'undefined') return;

	try {

		sessionStorage.removeItem(EXAM_SESSION_TOKEN_KEY);

	} catch {

		// ignore

	}

}



function mergeSessionTokenFromStore(

	data: CachedSelectExamResult,

): CachedSelectExamResult {

	const store = readExamSessionTokenStore();

	if (

		!store ||

		store.pendingRegistrationId !== data.pendingRegistrationId.trim()

	) {

		return data;

	}

	return {

		...data,

		examSessionToken: store.examSessionToken,

		examSessionExpiresAt: store.examSessionExpiresAt,

	};

}



/** Gỡ token khỏi payload localStorage; persist token vào sessionStorage. */

function persistSessionTokenSeparately(

	data: CachedSelectExamResult,

): CachedSelectExamResult {

	const token = data.examSessionToken?.trim();

	const expiresAt = data.examSessionExpiresAt?.trim();

	if (token && expiresAt && data.pendingRegistrationId?.trim()) {

		writeExamSessionTokenStore({

			pendingRegistrationId: data.pendingRegistrationId.trim(),

			examSessionToken: token,

			examSessionExpiresAt: expiresAt,

		});

	}

	const { examSessionToken: _t, examSessionExpiresAt: _e, ...rest } = data;

	return rest;

}



function migrateLegacyTokensInEnvelope(

	envelope: SelectExamCacheEnvelope,

): SelectExamCacheEnvelope {

	const token = envelope.data.examSessionToken?.trim();

	const expiresAt = envelope.data.examSessionExpiresAt?.trim();

	if (!token || !expiresAt) return envelope;

	const stripped = persistSessionTokenSeparately(envelope.data);

	const next: SelectExamCacheEnvelope = {

		savedAt: envelope.savedAt,

		data: stripped,

	};

	try {

		localStorage.setItem(SELECT_EXAM_CACHE_KEY, JSON.stringify(next));

	} catch {

		// ignore

	}

	return next;

}



function readCacheEnvelope(): SelectExamCacheEnvelope | null {

	if (!isBrowserStorage()) return null;

	try {

		const raw = localStorage.getItem(SELECT_EXAM_CACHE_KEY);

		if (raw) {

			const parsed = JSON.parse(raw) as SelectExamCacheEnvelope;

			if (parsed?.data && parsed.savedAt) {

				return migrateLegacyTokensInEnvelope(parsed);

			}

		}

	} catch {

		// fall through legacy

	}

	if (typeof sessionStorage === 'undefined') return null;

	try {

		const legacy = sessionStorage.getItem(SELECT_EXAM_CACHE_LEGACY_SESSION_KEY);

		if (!legacy) return null;

		const data = JSON.parse(legacy) as CachedSelectExamResult;

		const envelope: SelectExamCacheEnvelope = {

			savedAt: new Date().toISOString(),

			data: persistSessionTokenSeparately(data),

		};

		localStorage.setItem(SELECT_EXAM_CACHE_KEY, JSON.stringify(envelope));

		sessionStorage.removeItem(SELECT_EXAM_CACHE_LEGACY_SESSION_KEY);

		return envelope;

	} catch {

		return null;

	}

}



function isEnvelopeWithinRetention(envelope: SelectExamCacheEnvelope): boolean {

	const savedAt = Date.parse(envelope.savedAt);

	if (!Number.isFinite(savedAt)) return false;

	return Date.now() - savedAt <= MOCK_TEST_ONLINE_LOCAL_RETENTION_MS;

}



export function hasActiveExamSessionToken(

	parsed: CachedSelectExamResult,

): boolean {

	const merged = mergeSessionTokenFromStore(parsed);

	if (!merged.examSessionToken?.trim()) return false;

	const exp = merged.examSessionExpiresAt?.trim();

	if (exp && Date.parse(exp) <= Date.now()) return false;

	return true;

}



/** Cache còn dùng được để recovery (chờ Zalo / quay lại trong 7 ngày). */

export function isSelectExamCacheRecoverable(

	parsed: CachedSelectExamResult,

	envelope?: SelectExamCacheEnvelope | null,

): boolean {

	const env = envelope ?? null;

	if (env && !isEnvelopeWithinRetention(env)) return false;

	if (!parsed.pendingRegistrationId?.trim() || !parsed.sessionId) return false;

	return true;

}



export function readSelectExamCache(

	leadId: string,

	sessionId: number,

): CachedSelectExamResult | null {

	const envelope = readCacheEnvelope();

	if (!envelope) return null;

	const parsed = mergeSessionTokenFromStore(envelope.data);

	if (parsed.pendingLeadId !== leadId || parsed.sessionId !== sessionId) {

		return null;

	}

	return isSelectExamCacheRecoverable(parsed, envelope) ? parsed : null;

}



/** Recovery confirm-exam khi URL chỉ có `pending` + `session` (không có `lead`). */

export function readSelectExamCacheByPending(

	pendingRegistrationId: string,

	sessionId: number,

): CachedSelectExamResult | null {

	const envelope = readCacheEnvelope();

	if (!envelope) return null;

	const parsed = mergeSessionTokenFromStore(envelope.data);

	if (

		parsed.pendingRegistrationId !== pendingRegistrationId ||

		parsed.sessionId !== sessionId

	) {

		return null;

	}

	return isSelectExamCacheRecoverable(parsed, envelope) ? parsed : null;

}



export function patchSelectExamCacheSession(input: {

	examSessionToken: string;

	examSessionExpiresAt: string;

	pendingRegistrationId?: string;

}): void {

	if (!isBrowserStorage()) return;

	try {

		const envelope = readCacheEnvelope();

		const pendingId =

			input.pendingRegistrationId?.trim() ||

			envelope?.data.pendingRegistrationId?.trim();

		if (!pendingId) return;

		writeExamSessionTokenStore({

			pendingRegistrationId: pendingId,

			examSessionToken: input.examSessionToken.trim(),

			examSessionExpiresAt: input.examSessionExpiresAt.trim(),

		});

	} catch {

		// ignore

	}

}



export function readAnyActiveExamSessionToken(): string | null {

	const fromStore = readExamSessionTokenStore();

	if (fromStore?.examSessionToken?.trim()) {

		return fromStore.examSessionToken.trim();

	}

	const envelope = readCacheEnvelope();

	if (!envelope || !isEnvelopeWithinRetention(envelope)) return null;

	const parsed = mergeSessionTokenFromStore(envelope.data);

	if (!hasActiveExamSessionToken(parsed)) return null;

	return parsed.examSessionToken!.trim();

}



/** Alias — WS unlock cập nhật token session trên cache. */

export const patchSelectExamCache = patchSelectExamCacheSession;



export function writeSelectExamCache(result: CachedSelectExamResult): void {

	if (!isBrowserStorage()) return;

	try {

		const envelope: SelectExamCacheEnvelope = {

			savedAt: new Date().toISOString(),

			data: persistSessionTokenSeparately(result),

		};

		localStorage.setItem(SELECT_EXAM_CACHE_KEY, JSON.stringify(envelope));

	} catch {

		// ignore quota

	}

}



/** Xóa cache pre-exam (select/confirm) — gọi trước khi restart funnel. */

export function clearMockTestOnlineSelectExamCache(): void {

	if (!isBrowserStorage()) return;

	try {

		localStorage.removeItem(SELECT_EXAM_CACHE_KEY);

	} catch {

		// ignore

	}

	clearExamSessionTokenStore();

	if (typeof sessionStorage !== 'undefined') {

		try {

			sessionStorage.removeItem(SELECT_EXAM_CACHE_LEGACY_SESSION_KEY);

		} catch {

			// ignore

		}

	}

}



/** URL confirm-exam canonical sau Zalo verify (legacy `/exam` redirect). */

export function buildMockTestOnlineConfirmExamPath(input: {

	pendingRegistrationId: string;

	pendingLeadId?: string;

	sessionId?: number;

	registrationId?: number;

}): string {

	const params = new URLSearchParams();

	params.set('pending', input.pendingRegistrationId.trim());

	if (input.pendingLeadId?.trim()) {

		params.set('lead', input.pendingLeadId.trim());

	}

	if (input.sessionId && input.sessionId >= 1) {

		params.set('session', String(input.sessionId));

	}

	if (input.registrationId && input.registrationId >= 1) {

		params.set('registration', String(input.registrationId));

	}

	return `/mock-test-online/confirm-exam?${params.toString()}`;

}

