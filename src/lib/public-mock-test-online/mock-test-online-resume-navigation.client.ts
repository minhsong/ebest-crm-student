'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { refreshMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import { buildMockTestOnlineInExamResumePath } from '@/lib/public-mock-test-online/exam-flow.util';
import { buildMockTestOnlineExamRunPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

/** Mở lại bài thi đang làm dở — authorize-resume (không qua Zalo/confirm-exam). */
export async function navigateMockTestOnlineResume(
	status: MockTestOnlineAttemptStatus,
	router: AppRouterInstance,
): Promise<void> {
	const regId = status.activeInExam?.registrationId;
	if (regId == null || regId < 1) {
		router.push(buildMockTestOnlineInExamResumePath(status));
		return;
	}

	const auth = await refreshMockTestOnlineExamAuth(regId);
	router.push(
		buildMockTestOnlineExamRunPath({
			registrationId: regId,
			formPublicId: auth?.formPublicId,
		}),
	);
}
