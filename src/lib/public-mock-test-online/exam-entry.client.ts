'use client';

import { fetchActiveQuizAttemptState } from '@/lib/quiz-active-attempt-fetch';
import { ensureMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import { buildMockTestOnlineExamRunPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

function examReadyPath(formPublicId: string): string {
	return `/mock-test-online/exam/ready?form=${encodeURIComponent(formPublicId)}`;
}

function examRunPath(formPublicId: string): string {
	return buildMockTestOnlineExamRunPath({ formPublicId });
}

/**
 * Entry `/mock-test-online` — auth-first: có exam session → ready/run; không → select (gate login).
 */
export async function resolveMockTestOnlineEntryHref(): Promise<string> {
	const auth = await ensureMockTestOnlineExamAuth();
	if (!auth?.formPublicId?.trim()) {
		return PORTAL_MOCK_TEST_ROUTES.onlineSelect;
	}

	const formPublicId = auth.formPublicId.trim();
	try {
		const active = await fetchActiveQuizAttemptState(formPublicId, {
			mockTestOnlineRuntime: true,
		});
		if (active?.state === 'in_progress') {
			return examRunPath(formPublicId);
		}
	} catch {
		// fallback ready
	}

	return examReadyPath(formPublicId);
}
