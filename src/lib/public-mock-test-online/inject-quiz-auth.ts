/** Quiz runtime MTO — client chỉ gửi registrationId; BFF mint HMAC (không cookie capability). */

import { loadMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-session';

export const MTO_REGISTRATION_ID_HEADER = 'X-Mto-Registration-Id';

export function isMockTestOnlineQuizRuntimeUrl(url: string): boolean {
	return url.includes('/mock-test-online/quiz-runtime');
}

export function resolveMtoRegistrationIdForClient(): number | null {
	const auth = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
	const id = auth?.registrationId;
	return typeof id === 'number' && id >= 1 ? id : null;
}

export function appendMockTestQuizAuthToUrl(url: string): string {
	return url;
}

export function enrichMockTestQuizAuthBody(body: unknown): string {
	if (typeof body === 'string' && body.trim()) return body;
	if (body && typeof body === 'object') return JSON.stringify(body);
	return JSON.stringify({});
}

/** Headers bổ sung cho fetch quiz-runtime MTO (registrationId → BFF mint token). */
export function mockTestQuizRuntimeClientHeaders(): Record<string, string> {
	const registrationId = resolveMtoRegistrationIdForClient();
	if (!registrationId) return {};
	return { [MTO_REGISTRATION_ID_HEADER]: String(registrationId) };
}
