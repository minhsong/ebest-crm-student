import {
  buildQuizResultViewState,
  computeAttemptsRemaining,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import type {
  AssignmentQuizActionState,
  AssignmentQuizSnapshot,
} from '@/lib/quiz-assignment-action.types';

export function buildAssignmentResultsHref(formPublicId: string): string {
  return `/quiz-test/${encodeURIComponent(formPublicId)}/results`;
}

export function assignmentSnapshotFromEligibility(
  eligibility: QuizResultEligibility | null,
  options: {
    canStart: boolean;
    startBlockReason: string | null;
    submittedAttempts: AssignmentQuizActionState['submittedAttempts'];
  },
): AssignmentQuizSnapshot {
  const view = buildQuizResultViewState(eligibility);
  return {
    canStart: options.canStart,
    startBlockReason: options.startBlockReason,
    eligibility,
    submittedAttempts: options.submittedAttempts,
    canViewResultDetail: view.canViewResultDetail,
    canViewResults: view.canViewResultDetail,
  };
}

export function assignmentActionStateFromSnapshot(
  formPublicId: string,
  snapshot: AssignmentQuizSnapshot,
  partial?: Pick<AssignmentQuizActionState, 'loading' | 'error'>,
): AssignmentQuizActionState {
  return {
    loading: partial?.loading ?? false,
    error: partial?.error ?? null,
    resultsPageHref: buildAssignmentResultsHref(formPublicId),
    ...snapshot,
  };
}

/** Khi chỉ có eligibility (vd. sau review-bundle) — suy canStart từ lượt còn lại. */
export function buildAssignmentQuizActionFromEligibility(
  formPublicId: string,
  eligibility: QuizResultEligibility | null,
): AssignmentQuizActionState | null {
  if (!eligibility) return null;

  const attemptsRemaining =
    eligibility.attemptsRemaining ??
    computeAttemptsRemaining(eligibility.maxAttempts, eligibility.submittedCount);
  const canStart = attemptsRemaining === null || attemptsRemaining > 0;

  return assignmentActionStateFromSnapshot(
    formPublicId,
    assignmentSnapshotFromEligibility(eligibility, {
      canStart,
      startBlockReason: canStart ? null : 'Đã hết số lần làm bài.',
      submittedAttempts: [],
    }),
  );
}
