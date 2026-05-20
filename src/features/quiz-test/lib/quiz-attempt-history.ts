import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';

/** Lấy assignmentId từ item lịch sử (flat, assignment.id, participant.snapshot). */
export function getHistoryAssignmentId(row: unknown): number | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;

  if (typeof r.assignmentId === 'number' && Number.isFinite(r.assignmentId)) {
    return r.assignmentId;
  }

  const assignment = r.assignment as { id?: unknown } | null | undefined;
  if (assignment && typeof assignment.id === 'number' && Number.isFinite(assignment.id)) {
    return assignment.id;
  }

  const participant = r.participant as { snapshot?: unknown } | null | undefined;
  const snap =
    (participant?.snapshot as Record<string, unknown> | undefined) ??
    (r.participantSnapshot as Record<string, unknown> | undefined);
  if (snap && typeof snap === 'object') {
    if (snap.mode === 'practice') return null;
    const aid = Number(snap.assignmentId);
    if (Number.isFinite(aid) && aid >= 1) return aid;
  }

  return null;
}

export function normalizeQuizAttemptHistoryItem(row: unknown): QuizAttemptHistoryItem | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const attemptPublicId =
    typeof r.attemptPublicId === 'string' ? r.attemptPublicId.trim() : '';
  const formPublicId = typeof r.formPublicId === 'string' ? r.formPublicId.trim() : '';
  if (!attemptPublicId || !formPublicId) return null;

  const grading = r.gradingSummary ?? r.grading;
  const gradingSummary =
    grading && typeof grading === 'object' && !Array.isArray(grading)
      ? (grading as QuizAttemptHistoryItem['gradingSummary'])
      : null;

  return {
    attemptPublicId,
    formPublicId,
    status: typeof r.status === 'string' ? r.status : 'in_progress',
    startedAt: typeof r.startedAt === 'string' ? r.startedAt : '',
    expiresAt: typeof r.expiresAt === 'string' ? r.expiresAt : '',
    submittedAt:
      r.submittedAt === null || r.submittedAt === undefined
        ? null
        : typeof r.submittedAt === 'string'
          ? r.submittedAt
          : null,
    remainingSeconds: Number(r.remainingSeconds) || 0,
    assignmentId: getHistoryAssignmentId(r),
    score: r.score == null ? null : Number(r.score),
    scoreDisplay:
      r.scoreDisplay == null
        ? null
        : typeof r.scoreDisplay === 'string'
          ? r.scoreDisplay
          : String(r.scoreDisplay),
    correctCount: r.correctCount == null ? null : Number(r.correctCount),
    totalQuestions: r.totalQuestions == null ? null : Number(r.totalQuestions),
    gradingSummary,
  };
}

export function normalizeQuizAttemptHistoryItems(raw: unknown): QuizAttemptHistoryItem[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) => normalizeQuizAttemptHistoryItem(row))
    .filter(Boolean) as QuizAttemptHistoryItem[];
}

export function filterSubmittedAttemptsForAssignment(
  items: QuizAttemptHistoryItem[],
  assignmentId: number,
): QuizAttemptHistoryItem[] {
  return items.filter((a) => {
    if (a.status !== 'submitted' && a.status !== 'expired') return false;
    const aid = a.assignmentId ?? getHistoryAssignmentId(a);
    if (aid == null) return false;
    return aid === assignmentId;
  });
}
