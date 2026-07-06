import type { MockTestOnlineAuthorizeResponse } from '@/lib/public-mock-test-online/types';
import { invalidateActiveQuizAttemptCache } from '@/lib/quiz-active-attempt-fetch';
import {
	type MockTestOnlineExamAuth,
	saveMockTestOnlineExamAuth,
} from '@/lib/public-mock-test-online/exam-session';
import { invalidateMockTestOnlineAuthRefreshCache } from '@/lib/public-mock-test-online/exam-auth-refresh-dedupe';

/** Gom logic persist auth sau authorize / authorize-resume. */
export function applyMockTestOnlineAuthorizeResponse(
	prev: MockTestOnlineExamAuth | null,
	data: MockTestOnlineAuthorizeResponse,
	opts?: {
		examSessionToken?: string;
		keepAttemptPublicIdOnSameForm?: boolean;
	},
): MockTestOnlineExamAuth {
	const prevForm = prev?.formPublicId?.trim();
	const nextForm = data.formPublicId?.trim() ?? '';

	if (prevForm && nextForm && prevForm !== nextForm) {
		invalidateActiveQuizAttemptCache(prevForm);
		invalidateMockTestOnlineAuthRefreshCache();
	}

	const keepAttempt =
		opts?.keepAttemptPublicIdOnSameForm !== false &&
		prevForm &&
		nextForm &&
		prevForm === nextForm;

	const auth: MockTestOnlineExamAuth = {
		registrationId: data.registrationId,
		sessionId: data.sessionId,
		formPublicId: data.formPublicId,
		omniLeadId: data.participant?.omniLeadId ?? prev?.omniLeadId ?? '',
		portalAuthorizeExpiresAt: data.portalAuthorizeExpiresAt,
		attemptPublicId: keepAttempt ? prev?.attemptPublicId : undefined,
		examSessionToken: opts?.examSessionToken?.trim() || undefined,
	};

	saveMockTestOnlineExamAuth(auth);
	return auth;
}
