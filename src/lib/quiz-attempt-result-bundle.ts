import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import {
  buildAssignmentResultsHref,
  buildAssignmentQuizActionFromEligibility,
} from '@/lib/quiz-assignment-action';
import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import type { QuizResultViewState } from '@/features/quiz-test/lib/quiz-result-view-policy';
import { resolveQuizResultViewState } from '@/lib/quiz-runtime-eligibility';

export type QuizAttemptReviewBundleResponse = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
};

export type QuizAttemptResultBundle = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  viewState: QuizResultViewState;
  assignmentAction: AssignmentQuizActionState | null;
};

/**
 * Một request Gateway (layout + attempt) + SSOT eligibility từ CRM/Gateway stats.
 */
export async function fetchQuizAttemptResultBundle(
  formPublicId: string,
  attemptPublicId: string,
): Promise<QuizAttemptResultBundle> {
  const res = await fetchQuizRuntimeJson<QuizAttemptReviewBundleResponse>(
    quizRuntimePublicUrl(`attempts/${attemptPublicId.trim()}/review-bundle`),
  );

  if (!res.ok || !res.data) {
    const errBody = res.data as unknown as { message?: string } | null;
    const msg =
      typeof errBody?.message === 'string'
        ? errBody.message
        : 'Không tải được kết quả bài làm.';
    throw new Error(msg);
  }

  const data = res.data;
  const assignmentIdHint =
    data.access.mode === 'assignment' && data.access.assignmentId != null
      ? data.access.assignmentId
      : undefined;

  const resolved = await resolveQuizResultViewState(formPublicId, {
    attemptPublicId,
    assignmentIdHint,
    preferPractice: data.access.practiceMode,
  });

  const access = resolved.access ?? data.access;
  const assignmentAction =
    access.mode === 'assignment' && access.assignmentId != null
      ? buildAssignmentQuizActionFromEligibility(
          formPublicId,
          resolved.eligibility,
        )
      : null;

  return {
    access,
    formPayload: data.formPayload,
    attempt: data.attempt as QuizAttemptResultSnapshot,
    viewState: {
      eligibility: resolved.eligibility,
      canViewData: resolved.canViewData,
      canViewResultDetail: resolved.canViewResultDetail,
    },
    assignmentAction,
  };
}
