/**
 * SSOT Student Portal — quota / void (mirror Gateway `quiz-attempt-quota.util.ts`).
 * Spec: QUIZ_ATTEMPT_STAFF_OPS_SPEC §5.3
 */

export type QuizAttemptStatusCarrier = {
  status?: string | null;
};

export function isQuizAttemptVoided(status?: string | null): boolean {
  return status === 'voided';
}

export function isQuizAttemptSubmittedTerminal(
  status?: string | null,
): boolean {
  return status === 'submitted' || status === 'expired';
}

export function quizAttemptCountsTowardSubmittedQuota(
  item: QuizAttemptStatusCarrier,
): boolean {
  if (isQuizAttemptVoided(item.status)) return false;
  return isQuizAttemptSubmittedTerminal(item.status);
}

export function isQuizAttemptVisibleInHistory(
  item: QuizAttemptStatusCarrier,
): boolean {
  return (
    quizAttemptCountsTowardSubmittedQuota(item) ||
    isQuizAttemptVoided(item.status)
  );
}

/** Có lần làm trước (quota hoặc voided) — nút 「Làm bài mới」. */
export function hasPriorQuizAttemptsForUi(
  items: QuizAttemptStatusCarrier[],
): boolean {
  return items.some((a) => isQuizAttemptVisibleInHistory(a));
}

export type AttemptScoreRow = {
  correctCount?: number | null;
  totalQuestions?: number | null;
  gradingSummary?: {
    correctCount?: number;
    totalQuestions?: number;
  } | null;
};

/** Khớp Gateway `isAttemptPerfectScore` + gradingSummary fallback. */
export function isAttemptPerfectScore(row: AttemptScoreRow): boolean {
  const summary = row.gradingSummary;
  const tc = Number(summary?.totalQuestions ?? row.totalQuestions);
  const cc = Number(summary?.correctCount ?? row.correctCount);
  if (!Number.isFinite(tc) || tc <= 0) return false;
  if (!Number.isFinite(cc)) return false;
  return cc === tc;
}

export function computeQuizAttemptsRemaining(
  maxAttempts: number | null,
  submittedCount: number,
): number | null {
  if (maxAttempts == null) return null;
  return Math.max(0, maxAttempts - submittedCount);
}
