import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action';
import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import type { QuizEligibilityFromCrm } from '@/features/quiz-test/lib/quiz-result-view-policy';

export type QuizAttemptReviewBundleResponse = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  assignmentStats: {
    submittedCount: number;
    hasPerfectScore: boolean;
    maxAttempts: number | null;
    attemptsRemaining: number | null;
  } | null;
};

export type QuizAttemptResultBundle = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  eligibility: QuizEligibilityFromCrm | null;
  assignmentAction: AssignmentQuizActionState | null;
};

function eligibilityFromStats(
  stats: QuizAttemptReviewBundleResponse['assignmentStats'],
): QuizEligibilityFromCrm | null {
  if (!stats) return null;
  return {
    submittedCount: stats.submittedCount,
    maxAttempts: stats.maxAttempts,
    attemptsRemaining: stats.attemptsRemaining,
    hasPerfectScore: stats.hasPerfectScore,
  };
}

function assignmentActionFromStats(
  formPublicId: string,
  stats: QuizAttemptReviewBundleResponse['assignmentStats'],
): AssignmentQuizActionState | null {
  if (!stats) return null;
  const resultsPageHref = buildAssignmentResultsHref(formPublicId);
  const canViewResults = stats.submittedCount > 0;
  const canStart =
    stats.attemptsRemaining === null ||
    (stats.attemptsRemaining != null && stats.attemptsRemaining > 0);
  return {
    loading: false,
    error: null,
    canStart,
    startBlockReason: canStart ? null : 'Đã hết số lần làm bài.',
    eligibility: eligibilityFromStats(stats),
    submittedAttempts: [],
    canViewResults,
    resultsPageHref,
  };
}

/**
 * Một request Gateway (Mongo SSOT) — không gọi CRM để render kết quả.
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
  const access: QuizRuntimeAccess = {
    mode: data.access.mode,
    assignmentId: data.access.assignmentId,
    practiceMode: data.access.practiceMode,
  };

  return {
    access,
    formPayload: data.formPayload,
    attempt: data.attempt as QuizAttemptResultSnapshot,
    eligibility: eligibilityFromStats(data.assignmentStats),
    assignmentAction: assignmentActionFromStats(formPublicId, data.assignmentStats),
  };
}
