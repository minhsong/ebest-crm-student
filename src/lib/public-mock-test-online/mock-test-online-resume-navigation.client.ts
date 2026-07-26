'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { refreshMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import { buildMockTestOnlineInExamResumePath } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	buildMockTestOnlineExamReadyPath,
	buildMockTestOnlineExamRunPath,
} from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

/**
 * Resume drop:
 * - `in_exam` → `/exam/run` (giữ timer còn lại)
 * - `activeReady` (Zalo unlock chưa start) → `/exam/ready` (Start mới tính giờ)
 */
export async function navigateMockTestOnlineResume(
	status: MockTestOnlineAttemptStatus,
	router: AppRouterInstance,
): Promise<void> {
	const inExamRegId = status.activeInExam?.registrationId;
	if (
		status.activeInExam?.resumeAllowed &&
		inExamRegId != null &&
		inExamRegId >= 1
	) {
		const auth = await refreshMockTestOnlineExamAuth(inExamRegId);
		router.push(
			buildMockTestOnlineExamRunPath({
				registrationId: inExamRegId,
				formPublicId: auth?.formPublicId,
			}),
		);
		return;
	}

	const readyRegId = status.activeReady?.registrationId;
	if (
		status.activeReady?.resumeAllowed &&
		readyRegId != null &&
		readyRegId >= 1
	) {
		const auth = await refreshMockTestOnlineExamAuth(readyRegId);
		router.push(
			buildMockTestOnlineExamReadyPath({
				registrationId: readyRegId,
				formPublicId: auth?.formPublicId,
			}),
		);
		return;
	}

	if (inExamRegId != null && inExamRegId >= 1) {
		router.push(buildMockTestOnlineInExamResumePath(status));
		return;
	}

	router.push('/mock-test-online/select-exam');
}
