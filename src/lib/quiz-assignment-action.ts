import { fetchQuizStartEligibility } from '@/lib/quiz-assignment-crm';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import {
  fetchGatewayAssignmentQuizStats,
  historyItemsFromGatewayStats,
} from '@/lib/quiz-gateway-assignment-stats';
import { getQuizFormContext } from '@/lib/quiz-form-context';
import {
  pinAssignmentQuizRuntimeAccess,
  type QuizRuntimeAccess,
} from '@/lib/quiz-runtime-access';

export type AssignmentQuizEligibility = {
  submittedCount: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  hasPerfectScore: boolean;
};

export type AssignmentQuizActionState = {
  loading: boolean;
  error: string | null;
  canStart: boolean;
  startBlockReason: string | null;
  eligibility: AssignmentQuizEligibility | null;
  submittedAttempts: QuizAttemptHistoryItem[];
  /** Có ít nhất một lần đã nộp để xem lại */
  canViewResults: boolean;
  resultsPageHref: string;
};

export function buildAssignmentResultsHref(formPublicId: string): string {
  return `/quiz-test/${encodeURIComponent(formPublicId)}/results`;
}

export function buildAttemptResultHref(
  formPublicId: string,
  attemptPublicId: string,
): string {
  return `/quiz-test/${encodeURIComponent(formPublicId)}/attempts/${encodeURIComponent(attemptPublicId)}`;
}

/**
 * Trạng thái nút Làm bài / Xem kết quả cho bài tập QUIZ.
 */
export async function loadAssignmentQuizActionState(
  formPublicId: string,
  assignmentId: number,
): Promise<AssignmentQuizActionState> {
  pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId);
  const stored = getQuizFormContext(formPublicId);
  const quizMaxAttempts =
    stored?.mode === 'assignment' && stored.assignmentId === assignmentId
      ? stored.quizMaxAttempts
      : undefined;
  return loadAssignmentQuizActionStateWithAccess(
    formPublicId,
    assignmentId,
    null,
    quizMaxAttempts,
  );
}

export async function loadAssignmentQuizActionStateWithAccess(
  formPublicId: string,
  assignmentId: number,
  _access: QuizRuntimeAccess | null,
  quizMaxAttemptsHint?: number | null,
): Promise<AssignmentQuizActionState> {
  const resultsPageHref = buildAssignmentResultsHref(formPublicId);

  try {
    const [startGate, stats] = await Promise.all([
      fetchQuizStartEligibility(assignmentId),
      fetchGatewayAssignmentQuizStats(
        formPublicId,
        assignmentId,
        quizMaxAttemptsHint,
      ),
    ]);

    const submittedAttempts = stats
      ? historyItemsFromGatewayStats(formPublicId, stats)
      : [];

    const submittedCount = stats?.submittedCount ?? submittedAttempts.length;
    const maxAttempts = stats?.maxAttempts ?? quizMaxAttemptsHint ?? null;
    const attemptsRemaining =
      stats?.attemptsRemaining ??
      (maxAttempts != null ? Math.max(0, maxAttempts - submittedCount) : null);

    const canStart = startGate.allowed === true;
    const exhausted =
      maxAttempts != null && submittedCount >= maxAttempts;
    const canViewResults = submittedCount > 0;

    return {
      loading: false,
      error: null,
      canStart,
      startBlockReason: canStart ? null : startGate.reason,
      eligibility: {
        submittedCount,
        maxAttempts,
        attemptsRemaining,
        hasPerfectScore: Boolean(stats?.hasPerfectScore),
      },
      submittedAttempts,
      canViewResults,
      resultsPageHref,
    };
  } catch (e) {
    return {
      loading: false,
      error: e instanceof Error ? e.message : 'Không tải được trạng thái bài làm.',
      canStart: false,
      startBlockReason: null,
      eligibility: null,
      submittedAttempts: [],
      canViewResults: false,
      resultsPageHref,
    };
  }
}
