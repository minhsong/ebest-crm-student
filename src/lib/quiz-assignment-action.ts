import {
  buildQuizEligibilityFromGatewayStats,
  buildQuizResultEligibility,
  isQuizResultDetailEligible,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { fetchQuizStartEligibility } from '@/lib/quiz-assignment-crm';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import {
  fetchGatewayQuizStats,
  historyItemsFromGatewayStats,
} from '@/lib/quiz-gateway-stats';
import { getQuizFormContext } from '@/lib/quiz-form-context';
import {
  pinAssignmentQuizRuntimeAccess,
  type QuizRuntimeAccess,
} from '@/lib/quiz-runtime-access';

/** @deprecated Dùng QuizResultEligibility */
export type AssignmentQuizEligibility = QuizResultEligibility;

export type AssignmentQuizActionState = {
  loading: boolean;
  error: string | null;
  canStart: boolean;
  startBlockReason: string | null;
  eligibility: QuizResultEligibility | null;
  submittedAttempts: QuizAttemptHistoryItem[];
  /** Đủ điều kiện xem chi tiết đáp án / trang kết quả */
  canViewResultDetail: boolean;
  /** @deprecated Dùng canViewResultDetail */
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

function actionStateFromEligibility(
  partial: Omit<
    AssignmentQuizActionState,
    'canViewResultDetail' | 'canViewResults'
  > & { eligibility: QuizResultEligibility | null },
): AssignmentQuizActionState {
  const canViewResultDetail = isQuizResultDetailEligible(partial.eligibility);
  return {
    ...partial,
    canViewResultDetail,
    canViewResults: canViewResultDetail,
  };
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
      fetchGatewayQuizStats(formPublicId, {
        channel: 'assignment',
        assignmentId,
        maxAttemptsHint: quizMaxAttemptsHint,
      }),
    ]);

    const submittedAttempts = stats
      ? historyItemsFromGatewayStats(formPublicId, stats)
      : [];

    const submittedCount = stats?.submittedCount ?? submittedAttempts.length;
    const maxAttempts = stats?.maxAttempts ?? quizMaxAttemptsHint ?? null;

    const eligibility = buildQuizResultEligibility({
      submittedCount,
      maxAttempts,
      hasPerfectScore: Boolean(stats?.hasPerfectScore),
      attemptsRemaining: stats?.attemptsRemaining,
    });

    return actionStateFromEligibility({
      loading: false,
      error: null,
      canStart: startGate.allowed === true,
      startBlockReason: startGate.allowed ? null : startGate.reason,
      eligibility,
      submittedAttempts,
      resultsPageHref,
    });
  } catch (e) {
    return actionStateFromEligibility({
      loading: false,
      error: e instanceof Error ? e.message : 'Không tải được trạng thái bài làm.',
      canStart: false,
      startBlockReason: null,
      eligibility: null,
      submittedAttempts: [],
      resultsPageHref,
    });
  }
}

/** Ôn luyện — cùng quy tắc xem chi tiết với bài tập. */
export async function loadPracticeQuizActionState(
  formPublicId: string,
  practiceMaxAttemptsHint?: number | null,
): Promise<
  Pick<
    AssignmentQuizActionState,
    'eligibility' | 'submittedAttempts' | 'canViewResultDetail' | 'canViewResults' | 'resultsPageHref'
  >
> {
  const resultsPageHref = buildAssignmentResultsHref(formPublicId);

  try {
    const stats = await fetchGatewayQuizStats(formPublicId, {
      channel: 'practice',
      maxAttemptsHint: practiceMaxAttemptsHint,
    });
    const eligibility = buildQuizEligibilityFromGatewayStats(stats, {
      channel: 'practice',
      maxAttemptsHint: practiceMaxAttemptsHint,
    });
    const submittedAttempts = stats
      ? historyItemsFromGatewayStats(formPublicId, stats)
      : [];
    const canViewResultDetail = isQuizResultDetailEligible(eligibility);

    return {
      eligibility,
      submittedAttempts,
      canViewResultDetail,
      canViewResults: canViewResultDetail,
      resultsPageHref,
    };
  } catch {
    return {
      eligibility: null,
      submittedAttempts: [],
      canViewResultDetail: false,
      canViewResults: false,
      resultsPageHref,
    };
  }
}
