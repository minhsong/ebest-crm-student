import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action';
import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import {
  buildQuizResultEligibility,
  isQuizResultDetailEligible,
  type QuizAttemptEligibilityStats,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';

export type QuizAttemptReviewBundleResponse = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  /** SSOT mới — assignment hoặc practice */
  quizAttemptStats?: QuizAttemptEligibilityStats | null;
  /** @deprecated Dùng quizAttemptStats */
  assignmentStats?: QuizAttemptEligibilityStats | null;
  /** @deprecated Dùng quizAttemptStats */
  practiceStats?: QuizAttemptEligibilityStats | null;
};

export type QuizAttemptResultBundle = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  eligibility: QuizResultEligibility | null;
  assignmentAction: AssignmentQuizActionState | null;
};

function statsFromBundle(
  data: QuizAttemptReviewBundleResponse,
): QuizAttemptEligibilityStats | null {
  return (
    data.quizAttemptStats ?? data.assignmentStats ?? data.practiceStats ?? null
  );
}

function eligibilityFromStats(
  stats: QuizAttemptEligibilityStats | null,
): QuizResultEligibility | null {
  if (!stats) return null;
  return buildQuizResultEligibility({
    submittedCount: stats.submittedCount,
    maxAttempts: stats.maxAttempts,
    hasPerfectScore: stats.hasPerfectScore,
    attemptsRemaining: stats.attemptsRemaining,
  });
}

function assignmentActionFromStats(
  formPublicId: string,
  stats: QuizAttemptEligibilityStats | null,
): AssignmentQuizActionState | null {
  if (!stats) return null;

  const eligibility = eligibilityFromStats(stats);
  const canViewResultDetail = isQuizResultDetailEligible(eligibility);
  const canStart =
    stats.attemptsRemaining === null || stats.attemptsRemaining > 0;

  return {
    loading: false,
    error: null,
    canStart,
    startBlockReason: canStart ? null : 'Đã hết số lần làm bài.',
    eligibility,
    submittedAttempts: [],
    canViewResultDetail,
    canViewResults: canViewResultDetail,
    resultsPageHref: buildAssignmentResultsHref(formPublicId),
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
  const stats = statsFromBundle(data);

  return {
    access: {
      mode: data.access.mode,
      assignmentId: data.access.assignmentId,
      practiceMode: data.access.practiceMode,
    },
    formPayload: data.formPayload,
    attempt: data.attempt as QuizAttemptResultSnapshot,
    eligibility: eligibilityFromStats(stats),
    assignmentAction: assignmentActionFromStats(formPublicId, stats),
  };
}
