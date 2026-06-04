export type QuizAttemptPhase =
  | 'loading_form'
  | 'ready'
  | 'confirm_start'
  | 'starting'
  | 'attempting'
  | 'submitting'
  | 'done'
  | 'error';

export type QuizAttemptCloseReason = 'deadline' | 'manual' | null;

export const QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE =
  'Hết giờ làm bài. Hệ thống đã tự động nộp bài.';

export const QUIZ_ATTEMPT_DEADLINE_WAIT_MESSAGE =
  'Hết giờ làm bài. Hệ thống đang tự động nộp bài.';

/** Khóa sửa đáp án trên UI (hết giờ / đang nộp / đã nộp). */
export function isQuizAttemptEditingLocked(
  phase: QuizAttemptPhase,
  sessionLocked: boolean,
): boolean {
  if (sessionLocked) return true;
  return phase === 'submitting' || phase === 'done';
}

export function shouldAutoNavigateToResultDetail(
  closeReason: QuizAttemptCloseReason,
): boolean {
  return closeReason === 'deadline';
}
