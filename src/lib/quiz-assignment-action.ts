import { fetchQuizStartEligibility } from '@/lib/quiz-assignment-crm';
import {
  filterSubmittedAttemptsForAssignment,
  normalizeQuizAttemptHistoryItems,
} from '@/features/quiz-test/lib/quiz-attempt-history';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import {
  quizRuntimeQueryFromAccess,
  resolveQuizRuntimeAccess,
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
  const access = await resolveQuizRuntimeAccess(formPublicId, { intent: 'access' });
  return loadAssignmentQuizActionStateWithAccess(
    formPublicId,
    assignmentId,
    access,
  );
}

export async function loadAssignmentQuizActionStateWithAccess(
  formPublicId: string,
  assignmentId: number,
  access: QuizRuntimeAccess | null,
): Promise<AssignmentQuizActionState> {
  const resultsPageHref = buildAssignmentResultsHref(formPublicId);

  try {
    const runtimeQ =
      access?.mode === 'assignment' && access.assignmentId === assignmentId
        ? quizRuntimeQueryFromAccess(access)
        : `?assignmentId=${assignmentId}`;

    const [startGate, eligRes, historyRes] = await Promise.all([
      fetchQuizStartEligibility(assignmentId),
      fetch(
        `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}?assignmentId=${assignmentId}`,
        {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        },
      ),
      fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
        `${quizRuntimePublicUrl(`forms/${formPublicId}/attempts`)}${runtimeQ}`,
      ),
    ]);

    const eligibility = (await eligRes.json().catch(() => null)) as AssignmentQuizEligibility | null;
    const eligOk = eligRes.ok && eligibility && typeof eligibility === 'object';

    const rawHistory = historyRes.ok ? historyRes.data?.items : [];
    const submittedAttempts = filterSubmittedAttemptsForAssignment(
      normalizeQuizAttemptHistoryItems(rawHistory),
      assignmentId,
    );

    const submittedCount = eligOk
      ? Number(eligibility.submittedCount) || submittedAttempts.length
      : submittedAttempts.length;
    const maxAttempts = eligOk
      ? eligibility.maxAttempts ?? null
      : null;
    const attemptsRemaining = eligOk
      ? eligibility.attemptsRemaining ??
        (maxAttempts != null ? Math.max(0, maxAttempts - submittedCount) : null)
      : maxAttempts != null
        ? Math.max(0, maxAttempts - submittedCount)
        : null;

    const canStart = startGate.allowed === true;
    const exhausted =
      maxAttempts != null && submittedCount >= maxAttempts;
    const canViewResults = submittedCount > 0;

    return {
      loading: false,
      error: null,
      canStart,
      startBlockReason: canStart ? null : startGate.reason,
      eligibility: eligOk
        ? {
            submittedCount,
            maxAttempts,
            attemptsRemaining,
            hasPerfectScore: Boolean(eligibility.hasPerfectScore),
          }
        : {
            submittedCount,
            maxAttempts,
            attemptsRemaining,
            hasPerfectScore: false,
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
