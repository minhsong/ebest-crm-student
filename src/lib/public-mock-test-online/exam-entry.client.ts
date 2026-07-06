'use client';

import { fetchActiveQuizAttemptState } from '@/lib/quiz-active-attempt-fetch';
import { ensureMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import { buildMockTestOnlineExamRunPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';

const REGISTER_PATH = '/mock-test-online/register';

function examReadyPath(formPublicId: string): string {
	return `/mock-test-online/exam/ready?form=${encodeURIComponent(formPublicId)}`;
}

function examRunPath(formPublicId: string): string {
	return buildMockTestOnlineExamRunPath({ formPublicId });
}

/** Điều hướng entry `/mock-test-online` theo session làm bài trong sessionStorage. */
export async function resolveMockTestOnlineEntryHref(): Promise<string> {
	const auth = await ensureMockTestOnlineExamAuth();
	if (!auth?.formPublicId?.trim()) {
		return REGISTER_PATH;
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
