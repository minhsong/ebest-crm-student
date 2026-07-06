/** Quiz runtime mock-test-online — token do BFF httpOnly cookie inject; không gắn query/body client-side. */

export function isMockTestOnlineQuizRuntimeUrl(url: string): boolean {

	return url.includes('/mock-test-online/quiz-runtime');

}



export function appendMockTestQuizAuthToUrl(url: string): string {

	return url;

}



export function enrichMockTestQuizAuthBody(body: unknown): string {

	if (typeof body === 'string' && body.trim()) return body;

	if (body && typeof body === 'object') return JSON.stringify(body);

	return JSON.stringify({});

}

